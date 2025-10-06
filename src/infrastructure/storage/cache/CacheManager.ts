import { LRUCache } from './LRUCache';

export class CacheManager {
  private static instance: CacheManager;
  private caches: Map<string, LRUCache<any>>;

  private constructor() {
    this.caches = new Map();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public getCache<T>(type: string, maxSize: number = 100): LRUCache<T> {
    if (!this.caches.has(type)) {
      this.caches.set(type, new LRUCache<T>(maxSize));
    }
    return this.caches.get(type) as LRUCache<T>;
  }

  public clearCache(type: string): void {
    const cache = this.caches.get(type);
    if (cache) {
      cache.clear();
    }
  }

  public clearAllCaches(): void {
    this.caches.clear();
  }
}
