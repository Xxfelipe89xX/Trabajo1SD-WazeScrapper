const express = require('express');
const app = express();
const PORT = 3000;

const TAMANO_CACHE = 10; // Cambiar a 100 para comparar resultados

app.use(express.json());

class Cache {
    constructor(tamano) {
        this.tamano = tamano;
        this.cache = new Map();
        this.orden = [];
    }

    get(key) {
        if (!this.cache.has(key)) return null;

        // Política LRU: mover al final
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

// Endpoints

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

app.get('/claves', (req, res) => {
    res.json(cache.orden);
});

app.listen(PORT, () => {
    console.log(`Servidor de caché en puerto ${PORT}, política LRU, tamaño ${TAMANO_CACHE}`);
});
