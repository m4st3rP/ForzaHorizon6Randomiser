// Seeded pseudo-random number generator (Mulberry32)
export function mulberry32(a: number) {
    return function() {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

// Generate a random seed string
export function generateSeed(): string {
    return Math.random().toString(36).substring(2, 8);
}

// Convert a string seed to a number for the PRNG
export function seedToNumber(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

// Select a random item from an array using a PRNG function
export function selectRandom<T>(array: T[], prng: () => number): T | null {
    if (!array || array.length === 0) return null;
    const index = Math.floor(prng() * array.length);
    return array[index];
}
