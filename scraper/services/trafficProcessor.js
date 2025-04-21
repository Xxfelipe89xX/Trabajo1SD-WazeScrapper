const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = "trafico";
const collectionName = "eventos";

async function processTrafficData(data, ciudad) {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const collection = client.db(dbName).collection(collectionName);
        const eventos = [...(data.alerts || []), ...(data.jams || [])];
        const eventosConCiudad = eventos.map(e => ({ ...e, ciudad }));
        if (eventosConCiudad.length > 0) {
            await collection.insertMany(eventosConCiudad);
            console.log(`Insertados ${eventosConCiudad.length} eventos de ${ciudad}`);
        }
    } catch (err) {
        console.error("Error guardando en MongoDB:", err);
    } finally {
        await client.close();
    }
}

module.exports = { processTrafficData };
