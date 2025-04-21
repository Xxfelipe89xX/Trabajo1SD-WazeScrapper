const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const { interactWithPage } = require('./pageInteractor');
const { interceptResponses } = require('./trafficInterceptor');

function readCSVFile(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', data => results.push(data))
            .on('end', () => resolve(results))
            .on('error', err => reject(err));
    });
}

async function runScraper() {
    const urls = await readCSVFile('./cities.csv');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

    for (const { city, url } of urls) {
        const page = await browser.newPage();
        try {
            await page.goto(url, { waitUntil: 'load', timeout: 0 });
            await interactWithPage(page);
            await interceptResponses(page, city);
        } catch (err) {
            console.error(`Error con ${city}:`, err);
        } finally {
            await page.close();
        }
    }

    await browser.close();
}
// Al final de scraper.js
setInterval(runScraper, 5 * 60 * 1000); // Cada 10 minutos
runScraper().catch(console.error);
