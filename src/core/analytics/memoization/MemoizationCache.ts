export class MemoizationCache {
  private cache: Map<string, any> = new Map();

  /**
   * Retrieves a cached value for the given key.
   */
  get(key: string): any | undefined {
    return this.cache.get(key);
  }

  /**
   * Stores a value in the cache for the given key.
   */
  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  /**
   * Invalidates (removes) entries that match the given prefix.
   * For example, invalidate('module.123.') to remove all cached values for module 123.
   */
  invalidate(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }
}
