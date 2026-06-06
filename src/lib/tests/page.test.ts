import { render, screen, fireEvent, waitFor, act } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Page from '../../routes/+page.svelte';
import { setupFetchMock } from '../../../tests/mocks/fetch';
import { settingsStore } from '../stores/randomizer';
import { CATEGORIES } from '../utils/categories';
import { get } from 'svelte/store';

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

describe('Main Page Component', () => {
    beforeEach(() => {
        localStorage.clear();
        settingsStore.set({
            activeCategories: ['car_class', 'manufacturer'],
            outputCount: 1,
            disabledAcquiredVia: [],
            lockedResults: {}
        });
        setupFetchMock();
        vi.clearAllMocks();

        // Mock navigator.clipboard
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockImplementation(() => Promise.resolve()),
            },
        });
    });

    it('rolls for results when button is clicked', async () => {
        render(Page);
        const rollButton = await screen.findByText(/^Roll$/i, {}, { timeout: 8000 });
        await act(() => fireEvent.click(rollButton));

        await waitFor(() => {
            expect(screen.getByText('Your Event')).toBeTruthy();
        }, { timeout: 8000 });
    });

    it('respects the output count limit (1-12)', async () => {
        render(Page);
        const input = await screen.findByLabelText(/Outputs/i, {}, { timeout: 8000 }) as HTMLInputElement;

        await act(() => fireEvent.change(input, { target: { value: '15' } }));
        expect(get(settingsStore).outputCount).toBe(1);

        await act(() => fireEvent.change(input, { target: { value: '5' } }));
        expect(get(settingsStore).outputCount).toBe(5);
    });

    it('locks results across rolls', async () => {
        render(Page);
        const rollButton = await screen.findByText(/^Roll$/i, {}, { timeout: 8000 });

        await act(() => fireEvent.click(rollButton));

        const firstResult = await waitFor(() => {
             const val = screen.getAllByText('Class').find(el => el.closest('.bg-neutral-900') && !el.closest('button'))
                ?.parentElement?.querySelector('.text-xl')?.textContent;
             if (!val) throw new Error('Result not found');
             return val;
        }, { timeout: 8000 });

        const lockButtons = await screen.findAllByTitle('Lock Category');
        await act(() => fireEvent.click(lockButtons[0]));

        expect(get(settingsStore).lockedResults['car_class']).toBeDefined();

        await act(() => fireEvent.click(rollButton));

        await waitFor(() => {
            const secondResult = screen.getAllByText('Class').find(el => el.closest('.bg-neutral-900') && !el.closest('button'))
                ?.parentElement?.querySelector('.text-xl')?.textContent;
            expect(secondResult).toBe(firstResult);
        }, { timeout: 8000 });
    });

    it('regression: shows grid layout for multiple outputs', async () => {
        settingsStore.update(s => ({ ...s, outputCount: 2 }));
        const { container } = render(Page);

        const rollButton = await screen.findByText(/^Roll$/i, {}, { timeout: 8000 });
        await act(() => fireEvent.click(rollButton));

        await waitFor(() => {
            const resultGrids = container.querySelectorAll('.grid-cols-1.sm\\:grid-cols-2');
            expect(resultGrids.length).toBeGreaterThan(0);
        }, { timeout: 8000 });
    });

    it('handles select all/none/default and other presets', async () => {
        render(Page);
        const allBtn = await screen.findByTitle('Select all categories', {}, { timeout: 8000 });
        const noneBtn = screen.getByTitle('Select no categories');
        const defaultBtn = screen.getByTitle('Standard balanced selection');
        const racingBtn = screen.getByTitle('Focused on the track experience');

        await act(() => fireEvent.click(screen.getByText(/^Roll$/i)));

        await act(() => fireEvent.click(noneBtn));
        expect(get(settingsStore).activeCategories.length).toBe(0);

        await act(() => fireEvent.click(allBtn));
        expect(get(settingsStore).activeCategories.length).toBe(CATEGORIES.length);

        await act(() => fireEvent.click(defaultBtn));
        expect(get(settingsStore).activeCategories).toContain('car_class');
        expect(get(settingsStore).activeCategories).toContain('weather');

        await act(() => fireEvent.click(racingBtn));
        expect(get(settingsStore).activeCategories).toContain('track');
        expect(get(settingsStore).activeCategories).not.toContain('weather');

        const playBtn = screen.getByTitle('Only Horizon Play categories');
        await act(() => fireEvent.click(playBtn));
        expect(get(settingsStore).activeCategories).toContain('horizon_play_type');
    });

    it('handles Acquired via filtering', async () => {
        render(Page);
        const autoshowCheckbox = await screen.findByLabelText('Autoshow', {}, { timeout: 8000 });

        await act(() => fireEvent.click(autoshowCheckbox));
        expect(get(settingsStore).disabledAcquiredVia).toContain('Autoshow');
    });

    it('toggles category selection', async () => {
        render(Page);
        await screen.findByText('Configuration', {}, { timeout: 8000 });

        const buttons = screen.getAllByRole('button');
        const classBtn = buttons.find(b => b.textContent?.trim() === 'Class');
        if (!classBtn) throw new Error('Class button not found');

        await act(() => fireEvent.click(classBtn));

        await waitFor(() => {
            expect(get(settingsStore).activeCategories).not.toContain('car_class');
        }, { timeout: 8000 });
    });

    it('shows error message on load failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (global.fetch as any).mockResolvedValueOnce({
            ok: false,
            statusText: 'Server Error',
            status: 500,
            text: async () => ''
        });

        render(Page);

        const errorMsg = await screen.findByText(/Failed to load data/i, {}, { timeout: 8000 });
        expect(errorMsg).toBeTruthy();
        consoleSpy.mockRestore();
    });

    it('handles locks and unlocks all results', async () => {
        render(Page);
        const rollButton = await screen.findByText(/^Roll$/i, {}, { timeout: 8000 });
        await act(() => fireEvent.click(rollButton));

        await waitFor(() => expect(screen.queryByText('Your Event')).toBeTruthy());

        const lockAllBtn = screen.getByText('Lock All');
        const unlockAllBtn = screen.getByText('Unlock All');

        await act(() => fireEvent.click(lockAllBtn));
        expect(Object.keys(get(settingsStore).lockedResults).length).toBeGreaterThan(0);

        await act(() => fireEvent.click(unlockAllBtn));
        expect(Object.keys(get(settingsStore).lockedResults).length).toBe(0);
    });

    it('displays complex results with || separator', async () => {
        settingsStore.update(s => ({
            ...s,
            activeCategories: ['specific_car']
        }));

        render(Page);
        const rollButton = await screen.findByText(/^Roll$/i, {}, { timeout: 8000 });
        await act(() => fireEvent.click(rollButton));

        await waitFor(() => {
            expect(screen.getByText(/Collection:/i)).toBeTruthy();
        }, { timeout: 8000 });
    });

    it('copies link to clipboard', async () => {
        render(Page);
        const rollButton = await screen.findByText(/^Roll$/i, {}, { timeout: 8000 });
        await act(() => fireEvent.click(rollButton));

        const copyBtn = await screen.findByTitle('Copy Link');
        await act(() => fireEvent.click(copyBtn));

        expect(navigator.clipboard.writeText).toHaveBeenCalled();
        expect(screen.getByText('Copied!')).toBeTruthy();
    });
});
