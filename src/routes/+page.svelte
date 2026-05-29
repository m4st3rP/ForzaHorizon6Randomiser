<script lang="ts">
    import { onMount } from 'svelte';
    import { base } from '$app/paths';
    import { loadCsv } from '$lib/utils/csv';
    import { settingsStore } from '$lib/stores/randomizer';
    import { mulberry32, seedToNumber, generateSeed } from '$lib/utils/selector';
    import { CATEGORIES } from '$lib/utils/categories';
    import type { Car, Race, CategoryResult, CarType, OptionData } from '$lib/types';

    let cars: Car[] = [];
    let races: Race[] = [];
    let carTypes: CarType[] = [];
    let loading = $state(true);
    let error: string | null = $state(null);

    let results: CategoryResult[] = $state([]);
    let currentSeed: string = $state('');

    // Dynamic options extracted from data
    let dynamicOptions: Record<string, string[]> = $state({});

    onMount(async () => {
        try {
            // First load the main datasets
            const [loadedCars, loadedRaces, loadedCarTypes] = await Promise.all([
                loadCsv<Car>(`${base}/data/cars.csv`),
                loadCsv<Race>(`${base}/data/races.csv`),
                loadCsv<CarType>(`${base}/data/car-types.csv`),
            ]);
            cars = loadedCars;
            races = loadedRaces;
            carTypes = loadedCarTypes;

            // Load the small standalone option lists
            const simpleCategories = [
                'car_class', 'countries', 'stock_tuned', 'car_value', 'drivetrain', 
                'rarity', 'laps', 'season', 'weather', 'time_of_day'
            ];

            await Promise.all(simpleCategories.map(async (catId) => {
                const data = await loadCsv<OptionData>(`${base}/data/${catId}.csv`);
                dynamicOptions[catId] = data.map(row => row.Value).filter(Boolean);
            }));

            // Extract unique values for other dynamic categories
            dynamicOptions['manufacturer'] = [...new Set(cars.map(c => c.Make).filter(Boolean))].sort();
            
            // The year is often the first 4 characters of the Car Name
            const allYears = cars.map(c => {
                const match = String(c['Car Name']).match(/^(\d{4})/);
                return match ? parseInt(match[1]) : null;
            }).filter(Boolean) as number[];

            dynamicOptions['year'] = [...new Set(allYears.map(y => String(y)))].sort();

            dynamicOptions['decades'] = [...new Set(allYears.map(y => {
                if (y < 1950) return 'Pre-1950s';
                return `${Math.floor(y / 10) * 10}s`;
            }))].sort((a, b) => {
                if (a === 'Pre-1950s') return -1;
                if (b === 'Pre-1950s') return 1;
                return a.localeCompare(b);
            });

            dynamicOptions['specific_car'] = cars.map(c => c['Car Name']);
            dynamicOptions['track'] = races.map(r => r.Name);
            dynamicOptions['tracktype'] = [...new Set(races.map(r => r.Type).filter(Boolean))].sort();
            dynamicOptions['track_subtype'] = [...new Set(races.map(r => r.Subtype).filter(Boolean))].sort();

            // Fetch from car types CSV
            dynamicOptions['car_type'] = [...new Set(carTypes.map(c => c.Car_Type).filter(Boolean))].sort();
            dynamicOptions['broader_car_categories'] = [...new Set(carTypes.map(c => c.Category).filter(Boolean))].sort();

            // Initialize store if empty
            if (!$settingsStore.activeCategories || $settingsStore.activeCategories.length === 0) {
                // Enable some typical defaults
                $settingsStore.activeCategories = ['car_class', 'car_type', 'tracktype', 'season', 'time_of_day', 'weather'];
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

        const activeCatIds = $settingsStore.activeCategories || [];
        const outputCount = $settingsStore.outputCount || 1;
        
        const newResults: CategoryResult[] = [];

        for (const catId of activeCatIds) {
            const def = CATEGORIES.find(c => c.id === catId);
            if (!def) continue;

            const opts = getOptionsForCategory(catId);
            if (opts.length === 0) continue;

            const selectedValues: string[] = [];
            
            const availableOptions = [...opts];
            
            for (let i = 0; i < outputCount; i++) {
                if (availableOptions.length === 0) break;
                
                // Roll index
                const index = Math.floor(prng() * availableOptions.length);
                selectedValues.push(availableOptions[index]);
                
                // Remove from available so we don't pick duplicate if we have enough options
                availableOptions.splice(index, 1);
            }

            newResults.push({
                categoryId: catId,
                label: def.label,
                results: selectedValues
            });
        }

        results = newResults;
    }

    function toggleCategory(catId: string) {
        settingsStore.update(s => {
            const arr = s.activeCategories || [];
            if (arr.includes(catId)) {
                return { ...s, activeCategories: arr.filter(v => v !== catId) };
            } else {
                return { ...s, activeCategories: [...arr, catId] };
            }
        });
    }

    function changeOutputCount(e: Event) {
        const val = parseInt((e.target as HTMLInputElement).value);
        if (val > 0 && val <= 10) {
            settingsStore.update(s => ({ ...s, outputCount: val }));
        }
    }

</script>

<div class="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans">
    <div class="max-w-7xl mx-auto space-y-8">
        
        <header class="text-center space-y-4 pt-4">
            <h1 class="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-red-500 to-red-600">
                Forza Horizon 6 Randomiser
            </h1>
            <p class="text-neutral-400 text-lg">Generate your ultimate event constraints.</p>
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
                                max="10" 
                                value={$settingsStore.outputCount}
                                onchange={changeOutputCount}
                                class="bg-neutral-800 text-white w-16 px-2 py-1 rounded border border-neutral-700 text-center focus:outline-none focus:border-red-500 transition-colors"
                            />
                        </div>

                        <div>
                            <h3 class="font-semibold text-neutral-400 mb-3 text-sm uppercase tracking-wider">Active Categories</h3>
                            <div class="flex flex-wrap gap-2">
                                {#each CATEGORIES as cat}
                                    {@const isActive = $settingsStore.activeCategories.includes(cat.id)}
                                    <button 
                                        class="px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 border {isActive ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300'}"
                                        onclick={() => toggleCategory(cat.id)}
                                    >
                                        {cat.label}
                                    </button>
                                {/each}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Display -->
                <div class="lg:col-span-8 space-y-8 flex flex-col">
                    
                    <div class="flex justify-center items-center bg-neutral-900 p-6 rounded-3xl border border-neutral-800 shadow-xl">
                        <button 
                            class="w-full md:w-auto px-12 py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 text-2xl"
                            onclick={() => roll()}
                        >
                            Roll Constraints
                        </button>
                    </div>

                    {#if results.length > 0}
                        <div class="bg-neutral-900 p-6 md:p-8 rounded-3xl border border-neutral-800 shadow-2xl relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-600"></div>
                            
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

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {#each results as catResult}
                                    <div class="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 flex flex-col justify-center">
                                        <div class="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">{catResult.label}</div>
                                        <div class="space-y-1">
                                            {#each catResult.results as res}
                                                <div class="text-xl md:text-2xl font-semibold text-neutral-100">{res}</div>
                                            {/each}
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {:else if currentSeed === ''}
                        <div class="flex-grow flex items-center justify-center bg-neutral-900/50 p-12 rounded-3xl border border-neutral-800 border-dashed">
                            <p class="text-neutral-500 text-xl font-medium tracking-wide">Select your categories and hit Roll to begin</p>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}

        <footer class="text-center pt-12 pb-4 text-neutral-500 text-sm space-y-2">
            <div>
                Car Data thanks to <a href="https://docs.google.com/spreadsheets/d/1pz_hNeBiBwLn-ya1zLRhzvnaYk3lLfg9izmbCI82mW4/" target="_blank" rel="noopener noreferrer" class="text-red-400 hover:text-red-300 transition-colors">Aeqnx and their Spreadsheet</a>.
            </div>
            <div>
                Data Date: 2026-05-30
            </div>
        </footer>
    </div>
</div>