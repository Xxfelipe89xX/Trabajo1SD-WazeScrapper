const { processTrafficData } = require('./services/trafficProcessor');

async function interceptResponses(page, city) {
    let lastResponse = null;

    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/api/georss')) {
            lastResponse = response;
        }
    });

    await new Promise(resolve => setTimeout(resolve, 10000));

    if (lastResponse) {
        try {
            const data = await lastResponse.json().catch(() => null);
            if (data) {
                processTrafficData(data, city);
            } else {
                console.error('Respuesta inválida');
            }
        } catch (error) {
            console.error('Error al procesar respuesta:', error);
        }
    } else {
        console.log('No se interceptó respuesta relevante');
    }
}

module.exports = { interceptResponses };
