import { render, screen, fireEvent, waitFor, act } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Page from '../../routes/+page.svelte';
import { setupFetchMock } from '../../../tests/mocks/fetch';
import { settingsStore } from '../stores/randomizer';

// Mock $app/navigation
vi.mock('$app/navigation', () => ({
    goto: vi.fn(),
    replaceState: vi.fn()
}));

// Mock $app/environment
vi.mock('$app/environment', () => ({
    browser: true
}));

// Mock page store
vi.mock('$app/stores', () => ({
    page: {
        subscribe: vi.fn((fn: any) => {
            fn({ url: new URL('http://localhost/') });
            return () => {};
        })
    }
}));

// Mock $app/paths
vi.mock('$app/paths', () => ({
    base: ''
}));

describe('Category Sub-types', () => {
    beforeEach(() => {
        localStorage.clear();
        settingsStore.set({
            activeCategories: ['broader_car_categories'],
            outputCount: 1,
            disabledAcquiredVia: [],
            lockedResults: {}
        });
        setupFetchMock();
        vi.clearAllMocks();
    });

    it('displays sub-types below broader car categories', async () => {
        render(Page);
        const rollButton = await screen.findByText(/^Roll$/i, {}, { timeout: 8000 });
        await act(() => fireEvent.click(rollButton));

        await waitFor(() => {
            // Check for any of the expected broader categories from setupFetchMock + fixtures
            const muscleResult = screen.queryByText('Muscle');
            const sportsCarsResult = screen.queryByText('Sports Cars');
            const supercarsResult = screen.queryByText('Supercars');

            expect(muscleResult || sportsCarsResult || supercarsResult).toBeTruthy();

            if (muscleResult) {
                expect(screen.getByText('Classic Muscle')).toBeTruthy();
            }
            if (sportsCarsResult) {
                expect(screen.getByText('Modern Sports Cars, Retro Sports Cars')).toBeTruthy();
            }
            if (supercarsResult) {
                // In setupFetchMock, Supercars maps to Retro Supercars, Modern Supercars, Hypercars
                expect(screen.getByText('Hypercars, Modern Supercars, Retro Supercars')).toBeTruthy();
            }
        }, { timeout: 8000 });
    });
});
