import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageManager } from './LocalStorageManager';
import { z } from 'zod';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

(global as any).localStorage = localStorageMock;

describe('LocalStorageManager', () => {
  let manager: LocalStorageManager;
  let storage: Map<string, string>;

  beforeEach(() => {
    manager = LocalStorageManager.getInstance();
    storage = new Map();
    localStorageMock.getItem.mockImplementation((key: string) => storage.get(key) || null);
    localStorageMock.setItem.mockImplementation((key: string, value: string) => storage.set(key, value));
    localStorageMock.removeItem.mockImplementation((key: string) => storage.delete(key));
    localStorageMock.clear.mockImplementation(() => storage.clear());
    vi.clearAllMocks();
  });

  it('should return the same instance', () => {
    const instance1 = LocalStorageManager.getInstance();
    const instance2 = LocalStorageManager.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should set and get a value correctly', () => {
    const schema = z.string();
    manager.set('testKey', 'testValue');

    const result = manager.get('testKey', schema);
    expect(result).toBe('testValue');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('testKey');
  });

  it('should return null for invalid data', () => {
    const schema = z.string();
    localStorageMock.getItem.mockReturnValue('invalid json');

    const result = manager.get('testKey', schema);
    expect(result).toBeNull();
  });

  it('should return null for outdated or malformed data according to schema', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    // Store malformed data (missing age)
    storage.set('testKey', JSON.stringify({ version: 1, payload: { name: 'Alice' } }));

    const result = manager.get('testKey', schema);
    expect(result).toBeNull();
  });

  it('should set a value with versioning', () => {
    manager.set('testKey', 'testValue');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'testKey',
      JSON.stringify({ version: 1, payload: 'testValue' })
    );
  });
});
