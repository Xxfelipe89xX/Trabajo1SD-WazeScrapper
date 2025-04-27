const express = require('express');
const app = express();
const PORT = 3000;

// Configuración actual
const TAMANO_CACHE = 10; // Tamaño para LRU
const POLITICA = process.env.CACHE_POLICY || 'LRU'; // FIFO o LRU

// const TAMANO_CACHE = 15;
// const POLITICA = process.env.CACHE_POLICY || 'FIFO';

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
            // Si es política LRU, movemos la clave al final
            this.orden = this.orden.filter(k => k !== key);
            this.orden.push(key);
        }
        // En FIFO no se hace nada especial en get
        return this.cache.get(key);
    }

    set(key, value) {
        if (this.cache.has(key)) {
            if (this.politica === 'LRU') {
                // Si ya existe y es LRU, actualizar el orden
                this.orden = this.orden.filter(k => k !== key);
                this.orden.push(key);
            }
            // Actualizar el valor
            this.cache.set(key, value);
            return;
        }

        // Si el cache está lleno
        if (this.cache.size >= this.tamano) {
            const claveAEliminar = this.orden.shift(); // Siempre sacamos el primero en la lista
            this.cache.delete(claveAEliminar);
        }

        // Insertamos al final
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

app.get('/claves', (req, res) => {
    res.json(cache.orden);
});

app.listen(PORT, () => {
    console.log(`Servidor de caché en puerto ${PORT}, política ${POLITICA}`);
});
