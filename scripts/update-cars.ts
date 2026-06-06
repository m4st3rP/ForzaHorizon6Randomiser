import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

async function updateCars() {
    console.log('Fetching car data from https://forza.net/fh6cars...');
    try {
        const response = await fetch('https://forza.net/fh6cars');
        const html = await response.text();
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const table = document.querySelector('table');
        if (!table) {
            throw new Error('Could not find car table on the page');
        }

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const cars = rows.map(row => {
            const cells = Array.from(row.querySelectorAll('td'));
            return {
                'Make': cells[0]?.textContent?.trim() || '',
                'Car Name': cells[1]?.textContent?.trim() || '',
                'Car Type': cells[2]?.textContent?.trim() || '',
                'Car Class': cells[3]?.textContent?.trim() || '',
                'Country': cells[4]?.textContent?.trim() || '',
                'Collection': cells[5]?.textContent?.trim() || '',
                'Add-Ons': cells[6]?.textContent?.trim() || ''
            };
        });

        console.log(`Found ${cars.length} cars.`);

        const csv = Papa.unparse(cars);
        const outputPath = path.join(process.cwd(), 'static/data/cars.csv');
        fs.writeFileSync(outputPath, csv);
        console.log(`Saved to ${outputPath}`);

        const datePath = path.join(process.cwd(), 'static/data/data_date.txt');
        fs.writeFileSync(datePath, new Date().toISOString().split('T')[0]);
        console.log(`Updated data date to ${new Date().toISOString().split('T')[0]}`);

    } catch (error) {
        console.error('Error updating cars:', error);
        process.exit(1);
    }
}

updateCars();
