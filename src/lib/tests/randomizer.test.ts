import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// We need to mock $app/environment for the store
vi.mock('$app/environment', () => ({
    browser: true
}));

import { createPersistentStore, defaultSettings } from '../stores/randomizer';

describe('settingsStore logic', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('should initialize with default values if localStorage is empty', async () => {
        // Mock browser to false to test non-browser env
        const env = await import('$app/environment');
        (env as any).browser = false;
        const store = createPersistentStore('test-key-no-browser', defaultSettings);
        const state = get(store);
        expect(state.outputCount).toBe(1);
        (env as any).browser = true;
    });

    it('should initialize with default values if localStorage is empty (browser)', () => {
        const store = createPersistentStore('test-key', defaultSettings);
        const state = get(store);
        expect(state.outputCount).toBe(1);
        expect(state.activeCategories).toEqual([]);
    });

    it('should load values from localStorage', () => {
        const saved = { ...defaultSettings, outputCount: 10, activeCategories: ['test'] };
        localStorage.setItem('test-key', JSON.stringify(saved));

        const store = createPersistentStore('test-key', defaultSettings);
        const state = get(store);
        expect(state.outputCount).toBe(10);
        expect(state.activeCategories).toEqual(['test']);
    });

    it('should persist changes to localStorage', () => {
        const store = createPersistentStore('test-key', defaultSettings);
        store.update(s => ({ ...s, outputCount: 5 }));
        const stored = JSON.parse(localStorage.getItem('test-key') || '{}');
        expect(stored.outputCount).toBe(5);
    });

    it('should handle malformed JSON in localStorage', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        localStorage.setItem('test-key', '{ invalid json }');

        const store = createPersistentStore('test-key', defaultSettings);
        const state = get(store);

        expect(state).toEqual(defaultSettings);
        expect(consoleSpy).toHaveBeenCalled();
    });

    it('should sanitize loaded data', () => {
        const badData = {
            outputCount: 3,
            activeCategories: 'not an array',
            disabledAcquiredVia: null,
            lockedResults: 123
        };
        localStorage.setItem('test-key', JSON.stringify(badData));

        const store = createPersistentStore('test-key', defaultSettings);
        const state = get(store) as any;

        expect(state.outputCount).toBe(3);
        expect(state.activeCategories).toEqual([]);
        expect(state.disabledAcquiredVia).toEqual([]);
        expect(state.lockedResults).toEqual({});
    });
});
