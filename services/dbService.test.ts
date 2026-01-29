
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dbService } from './dbService';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
        delete store[key];
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('dbService', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    localStorageMock.clear();
  });

  it('updateLibraryItem uses PATCH and does NOT fetch all items', async () => {
    // Mock the PATCH response
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    await dbService.updateLibraryItem('1', { title: 'Updated Item 1' });

    // Verify PATCH was called
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/library?id=1', expect.objectContaining({
      method: 'PATCH',
      body: expect.stringContaining('Updated Item 1')
    }));

    // Verify GET was NOT called
    expect(fetchMock).not.toHaveBeenCalledWith('/api/library');
  });
});
