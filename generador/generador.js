const { MongoClient } = require("mongodb");

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = "trafico";
const collectionName = "eventos";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generarConsultas() {
    const client = new MongoClient(uri);
    await client.connect();
    const collection = client.db(dbName).collection(collectionName);

    while (true) {
        const comuna = comunas[Math.floor(Math.random() * comunas.length)];
        const key = `consulta:${comuna}`;
        const resultados = await collection.find({ ciudad: comuna }).limit(5).toArray();
        console.log(`Consulta: ${comuna} → ${resultados.length} eventos`);

        // Simula envío al cache
        const res = await fetch(`http://cache:3000/guardar?key=${encodeURIComponent(key)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventos: resultados })
        });

        // Esperar exactamente 15 segundos
        await sleep(15000);
    }
}

const comunas = [
    "Santiago", "Maipú", "Providencia", "Puente Alto", "Las Condes", "Ñuñoa",
    "Recoleta", "San Miguel", "La Florida", "Pudahuel", "La Pintana", "Renca",
    "Estación Central", "Peñalolén", "Independencia"
];

generarConsultas().catch(console.error);
