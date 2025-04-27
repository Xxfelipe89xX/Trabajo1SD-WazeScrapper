const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = "trafico";
const collectionName = "eventos";

let cliente = null;
let baseDatos = null;

// Función para conectar a MongoDB una sola vez
async function conectar() {
    if (!cliente) {
        cliente = new MongoClient(uri);
        await cliente.connect();
        baseDatos = cliente.db(dbName);
        console.log('Conexión establecida con MongoDB.');
    }
    return baseDatos;
}

// Insertar múltiples eventos en Mongo
async function insertarEventos(eventosConCiudad) {
    const db = await conectar();
    const coleccion = db.collection(collectionName);

    if (eventosConCiudad.length > 0) {
        await coleccion.insertMany(eventosConCiudad);
        console.log(`Insertados ${eventosConCiudad.length} eventos en MongoDB.`);
    } else {
        console.log('No hay eventos para insertar.');
    }
}

// Cerrar la conexión (opcional si quieres luego agregarlo)
async function cerrarConexion() {
    if (cliente) {
        await cliente.close();
        cliente = null;
        baseDatos = null;
        console.log('Conexión a MongoDB cerrada.');
    }
}

module.exports = { insertarEventos, cerrarConexion };
