const express = require('express');
const app = express();
const PORT = 3000;

const TAMANO_CACHE = 10;
const POLITICA = process.env.CACHE_POLICY || 'LRU'; // FIFO o LRU

app.use(express.json());

class Cache {
    constructor(tamano, politica) {
        this.tamano = tamano;
        this.politica = politica;
        this.cache = new Map();
        this.orden = [];
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        if (this.politica === 'LRU') {
            this.orden = this.orden.filter(k => k !== key);
            this.orden.push(key);
        }
        return this.cache.get(key);
    }

    set(key, value) {
        if (this.cache.has(key)) {
            if (this.politica === 'LRU') {
                this.orden = this.orden.filter(k => k !== key);
                this.orden.push(key);
            }
            this.cache.set(key, value);
            return;
        }

        if (this.cache.size >= this.tamano) {
            const oldest = this.orden.shift();
            this.cache.delete(oldest);
        }

        this.cache.set(key, value);
        this.orden.push(key);
    }
}

const cache = new Cache(TAMANO_CACHE, POLITICA);

app.post('/guardar', (req, res) => {
    const key = req.query.key;
    const value = req.body;
    if (!key || !value) return res.status(400).send("Faltan datos");
    cache.set(key, value);
    res.send("Guardado en caché");
});

app.get('/consultar', (req, res) => {
    const key = req.query.key;
    const value = cache.get(key);
    if (value) res.json(value);
    else res.status(404).send("No encontrado en caché");
});

app.listen(PORT, () => {
    console.log(`Servidor de caché en puerto ${PORT}, política ${POLITICA}`);
});
