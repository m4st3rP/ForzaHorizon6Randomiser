<script lang="ts">
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import { loadCsv } from '$lib/utils/csv';
    import { settingsStore } from '$lib/stores/randomizer';
    import { mulberry32, seedToNumber, generateSeed } from '$lib/utils/selector';
    import { CATEGORIES } from '$lib/utils/categories';
    import type { Car, Race, CategoryResult, CarType, OptionData } from '$lib/types';

    let cars: Car[] = $state([]);
    let races: Race[] = $state([]);
    let carTypes: CarType[] = $state([]);
    let dataDate: string = $state('');
    let loading = $state(true);
    let error: string | null = $state(null);

    let unlockedResults: CategoryResult[] = $state([]);
    let results = $derived.by(() => {
        const activeCatIds = $settingsStore.activeCategories || [];
        return unlockedResults.map(r => {
            if ($settingsStore.lockedResults[r.categoryId] && activeCatIds.includes(r.categoryId)) {
                return {
                    ...r,
                    results: $settingsStore.lockedResults[r.categoryId]
                };
            }
            return r;
        }).filter(r => activeCatIds.includes(r.categoryId));
    });
    let currentSeed: string = $state('');

    // Extracted dynamic options
    let allAcquiredViaMethods: string[] = $state([]);

    // Base options from simple CSVs
    let baseOptions: Record<string, string[]> = $state({});

    // Filtered cars based on Collection logic
    let filteredCars = $derived(cars.filter(c => {
        if (!c['Collection']) return true;
        const methods = c['Collection'].split(',').map(s => s.trim()).filter(Boolean);
        if (methods.length === 0) return true;
        return methods.some(m => !($settingsStore.disabledAcquiredVia || []).includes(m));
    }));

    // Dynamic options extracted from data
    let dynamicOptions = $derived.by(() => {
        const opts = { ...baseOptions };
        if (!filteredCars.length) return opts;

        opts['manufacturer'] = [...new Set(filteredCars.map(c => c.Make).filter(Boolean))].sort();
        
        const allYears = filteredCars.map(c => {
            const match = String(c['Car Name']).match(/^(\d{4})/);
            return match ? parseInt(match[1]) : null;
        }).filter(Boolean) as number[];

        opts['year'] = [...new Set(allYears.map(y => String(y)))].sort();

        opts['decades'] = [...new Set(allYears.map(y => `${Math.floor(y / 10) * 10}s`))].sort();

        opts['countries'] = [...new Set(filteredCars.map(c => c.Country).filter(Boolean))].sort();

        opts['specific_car'] = filteredCars.map(c => {
            const acquired = c['Collection'] ? c['Collection'].trim() : '';
            const addons = c['Add-Ons'] ? c['Add-Ons'].trim() : '';
            let info = '';
            if (acquired && addons) info = `Collection: ${acquired} | Add-Ons: ${addons}`;
            else if (acquired) info = `Collection: ${acquired}`;
            else if (addons) info = `Add-Ons: ${addons}`;

            return info ? `${c['Car Name']}||${info}` : c['Car Name'];
        });

        opts['track'] = races.map(r => r.Name);
        opts['tracktype'] = [...new Set(races.map(r => r.Type).filter(Boolean))].sort();
        opts['track_subtype'] = [...new Set(races.map(r => r.Subtype).filter(Boolean))].sort();

        opts['car_type'] = [...new Set(cars.map(c => c['Car Type']).filter(Boolean))].sort();

        const broaderCategoriesMap = new Map<string, Set<string>>();
        cars.forEach(c => {
            const mapping = carTypes.find(ct => ct.Car_Type === c['Car Type']);
            if (mapping) {
                if (!broaderCategoriesMap.has(mapping.Category)) {
                    broaderCategoriesMap.set(mapping.Category, new Set());
                }
                broaderCategoriesMap.get(mapping.Category)!.add(mapping.Car_Type);
            }
        });

        opts['broader_car_categories'] = Array.from(broaderCategoriesMap.keys()).sort().map(cat => {
            const subTypes = Array.from(broaderCategoriesMap.get(cat)!).sort().join(', ');
            return `${cat}||${subTypes}`;
        });

        return opts;
    });

    onMount(async () => {
        try {
            // First load the main datasets
            const [loadedCars, loadedRaces, loadedCarTypes] = await Promise.all([
                loadCsv<Car>(`${base}/data/cars.csv`),
                loadCsv<Race>(`${base}/data/races.csv`),
                loadCsv<CarType>(`${base}/data/car_type_mapping.csv`),
            ]);
            cars = loadedCars;
            races = loadedRaces;
            carTypes = loadedCarTypes;

            // Load the small standalone option lists
            const simpleCategories = [
                'car_class', 'stock_tuned', 'car_value', 'drivetrain',
                'rarity', 'camera', 'laps', 'season', 'weather', 'time_of_day',
                'horizon_play_type', 'horizon_track_type', 'horizon_class', 'horizon_drivetrain', 'horizon_collisions',
                'horizon_special'
            ];

            await Promise.all(simpleCategories.map(async (catId) => {
                const data = await loadCsv<OptionData>(`${base}/data/${catId}.csv`);
                baseOptions[catId] = data.map(row => row.Value).filter(Boolean);
            }));

            // Extract all possible Collection methods
            const methodsSet = new Set<string>();
            cars.forEach(c => {
                if (c['Collection']) {
                    const methods = c['Collection'].split(',').map(s => s.trim()).filter(Boolean);
                    methods.forEach(m => methodsSet.add(m));
                }
            });
            allAcquiredViaMethods = Array.from(methodsSet).sort();

            // Initialize store if empty
            if (!$settingsStore.activeCategories || $settingsStore.activeCategories.length === 0) {
                // Enable some typical defaults
                $settingsStore.activeCategories = ['car_class', 'car_type', 'tracktype', 'season', 'time_of_day', 'weather'];
            }

            try {
                const dateRes = await fetch(`${base}/data/data_date.txt`);
                if (dateRes.ok) dataDate = await dateRes.text();
            } catch (e) {
                console.error('Failed to load data date', e);
            }

            loading = false;

            // Check URL for seed
            const urlParams = new URLSearchParams(window.location.search);
            const seedParam = urlParams.get('seed');
            if (seedParam) {
                currentSeed = seedParam;
                roll(currentSeed);
            } else {
                roll();
            }
        } catch (err) {
            console.error('Data load error:', err);
            error = "Failed to load data: " + (err instanceof Error ? err.message : String(err));
            loading = false;
        }
    });

    function getOptionsForCategory(categoryId: string): string[] {
        return dynamicOptions[categoryId] || [];
    }

    function roll(seed?: string) {
        if (!seed) {
            seed = generateSeed();
            
            // Update URL without reloading
            const url = new URL(window.location.href);
            url.searchParams.set('seed', seed);
            window.history.pushState({}, '', url.toString());
        }
        
        currentSeed = seed;
        const prng = mulberry32(seedToNumber(seed));

        const outputCount = $settingsStore.outputCount || 1;
        
        const newResults: CategoryResult[] = [];

        // Iterate over CATEGORIES to maintain their original group order
        for (const def of CATEGORIES) {
            const catId = def.id;
            // Always roll for all categories so we have values if they are unlocked later
            const opts = getOptionsForCategory(catId);
            if (opts.length === 0) continue;

            const selectedValues: string[] = [];
            
            if (opts.length > 0) {
                for (let i = 0; i < outputCount; i++) {
                    // Roll index from the full list of options to allow duplicates
                    const index = Math.floor(prng() * opts.length);
                    selectedValues.push(opts[index]);
                }
            }

            newResults.push({
                categoryId: catId,
                label: def.label,
                results: selectedValues,
                group: def.group
            });
        }

        unlockedResults = newResults;
    }

    function toggleCategory(catId: string) {
        settingsStore.update(s => {
            const arr = s.activeCategories || [];
            const lockedResults = { ...s.lockedResults };
            if (arr.includes(catId)) {
                delete lockedResults[catId];
                return {
                    ...s,
                    activeCategories: arr.filter(v => v !== catId),
                    lockedResults
                };
            } else {
                return { ...s, activeCategories: [...arr, catId] };
            }
        });
    }

    function toggleLock(catId: string) {
        settingsStore.update(s => {
            const lockedResults = { ...s.lockedResults };
            if (lockedResults[catId]) {
                delete lockedResults[catId];
            } else {
                const result = results.find(r => r.categoryId === catId);
                if (result) {
                    lockedResults[catId] = [...result.results];
                }
            }
            return { ...s, lockedResults };
        });
    }

    function lockAll() {
        settingsStore.update(s => {
            const lockedResults = { ...s.lockedResults };
            results.forEach(r => {
                lockedResults[r.categoryId] = [...r.results];
            });
            return { ...s, lockedResults };
        });
    }

    function unlockAll() {
        settingsStore.update(s => ({ ...s, lockedResults: {} }));
    }

    function changeOutputCount(e: Event) {
        const val = parseInt((e.target as HTMLInputElement).value);
        if (val > 0 && val <= 12) {
            settingsStore.update(s => ({ ...s, outputCount: val }));
        }
    }

    function toggleAcquiredVia(method: string) {
        settingsStore.update(s => {
            const arr = s.disabledAcquiredVia || [];
            if (arr.includes(method)) {
                return { ...s, disabledAcquiredVia: arr.filter(v => v !== method) };
            } else {
                return { ...s, disabledAcquiredVia: [...arr, method] };
            }
        });
    }

    function applyPreset(categoryIds: string[]) {
        settingsStore.update(s => {
            const lockedResults = { ...s.lockedResults };
            Object.keys(lockedResults).forEach(id => {
                if (!categoryIds.includes(id)) delete lockedResults[id];
            });
            return {
                ...s,
                activeCategories: categoryIds,
                lockedResults
            };
        });
    }

