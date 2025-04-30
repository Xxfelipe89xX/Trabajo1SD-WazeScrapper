const { MongoClient } = require("mongodb");
const fetch = require("node-fetch");

const uri = process.env.MONGO_URI || "mongodb://mongo:27017";
const dbName = "trafico";
const collectionName = "eventos";

let hits = 0;
let misses = 0;

async function getCiudadesDisponibles(collection) {
    return await collection.distinct("city");
}

async function consultaAleatoria(collection, ciudadesDisponibles) {
    // Selecciona solo una ciudad existente al azar
    const ciudad = ciudadesDisponibles[Math.floor(Math.random() * ciudadesDisponibles.length)];
    const key = `consulta:${ciudad}`;
    const cacheUrl = `http://cache:3000/consultar?key=${encodeURIComponent(key)}`;
    const start = Date.now();

    try {
        const cacheResponse = await fetch(cacheUrl);
        if (cacheResponse.status === 200) {
            hits++;
            const data = await cacheResponse.json();
            const tiempo = Date.now() - start;
            console.log(`[CACHÉ HIT] ${ciudad} → ${data.eventos?.length ?? data.length} eventos (${tiempo} ms)`);
        } else {
            misses++;
            const resultados = await collection.find({ city: ciudad }).limit(5).toArray();
            const tiempo = Date.now() - start;
            console.log(`[CACHÉ MISS] ${ciudad} → ${resultados.length} eventos desde MongoDB (${tiempo} ms)`);
            // Guardar en caché
            await fetch(`http://cache:3000/guardar?key=${encodeURIComponent(key)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventos: resultados })
            });
        }
        const total = hits + misses;
        console.log(`Hit rate: ${(hits / total * 100).toFixed(2)}% (${hits}/${total})`);
    } catch (err) {
        console.error(`[ERROR] ${ciudad}:`, err.message);
    }
}

async function main() {
    const client = new MongoClient(uri);
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);
    const ciudadesDisponibles = await getCiudadesDisponibles(collection);

    // Consulta cada 500ms (ajusta el tiempo si quieres más consultas)
    setInterval(() => {
        consultaAleatoria(collection, ciudadesDisponibles);
    }, 500);
}

main();


