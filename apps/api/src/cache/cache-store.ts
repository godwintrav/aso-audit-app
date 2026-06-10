import { Injectable, Logger } from "@nestjs/common";

export interface ICacheStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs: number): void;
  delete(key: string): void;
  clear(): void;
  size(): number;
}

export const CACHE_STORE = Symbol("CACHE_STORE");

export interface InMemoryCacheStoreOptions {
  maxEntries: number;
  now?: () => number;
}

interface Entry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class InMemoryCacheStore implements ICacheStore {
  private readonly logger = new Logger(InMemoryCacheStore.name);
  private readonly entries = new Map<string, Entry>();
  private readonly maxEntries: number;
  private readonly now: () => number;

  constructor(options: InMemoryCacheStoreOptions) {
    this.maxEntries = Math.max(1, options.maxEntries);
    this.now = options.now ?? Date.now;
  }

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }

    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
    this.evictIfNeeded();
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }

  size(): number {
    return this.entries.size;
  }

  private evictIfNeeded(): void {
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
      this.logger.debug(`Evicted LRU cache entry "${oldest}" (max ${this.maxEntries})`);
    }
  }
}
