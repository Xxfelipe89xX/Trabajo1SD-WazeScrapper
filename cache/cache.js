const express = require('express');
const app = express();
const PORT = 3000;
const { Client } = require('@elastic/elasticsearch');

const TAMANO_CACHE = 15; // Cambiar a 100 para comparar resultados

app.use(express.json());

class Cache {
    constructor(tamano) {
        this.tamano = tamano;
        this.cache = new Map();
        this.orden = [];
    }

    get(key) {
        if (!this.cache.has(key)) return null;

        this.orden = this.orden.filter(k => k !== key);
        this.orden.push(key);
        return this.cache.get(key);
    }

    set(key, value) {
        if (this.cache.has(key)) {
            // Actualizar orden de acceso
            this.orden = this.orden.filter(k => k !== key);
            this.orden.push(key);
            this.cache.set(key, value);
            return;
        }

        if (this.cache.size >= this.tamano) {
            const claveAntigua = this.orden.shift();
            this.cache.delete(claveAntigua);
        }

        this.cache.set(key, value);
        this.orden.push(key);
    }
}

const cache = new Cache(TAMANO_CACHE);
const ELASTIC_URI = process.env.ELASTIC_URI || 'http://localhost:9200';
const elasticClient = new Client({ node: ELASTIC_URI });

let hits = 0;
let misses = 0;

// Endpoints

app.post('/guardar', (req, res) => {
    const key = req.query.key;
    const value = req.body;
    if (!key || !value) return res.status(400).send("Faltan datos");
    cache.set(key, value);
    res.send("Guardado en caché");
});

app.get('/consultar', async (req, res) => {
    const key = req.query.key;
    const tipo = req.query.tipo;
    let cacheKey = tipo ? `${tipo}:${key}` : key;
    let value = cache.get(cacheKey);
    if (value) {
        hits++;
        res.json({ tipo: 'hit', value });
    } else {
        misses++;
        // Consultar a Elasticsearch según el tipo de consulta
        let tipoDoc;
        if (tipo === 'comuna') tipoDoc = 'conteo_comuna';
        else if (tipo === 'evento') tipoDoc = 'conteo_tipo';
        else if (tipo === 'fecha') tipoDoc = 'conteo_fecha';
        else tipoDoc = null;
        try {
            const must = [ { match: { campo: key } } ];
            if (tipoDoc) must.push({ match: { tipo: tipoDoc } });
            const result = await elasticClient.search({
                index: 'eventos_procesados',
                body: {
                    query: {
                        bool: { must }
                    }
                }
            });
            if (result.hits.hits.length > 0) {
                value = result.hits.hits.map(hit => hit._source);
                cache.set(cacheKey, value);
                res.json({ tipo: 'miss', value });
            } else {
                res.status(404).send("No encontrado en caché ni en Elasticsearch");
            }
        } catch (err) {
            res.status(500).send("Error consultando Elasticsearch");
        }
    }
});

// Consulta automática por comuna
app.get('/consultar/comuna/:comuna', async (req, res) => {
    const comuna = req.params.comuna;
    const cacheKey = `comuna:${comuna}`;
    let value = cache.get(cacheKey);
    if (value) {
        hits++;
        res.json({ tipo: 'hit', value });
    } else {
        misses++;
        try {
            const result = await elasticClient.search({
                index: 'eventos_procesados',
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { campo: comuna } },
                                { match: { tipo: 'conteo_comuna' } }
                            ]
                        }
                    }
                }
            });
            if (result.hits.hits.length > 0) {
                value = result.hits.hits.map(hit => hit._source);
                cache.set(cacheKey, value);
                res.json({ tipo: 'miss', value });
            } else {
                res.status(404).send("No encontrado en caché ni en Elasticsearch");
            }
        } catch (err) {
            res.status(500).send("Error consultando Elasticsearch");
        }
    }
});

app.get('/consultar/evento/:evento', async (req, res) => {
    const evento = req.params.evento;
    const cacheKey = `evento:${evento}`;
    let value = cache.get(cacheKey);
    if (value) {
        hits++;
        res.json({ tipo: 'hit', value });
    } else {
        misses++;
        try {
            const result = await elasticClient.search({
                index: 'eventos_procesados',
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { campo: evento } },
                                { match: { tipo: 'conteo_tipo' } }
                            ]
                        }
                    }
                }
            });
            if (result.hits.hits.length > 0) {
                value = result.hits.hits.map(hit => hit._source);
                cache.set(cacheKey, value);
                res.json({ tipo: 'miss', value });
            } else {
                res.status(404).send("No encontrado en caché ni en Elasticsearch");
            }
        } catch (err) {
            res.status(500).send("Error consultando Elasticsearch");
        }
    }
});
app.get('/consultar/fecha/:fecha', async (req, res) => {
    const fecha = req.params.fecha;
    const cacheKey = `fecha:${fecha}`;
    let value = cache.get(cacheKey);
    if (value) {
        hits++;
        res.json({ tipo: 'hit', value });
    } else {
        misses++;
        try {
            const result = await elasticClient.search({
                index: 'eventos_procesados',
                body: {
                    query: {
                        bool: {
                            must: [
                                { match: { campo: fecha } },
                                { match: { tipo: 'conteo_fecha' } }
                            ]
                        }
                    }
                }
            });
            if (result.hits.hits.length > 0) {
                value = result.hits.hits.map(hit => hit._source);
                cache.set(cacheKey, value);
                res.json({ tipo: 'miss', value });
            } else {
                res.status(404).send("No encontrado en caché ni en Elasticsearch");
            }
        } catch (err) {
            res.status(500).send("Error consultando Elasticsearch");
        }
    }
});

