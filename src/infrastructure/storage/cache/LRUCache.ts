interface CacheItem<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

export class LRUCache<T> {
  private maxSize: number;
  private cacheMap: Map<string, CacheItem<T>>;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.cacheMap = new Map();
  }

  get(key: string): T | undefined {
    const item = this.cacheMap.get(key);
    if (!item) return undefined;

    // Check TTL
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.cacheMap.delete(key);
      return undefined;
    }

    // Update usage by deleting and re-inserting
    this.cacheMap.delete(key);
    item.timestamp = Date.now();
    this.cacheMap.set(key, item);

    return item.value;
  }

  set(key: string, value: T, ttl?: number): void {
    if (this.cacheMap.has(key)) {
      this.cacheMap.delete(key);
    } else if (this.cacheMap.size >= this.maxSize) {
      // Evict least recently used (first item in Map)
      const lruKey = this.cacheMap.keys().next().value;
      this.cacheMap.delete(lruKey);
    }

    const newItem: CacheItem<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl,
    };
    this.cacheMap.set(key, newItem);
  }

  has(key: string): boolean {
    const item = this.cacheMap.get(key);
    if (!item) return false;

    // Check TTL
    if (item.ttl && Date.now() - item.timestamp > item.ttl) {
      this.cacheMap.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cacheMap.delete(key);
  }

  clear(): void {
    this.cacheMap.clear();
  }

  size(): number {
    return this.cacheMap.size;
  }
}
