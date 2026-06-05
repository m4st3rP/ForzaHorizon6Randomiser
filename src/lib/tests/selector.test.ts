import { describe, it, expect } from 'vitest';
import { mulberry32, generateSeed, seedToNumber, selectRandom } from '../utils/selector';

describe('selector logic', () => {
    describe('mulberry32', () => {
        it('should generate deterministic random numbers', () => {
            const seed = 12345;
            const prng1 = mulberry32(seed);
            const prng2 = mulberry32(seed);

            for (let i = 0; i < 10; i++) {
                expect(prng1()).toBe(prng2());
            }
        });

        it('should generate different numbers for different seeds', () => {
            const prng1 = mulberry32(111);
            const prng2 = mulberry32(222);

            expect(prng1()).not.toBe(prng2());
        });
    });

    describe('generateSeed', () => {
        it('should generate a 6-character alphanumeric string', () => {
            const seed = generateSeed();
            expect(typeof seed).toBe('string');
            expect(seed.length).toBe(6);
        });
    });

    describe('seedToNumber', () => {
        it('should convert a string seed to a consistent number', () => {
            const seed = 'abc123';
            const num1 = seedToNumber(seed);
            const num2 = seedToNumber(seed);
            expect(num1).toBe(num2);
            expect(typeof num1).toBe('number');
        });

        it('should handle empty strings', () => {
            expect(seedToNumber('')).toBe(0);
        });
    });

    describe('selectRandom', () => {
        const items = ['a', 'b', 'c', 'd'];
        const mockPrng = (val: number) => () => val;

        it('should select an item based on the PRNG value', () => {
            expect(selectRandom(items, mockPrng(0))).toBe('a');
            expect(selectRandom(items, mockPrng(0.24))).toBe('a');
            expect(selectRandom(items, mockPrng(0.25))).toBe('b');
            expect(selectRandom(items, mockPrng(0.99))).toBe('d');
        });

        it('should return null for empty arrays', () => {
            expect(selectRandom([], () => 0.5)).toBeNull();
        });

        it('should return null for null/undefined arrays', () => {
            expect(selectRandom(null as any, () => 0.5)).toBeNull();
        });
    });
});
