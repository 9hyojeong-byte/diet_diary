interface CacheContainer<T> {
  data: T;
  lastSyncedAt: string;
}

/**
 * Retrieves the cached data for a given key, validating the container structure.
 * Returns null if cache does not exist, is invalid, or if parsing fails.
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'data' in parsed) {
      return parsed.data as T;
    }
    
    // Legacy fallback: If it's a valid array or object, migrate it to the new structure
    if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) {
      setCachedData(key, parsed);
      return parsed as unknown as T;
    }
    
    return null;
  } catch (error) {
    console.error(`[CacheService] Failed to parse cached data for key "${key}":`, error);
    return null;
  }
}

/**
 * Wraps the data inside a CacheContainer with the current ISO timestamp
 * and saves it under the specified key in localStorage.
 */
export function setCachedData<T>(key: string, data: T): void {
  try {
    const container: CacheContainer<T> = {
      data,
      lastSyncedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(container));
  } catch (error) {
    console.error(`[CacheService] Failed to write cache for key "${key}":`, error);
  }
}

/**
 * Removes the cache entry for the specified key from localStorage.
 */
export function clearCachedData(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`[CacheService] Failed to clear cache for key "${key}":`, error);
  }
}

/**
 * Retrieves the lastSyncedAt ISO timestamp for the given cache key.
 * Returns null if the cache does not exist or does not contain a timestamp.
 */
export function getLastSyncedAt(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'lastSyncedAt' in parsed) {
      return parsed.lastSyncedAt as string;
    }
    return null;
  } catch {
    return null;
  }
}