app.get('/stats', (req, res) => {
    res.json({ hits, misses });
});

app.get('/claves', (req, res) => {
    res.json(cache.orden);
});
app.get('/ciudades', async (req, res) => {
    try {
        const client = new MongoClient(MONGO_URI);
        await client.connect();
        const collection = client.db("trafico").collection("eventos");
        const ciudades = await collection.distinct("city");
        res.json(ciudades);
        await client.close();
    } catch (err) {
        res.status(500).send("Error al obtener ciudades");
    }
});

async function consultasAutomaticasDesdeElastic() {
    let intentos = 0;
    const maxIntentos = 5; // o más
    while (intentos < maxIntentos) {
        try {
            await elasticClient.ping();
            const health = await elasticClient.cluster.health();
            const status = health.status || (health.body && health.body.status);
            console.log('Estado del clúster:', status);
            if (status === 'green' || status === 'yellow') {
                break; // Sale inmediatamente si el estado es aceptable
            } else {
                intentos++;
                console.log('Esperando a que Elasticsearch esté listo...');
                await new Promise(r => setTimeout(r, 5000));
            }
        } catch (e) {
            intentos++;
            console.log('Esperando a que Elasticsearch esté listo...');
            await new Promise(r => setTimeout(r, 5000));
        }
    }
    if (intentos === maxIntentos) {
        console.error('No se pudo conectar a Elasticsearch después de varios intentos.');
        return;
    }

    const consultas = [
        { tipo: 'comuna', tipoDoc: 'conteo_comuna' },
        { tipo: 'evento', tipoDoc: 'conteo_tipo' },
        { tipo: 'fecha', tipoDoc: 'conteo_fecha' }
    ];
    const valoresPorTipo = {};
    for (const consulta of consultas) {
        try {
            const result = await elasticClient.search({
                index: 'eventos_procesados',
                size: 0,
                body: {
                    query: {
                        match: { tipo: consulta.tipoDoc }
                    },
                    aggs: {
                        valores: { terms: { field: 'campo.keyword', size: 100 } }
                    }
                }
            });
            valoresPorTipo[consulta.tipo] = result.aggregations.valores.buckets.map(b => b.key);
        } catch (err) {
            valoresPorTipo[consulta.tipo] = [];
            console.error(`[ERROR] Obteniendo valores únicos de campo para ${consulta.tipo}:`, err.message);
        }
    }
    function pickRandom(arr, n) {
        const res = [];
        const copy = [...arr];
        for (let i = 0; i < n && copy.length > 0; i++) {
            const idx = Math.floor(Math.random() * copy.length);
            res.push(copy.splice(idx, 1)[0]);
        }
        return res;
    }
    setInterval(async () => {
        for (const consulta of consultas) {
            const valores = valoresPorTipo[consulta.tipo];
            if (!valores || valores.length === 0) continue;
            const randoms = pickRandom(valores, 3);
            for (const valor of randoms) {
                const cacheKey = `${consulta.tipo}:${valor}`;
                if (cache.get(cacheKey)) {
                    hits++;
                    console.log(`[HIT] ${cacheKey} ya estaba en caché`);
                    continue;
                }
                try {
                    const docs = await elasticClient.search({
                        index: 'eventos_procesados',
                        body: {
                            query: {
                                bool: {
                                    must: [
                                        { match: { campo: valor } },
                                        { match: { tipo: consulta.tipoDoc } }
                                    ]
                                }
                            }
                        }
                    });
                    if (docs.hits.hits.length > 0) {
                        const value = docs.hits.hits.map(hit => hit._source);
                        cache.set(cacheKey, value);
                        misses++;
                        console.log(`[MISS] ${cacheKey} agregado al caché`);
                    } else {
                        misses++;
                        console.log(`[MISS] ${cacheKey} sin resultados en Elasticsearch.`);
                    }
                } catch (err) {
                    console.error(`[ERROR] Consulta automática:`, err.message);
                }
            }
        }
    }, 10000);
}

app.listen(PORT, async () => {
    console.log(`Servidor de caché en puerto ${PORT}, política LRU, tamaño ${TAMANO_CACHE}`);
    await consultasAutomaticasDesdeElastic();
});
