const { insertarEventos } = require('../../almacenamiento/almacenamiento');

async function processTrafficData(data, ciudad) {
    try {
        const eventos = [...(data.alerts || []), ...(data.jams || [])];
        const eventosConCiudad = eventos.map(e => ({ ...e, ciudad }));

        if (eventosConCiudad.length > 0) {
            await insertarEventos(eventosConCiudad);
            console.log(`Insertados ${eventosConCiudad.length} eventos de ${ciudad}`);
        } else {
            console.log(`No hay eventos para insertar para ${ciudad}`);
        }
    } catch (err) {
        console.error("Error procesando datos de tráfico:", err);
    }
}

module.exports = { processTrafficData };
