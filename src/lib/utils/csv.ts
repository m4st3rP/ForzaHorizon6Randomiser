import Papa from 'papaparse';

export async function loadCsv<T>(url: string): Promise<T[]> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const text = await response.text();
    
    return new Promise((resolve, reject) => {
        Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim(),
            complete: (results) => {
                resolve(results.data as T[]);
            },
            error: (error: Error) => {
                reject(error);
            }
        });
    });
}
