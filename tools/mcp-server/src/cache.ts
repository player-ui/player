/**
 * LRU (Least Recently Used) cache for knowledge artifacts.
 * Evicts the least recently accessed entry when the cache reaches maxSize.
 * Uses Map insertion order to track recency.
 */

export class LRUCache<T> {
  private cache = new Map<string, T>();

  constructor(private maxSize: number = 50) {}

  get(key: string): T | null {
    if (!this.cache.has(key)) {
      return null;
    }

    const value = this.cache.get(key) as T;

    // Move to most-recently-used position
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key: string, data: T): void {
    // If updating an existing key, delete first to refresh position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, data);

    // Evict least recently used if over capacity
    if (this.cache.size > this.maxSize) {
      const lruKey = this.cache.keys().next().value!;
      this.cache.delete(lruKey);
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics for debugging/monitoring
   */
  stats(): { size: number; maxSize: number } {
    return {
      size: this.size(),
      maxSize: this.maxSize,
    };
  }
}