</script>

<div class="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-8">
        
        <header class="text-center space-y-4 pt-4">
            <h1 class="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-linear-to-r from-red-400 via-red-500 to-red-600">
                Forza Horizon 6 Randomiser
            </h1>
        </header>

        {#if loading}
            <div class="text-center text-xl text-neutral-500 py-12">Loading data...</div>
        {:else if error}
            <div class="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-lg">{error}</div>
        {:else}
            
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <!-- Settings Panel -->
                <div class="lg:col-span-4 space-y-6 bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-xl">
                    <div class="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
                        <h2 class="text-xl font-bold text-neutral-200">Configuration</h2>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="flex items-center justify-between bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                            <label for="output-count" class="font-medium text-neutral-300">Outputs per category</label>
                            <input 
                                id="output-count" 
                                type="number" 
                                min="1" 
                                max="12"
                                value={$settingsStore.outputCount}
                                onchange={changeOutputCount}
                                class="bg-neutral-800 text-white w-16 px-2 py-1 rounded border border-neutral-700 text-center focus:outline-none focus:border-red-500 transition-colors"
                            />
                        </div>

                        <div>
                            <div class="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
                                <h3 class="font-semibold text-neutral-400 text-sm uppercase tracking-wider mb-0">Active Categories</h3>
                            </div>

                            <h4 class="font-semibold text-neutral-400 text-xs uppercase tracking-wider mb-2 mt-4">Presets</h4>
                            <div class="flex flex-wrap gap-2">
                                <button
                                    class="text-xs px-3 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                    onclick={() => applyPreset(CATEGORIES.map(c => c.id))}
                                    title="Select all categories"
                                >
                                    All
                                </button>
                                <button
                                    class="text-xs px-3 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                    onclick={() => applyPreset([])}
                                    title="Select no categories"
                                >
                                    None
                                </button>
                                <button
                                    class="text-xs px-3 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                    onclick={() => applyPreset(['car_class', 'car_type', 'tracktype', 'season', 'time_of_day', 'weather'])}
                                    title="Standard balanced selection"
                                >
                                    Default
                                </button>
                                <button
                                    class="text-xs px-3 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                    onclick={() => applyPreset(['track', 'tracktype', 'laps', 'car_class', 'car_type'])}
                                    title="Focused on the track experience"
                                >
                                    Racing
                                </button>
                                <button
                                    class="text-xs px-3 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                    onclick={() => applyPreset(['specific_car', 'countries', 'decades', 'season', 'time_of_day', 'weather'])}
                                    title="Focused on car variety and atmosphere"
                                >
                                    Cruising
                                </button>
                                <button
                                    class="text-xs px-3 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                    onclick={() => applyPreset(['car_class', 'stock_tuned', 'year', 'camera', 'laps', 'time_of_day', 'weather'])}
                                    title="Focused on realistic details"
                                >
                                    Authentic
                                </button>
                                <button
                                    class="text-xs px-3 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                    onclick={() => applyPreset(CATEGORIES.filter(c => c.group === 'Car').map(c => c.id))}
                                    title="Only Car categories"
                                >
                                    Cars
                                </button>
                                <button
                                    class="text-xs px-3 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                    onclick={() => applyPreset(CATEGORIES.filter(c => c.group === 'Track').map(c => c.id))}
                                    title="Only Track categories"
                                >
                                    Tracks
                                </button>
                                <button
                                    class="text-xs px-3 py-1.5 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                    onclick={() => applyPreset(CATEGORIES.filter(c => c.group === 'Horizon Play').map(c => c.id))}
                                    title="Only Horizon Play categories"
                                >
                                    Play
                                </button>
                            </div>

                            <h4 class="font-semibold text-neutral-400 text-xs uppercase tracking-wider mb-2 mt-4">Car Choices</h4>
                            <div class="flex flex-wrap gap-2">
                                {#each CATEGORIES.filter(c => c.group === 'Car') as cat}
                                    {@const isActive = $settingsStore.activeCategories.includes(cat.id)}
                                    <button 
                                        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border {isActive ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'}"
                                        onclick={() => toggleCategory(cat.id)}
                                    >
                                        {cat.label}
                                    </button>
                                {/each}
                            </div>
                            
                            <div class="w-full h-px bg-neutral-800 my-4"></div>
                            
                            <h4 class="font-semibold text-neutral-400 text-xs uppercase tracking-wider mb-2">Track Choices</h4>
                            <div class="flex flex-wrap gap-2">
                                {#each CATEGORIES.filter(c => c.group === 'Track') as cat}
                                    {@const isActive = $settingsStore.activeCategories.includes(cat.id)}
                                    <button 
                                        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border {isActive ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'}"
                                        onclick={() => toggleCategory(cat.id)}
                                    >
                                        {cat.label}
                                    </button>
                                {/each}
                            </div>

                            <div class="w-full h-px bg-neutral-800 my-4"></div>

                            <h4 class="font-semibold text-neutral-400 text-xs uppercase tracking-wider mb-2">Horizon Play Choices</h4>
                            <div class="flex flex-wrap gap-2">
                                {#each CATEGORIES.filter(c => c.group === 'Horizon Play') as cat}
                                    {@const isActive = $settingsStore.activeCategories.includes(cat.id)}
                                    <button
                                        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border {isActive ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'}"
                                        onclick={() => toggleCategory(cat.id)}
                                    >
                                        {cat.label}
                                    </button>
                                {/each}
                            </div>

                            {#if allAcquiredViaMethods.length > 0}
                                <div class="w-full h-px bg-neutral-800 my-4"></div>
                                <div class="flex items-center justify-between mb-3">
                                    <h3 class="font-semibold text-neutral-400 text-sm uppercase tracking-wider mb-0">Allow Cars By Source</h3>
                                    <div class="flex gap-2">
                                        <button 
                                            class="text-xs px-2 py-1 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                            onclick={() => { settingsStore.update(s => ({ ...s, disabledAcquiredVia: [] })); }}
                                            title="Enable all sources"
                                        >
                                            All
                                        </button>
                                        <button 
                                            class="text-xs px-2 py-1 rounded border border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-red-400 hover:border-red-500/50 transition-colors"
                                            onclick={() => { settingsStore.update(s => ({ ...s, disabledAcquiredVia: [...allAcquiredViaMethods] })); }}
                                            title="Disable all sources"
                                        >
                                            None
                                        </button>
                                    </div>
                                </div>
                                <div class="flex flex-col gap-2 max-h-50 overflow-y-auto pr-2 custom-scrollbar">
                                    {#each allAcquiredViaMethods as method}
                                        {@const isDisabled = ($settingsStore.disabledAcquiredVia || []).includes(method)}
                                        <label class="flex items-center gap-3 p-2 rounded-lg border hover:border-neutral-600 cursor-pointer transition-colors {isDisabled ? 'bg-neutral-950 border-neutral-800 text-neutral-500' : 'bg-red-500/10 border-red-500/30 text-red-400'}">
                                            <input 
                                                type="checkbox" 
                                                class="accent-red-500 w-4 h-4 rounded border-neutral-700 bg-neutral-900 focus:ring-red-500 focus:ring-offset-neutral-900"
                                                checked={!isDisabled}
                                                onchange={() => toggleAcquiredVia(method)}
                                            />
                                            <span class="text-sm font-medium">{method}</span>
                                        </label>
                                    {/each}
                                </div>
                                <div class="text-xs text-neutral-500 mt-2">
                                    <p>Pool currently includes {filteredCars.length} / {cars.length} cars.</p>
                                </div>
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Main Display -->
                <div class="lg:col-span-8 space-y-8 flex flex-col">
                    
                    <div class="flex flex-col md:flex-row flex-wrap gap-4 items-stretch md:items-center bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-xl">
                        <button 
                            class="w-full md:w-auto md:flex-1 px-12 py-5 bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 text-2xl"
                            onclick={() => roll()}
                        >
                            Roll
                        </button>
                        <div class="flex flex-wrap gap-2 w-full md:w-auto md:min-w-fit">
                            <button
                                class="flex-1 md:flex-none px-4 py-3 md:py-5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-2xl border border-neutral-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                onclick={lockAll}
                                title="Lock all current results"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <span>Lock All</span>
                            </button>
                            <button
                                class="flex-1 md:flex-none px-4 py-3 md:py-5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-2xl border border-neutral-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                                onclick={unlockAll}
                                title="Unlock all results"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                <span>Unlock All</span>
                            </button>
                        </div>
                    </div>

                    {#if results.length > 0}
                        {@const carResults = results.filter(r => r.group === 'Car')}
                        {@const trackResults = results.filter(r => r.group === 'Track')}
                        {@const horizonResults = results.filter(r => r.group === 'Horizon Play')}
                        <div class="bg-neutral-900 p-6 md:p-8 rounded-3xl border border-neutral-800 shadow-2xl relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-400 via-red-500 to-red-600"></div>
                            
                            <div class="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4">
                                <h3 class="text-2xl font-bold text-white">Your Event</h3>
                                <div class="text-neutral-500 text-sm flex items-center gap-3">
                                    <span>Seed: <code class="bg-neutral-950 px-2 py-1 rounded text-neutral-300 font-mono">{currentSeed}</code></span>
                                    <button 
                                        class="text-red-400 hover:text-red-300 transition-colors p-2 bg-red-500/10 rounded-lg"
                                        title="Copy Link"
                                        onclick={(e) => {
                                            navigator.clipboard.writeText(window.location.href);
                                            const btn = e.currentTarget;
                                            const originalText = btn.innerHTML;
                                            btn.innerHTML = '<span class="text-green-400">Copied!</span>';
                                            setTimeout(() => btn.innerHTML = originalText, 2000);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                    </button>
                                </div>
                            </div>

                            {#if carResults.length > 0}
                                <h4 class="text-lg font-bold text-neutral-300 mb-4 mt-2">Car</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {#each carResults as catResult}
                                        {@const isLocked = !!$settingsStore.lockedResults[catResult.categoryId]}
                                        <div class="bg-neutral-950 p-5 rounded-2xl border {isLocked ? 'border-red-500/50' : 'border-neutral-800'} flex flex-col justify-center relative group">
                                            <button
                                                class="absolute top-3 right-3 p-1.5 rounded-lg transition-colors {isLocked ? 'text-red-500 bg-red-500/10' : 'text-neutral-600 hover:text-neutral-400 bg-neutral-900 opacity-0 group-hover:opacity-100'}"
                                                onclick={() => toggleLock(catResult.categoryId)}
                                                title={isLocked ? "Unlock Category" : "Lock Category"}
                                            >
                                                {#if isLocked}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                {:else}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                                {/if}
                                            </button>
                                            <div class="text-xs font-bold {isLocked ? 'text-red-500/70' : 'text-neutral-500'} uppercase tracking-wider mb-2">{catResult.label}</div>
                                            <div class={catResult.results.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1" : "space-y-1"}>
                                                {#each catResult.results as res}
                                                    <div class="text-xl md:text-2xl font-semibold text-neutral-100 min-w-0 break-words">
                                                        {#if res && res.includes('||')}
                                                            {@const parts = res.split('||')}
                                                            {parts[0]}
                                                            <span class="block text-sm md:text-base font-normal text-neutral-400 mt-1">{parts[1]}</span>
                                                        {:else}
                                                            {res || '---'}
                                                        {/if}
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                            
                            {#if carResults.length > 0 && trackResults.length > 0}
                                <div class="w-full h-px bg-neutral-800 my-8"></div>
                            {/if}
                            
                            {#if trackResults.length > 0}
                                <h4 class="text-lg font-bold text-neutral-300 mb-4">Track</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {#each trackResults as catResult}
                                        {@const isLocked = !!$settingsStore.lockedResults[catResult.categoryId]}
                                        <div class="bg-neutral-950 p-5 rounded-2xl border {isLocked ? 'border-red-500/50' : 'border-neutral-800'} flex flex-col justify-center relative group">
                                            <button
                                                class="absolute top-3 right-3 p-1.5 rounded-lg transition-colors {isLocked ? 'text-red-500 bg-red-500/10' : 'text-neutral-600 hover:text-neutral-400 bg-neutral-900 opacity-0 group-hover:opacity-100'}"
                                                onclick={() => toggleLock(catResult.categoryId)}
                                                title={isLocked ? "Unlock Category" : "Lock Category"}
                                            >
                                                {#if isLocked}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                {:else}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                                {/if}
                                            </button>
                                            <div class="text-xs font-bold {isLocked ? 'text-red-500/70' : 'text-neutral-500'} uppercase tracking-wider mb-2">{catResult.label}</div>
                                            <div class={catResult.results.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1" : "space-y-1"}>
                                                {#each catResult.results as res}
                                                    <div class="text-xl md:text-2xl font-semibold text-neutral-100 min-w-0 break-words">
                                                        {#if res && res.includes('||')}
                                                            {@const parts = res.split('||')}
                                                            {parts[0]}
                                                            <span class="block text-sm md:text-base font-normal text-neutral-400 mt-1">{parts[1]}</span>
                                                        {:else}
                                                            {res || '---'}
                                                        {/if}
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}

                            {#if trackResults.length > 0 && horizonResults.length > 0}
                                <div class="w-full h-px bg-neutral-800 my-8"></div>
                            {/if}

                            {#if horizonResults.length > 0}
                                <h4 class="text-lg font-bold text-neutral-300 mb-4">Horizon Play</h4>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {#each horizonResults as catResult}
                                        {@const isLocked = !!$settingsStore.lockedResults[catResult.categoryId]}
                                        <div class="bg-neutral-950 p-5 rounded-2xl border {isLocked ? 'border-red-500/50' : 'border-neutral-800'} flex flex-col justify-center relative group">
                                            <button
                                                class="absolute top-3 right-3 p-1.5 rounded-lg transition-colors {isLocked ? 'text-red-500 bg-red-500/10' : 'text-neutral-600 hover:text-neutral-400 bg-neutral-900 opacity-0 group-hover:opacity-100'}"
                                                onclick={() => toggleLock(catResult.categoryId)}
                                                title={isLocked ? "Unlock Category" : "Lock Category"}
                                            >
                                                {#if isLocked}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                                {:else}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg>
                                                {/if}
                                            </button>
                                            <div class="text-xs font-bold {isLocked ? 'text-red-500/70' : 'text-neutral-500'} uppercase tracking-wider mb-2">{catResult.label}</div>
                                            <div class={catResult.results.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1" : "space-y-1"}>
                                                {#each catResult.results as res}
                                                    <div class="text-xl md:text-2xl font-semibold text-neutral-100 min-w-0 break-words">
                                                        {#if res && res.includes('||')}
                                                            {@const parts = res.split('||')}
                                                            {parts[0]}
                                                            <span class="block text-sm md:text-base font-normal text-neutral-400 mt-1">{parts[1]}</span>
                                                        {:else}
                                                            {res || '---'}
                                                        {/if}
                                                    </div>
                                                {/each}
                                            </div>
                                        </div>
                                    {/each}
                                </div>
                            {/if}
                        </div>
                    {:else if currentSeed === ''}
                        <div class="grow flex items-center justify-center bg-neutral-900/50 p-12 rounded-3xl border border-neutral-800 border-dashed">
                            <p class="text-neutral-500 text-xl font-medium tracking-wide">Select your categories and hit Roll to begin</p>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <footer class="text-center pt-12 pb-4 text-neutral-500 text-sm space-y-2">
            <div>
                Car data sourced from the <a href="https://forza.net/fh6cars" target="_blank" rel="noopener noreferrer" class="text-red-400 hover:text-red-300 transition-colors">Official Forza FH6 Car List</a>.
            </div>
            <div>
                If the car data is out of date, please <a href="https://github.com/m4st3rp/ForzaHorizon6Randomiser/issues/new" target="_blank" rel="noopener noreferrer" class="text-red-400 hover:text-red-300 transition-colors">create an issue on GitHub</a>.
            </div>
            <div>
                Data Date: {dataDate || '2026-06-05'}
            </div>
        </footer>
    </div>
</div>