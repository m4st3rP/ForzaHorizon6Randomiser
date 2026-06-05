import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { RandomizerSettings } from '$lib/types';

const defaultSettings: RandomizerSettings = {
    activeCategories: [], // Empty means we should initialize to sensible defaults on first load
    outputCount: 1,
    disabledAcquiredVia: [],
    lockedResults: {}
};

function createPersistentStore<T>(key: string, initialValue: T) {
    // Initialize with the value from local storage if running in the browser
    let value = initialValue;
    if (browser) {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            try {
                const parsed = JSON.parse(storedValue);
                // Merge with initialValue to ensure all properties exist if schema changed
                value = { ...initialValue, ...parsed };
                
                // Ensure activeCategories exists and is an array
                if (!Array.isArray((value as any).activeCategories)) {
                    (value as any).activeCategories = [];
                }
                if (!Array.isArray((value as any).disabledAcquiredVia)) {
                    (value as any).disabledAcquiredVia = [];
                }
                if (!(value as any).lockedResults || typeof (value as any).lockedResults !== 'object') {
                    (value as any).lockedResults = {};
                }
            } catch (e) {
                console.error(`Error parsing stored value for ${key}`, e);
            }
        }
    }

    const store = writable<T>(value);

    // Subscribe to changes and update local storage
    if (browser) {
        store.subscribe((currentValue) => {
            localStorage.setItem(key, JSON.stringify(currentValue));
        });
    }

    return store;
}

export const settingsStore = createPersistentStore<RandomizerSettings>('randomizer-settings', defaultSettings);
