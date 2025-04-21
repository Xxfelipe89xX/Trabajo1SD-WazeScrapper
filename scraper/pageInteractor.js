async function interactWithPage(page) {
    try {
        const button = await page.waitForSelector('.waze-tour-tooltip__acknowledge', { visible: true, timeout: 5000 });
        if (button) {
            await button.click();
            await new Promise(r => setTimeout(r, 2000));
        }

        await page.waitForSelector('.leaflet-control-zoom-out', { visible: true });
        for (let i = 0; i < 3; i++) {
            await page.click('.leaflet-control-zoom-out');
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (error) {
        console.error('Error interactuando con la página:', error);
    }
}
module.exports = { interactWithPage };
