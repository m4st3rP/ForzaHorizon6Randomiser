import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadCsv } from '../utils/csv';
import Papa from 'papaparse';

describe('csv loader', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should parse valid CSV data', async () => {
        const mockCsv = 'header1,header2\nval1,val2\nval3,val4';
        (global.fetch as any).mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockCsv)
        });

        const data = await loadCsv<{header1: string, header2: string}>('/test.csv');
        expect(data).toHaveLength(2);
        expect(data[0]).toEqual({ header1: 'val1', header2: 'val2' });
        expect(data[1]).toEqual({ header1: 'val3', header2: 'val4' });
    });

    it('should trim headers', async () => {
        const mockCsv = ' header1 ,  header2 \nval1,val2';
        (global.fetch as any).mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockCsv)
        });

        const data = await loadCsv<{header1: string, header2: string}>('/test.csv');
        expect(data[0]).toEqual({ header1: 'val1', header2: 'val2' });
    });

    it('should skip empty lines', async () => {
        const mockCsv = 'header1\nval1\n\nval2\n';
        (global.fetch as any).mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(mockCsv)
        });

        const data = await loadCsv<{header1: string}>('/test.csv');
        expect(data).toHaveLength(2);
    });

    it('should throw error if fetch fails', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: false,
            statusText: 'Not Found'
        });

        await expect(loadCsv('/missing.csv')).rejects.toThrow('Failed to fetch /missing.csv: Not Found');
    });

    it('should handle PapaParse errors', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            text: () => Promise.resolve('some,csv')
        });

        const originalParse = Papa.parse;
        Papa.parse = vi.fn().mockImplementation((text, config) => {
            config.error(new Error('Parse Error'));
        });

        await expect(loadCsv('/bad.csv')).rejects.toThrow('Parse Error');

        Papa.parse = originalParse;
    });
});
