import { vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

export function setupFetchMock() {
  const fetchMock = vi.fn().mockImplementation(async (url: string | URL | Request) => {
    const urlString = url.toString();
    let content = '';
    const filename = urlString.split('/').pop()?.split('?')[0];

    try {
      if (filename === 'cars.csv') {
        content = readFileSync(join(process.cwd(), 'tests/fixtures/cars.csv'), 'utf-8');
      } else if (filename === 'races.csv') {
        content = readFileSync(join(process.cwd(), 'tests/fixtures/races.csv'), 'utf-8');
      } else if (filename === 'car-types.csv') {
        content = 'Car_Type,Category\nType 1,Category 1\n';
      } else if (filename === 'track.csv') {
        content = 'Value\nTrack 1||Sub 1\nTrack 2||Sub 2\n';
      } else if (filename === 'horizon_play_type.csv') {
        content = 'Value\nPlay 1||Detail 1\nPlay 2||Detail 2\n';
      } else if (filename?.endsWith('.csv')) {
        content = readFileSync(join(process.cwd(), 'tests/fixtures/generic.csv'), 'utf-8');
      } else if (filename === 'data_date.txt') {
        content = '2026-05-30';
      } else {
        return {
            ok: false,
            statusText: 'Not Found: ' + filename,
            status: 404,
            text: async () => ''
        };
      }

      return {
        ok: true,
        text: async () => content,
        status: 200
      };
    } catch (e) {
      return {
        ok: false,
        statusText: 'Error: ' + (e as Error).message,
        status: 500,
        text: async () => ''
      };
    }
  });
  global.fetch = fetchMock;
}
