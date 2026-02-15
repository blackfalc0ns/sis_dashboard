// FILE: src/utils/seeded.ts
// Deterministic seeded random number generator

/**
 * Simple hash function to convert string seed to number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Seeded pseudo-random number generator (LCG algorithm)
 * Returns a number between 0 and 1
 */
function seededRandom(seed: number): number {
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);
  return ((a * seed + c) % m) / m;
}

/**
 * Generate a deterministic random number within a range
 * @param seed - String seed (e.g., student ID)
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Deterministic random number
 */
export function seededNumber(seed: string, min: number, max: number): number {
  const hash = hashString(seed);
  const random = seededRandom(hash);
  return Math.floor(random * (max - min + 1)) + min;
}

/**
 * Generate a deterministic random float within a range
 * @param seed - String seed (e.g., student ID)
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Deterministic random float
 */
export function seededFloat(seed: string, min: number, max: number): number {
  const hash = hashString(seed);
  const random = seededRandom(hash);
  return random * (max - min) + min;
}

/**
 * Pick a deterministic random item from an array
 * @param seed - String seed
 * @param array - Array to pick from
 * @returns Random item from array
 */
export function seededPick<T>(seed: string, array: T[]): T {
  const index = seededNumber(seed, 0, array.length - 1);
  return array[index];
}

/**
 * Generate multiple seeded numbers by appending suffix to seed
 * @param baseSeed - Base seed string
 * @param count - Number of values to generate
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Array of deterministic random numbers
 */
export function seededNumbers(
  baseSeed: string,
  count: number,
  min: number,
  max: number,
): number[] {
  return Array.from({ length: count }, (_, i) =>
    seededNumber(`${baseSeed}-${i}`, min, max),
  );
}
