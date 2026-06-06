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

        // Try to find the "Updated DD MMM YYYY" string in the page
        const bodyText = document.body.textContent || '';
        const dateMatch = bodyText.match(/Updated\s+(\d{1,2}\s+[A-Za-z]+\s+\d{4})/);
        let displayDate = new Date().toISOString().split('T')[0];

        if (dateMatch && dateMatch[1]) {
            const parsedDate = new Date(dateMatch[1]);
            if (!isNaN(parsedDate.getTime())) {
                // Format as YYYY-MM-DD
                displayDate = parsedDate.toISOString().split('T')[0];
            } else {
                displayDate = dateMatch[1];
            }
        }

        const datePath = path.join(process.cwd(), 'static/data/data_date.txt');
        fs.writeFileSync(datePath, displayDate);
        console.log(`Updated data date to ${displayDate}`);

    } catch (error) {
        console.error('Error updating cars:', error);
        process.exit(1);
    }
}

updateCars();
