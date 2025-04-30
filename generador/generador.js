const { MongoClient } = require("mongodb");
const fetch = require("node-fetch");

const uri = process.env.MONGO_URI || "mongodb://mongo:27017";
const dbName = "trafico";
const collectionName = "eventos";

const comunas = [
    "Santiago", "Maipú", "Providencia", "Puente Alto", "Las Condes",
    "Ñuñoa", "Recoleta", "San Miguel", "La Florida", "Pudahuel",
    "La Pintana", "Renca", "Estación Central", "Peñalolén", "Independencia"
];

let index = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generarConsultas() {
    const client = new MongoClient(uri);
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    while (true) {
        const comuna = comunas[index];
        const key = `consulta:${comuna}`;
        const cacheUrl = `http://cache:3000/consultar?key=${encodeURIComponent(key)}`;
        const start = Date.now();

        try {
            const cacheResponse = await fetch(cacheUrl);

            if (cacheResponse.status === 200) {
                const data = await cacheResponse.json();
                const tiempo = Date.now() - start;
                console.log(`[CACHÉ HIT] ${comuna} → ${data.eventos?.length ?? data.length} eventos (${tiempo} ms)`);
            } else {
                const resultados = await collection.find({ city: comuna }).limit(5).toArray();
                const tiempo = Date.now() - start;
                console.log(`[CACHÉ MISS] ${comuna} → ${resultados.length} eventos desde MongoDB (${tiempo} ms)`);

                // Guardar en caché
                await fetch(`http://cache:3000/guardar?key=${encodeURIComponent(key)}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ eventos: resultados })
                });
            }
        } catch (err) {
            console.error(`[ERROR] ${comuna}:`, err.message);
        }

        index = (index + 1) % comunas.length;
        await sleep(1000); // 5 segundos
    }
}

generarConsultas().catch(console.error);
