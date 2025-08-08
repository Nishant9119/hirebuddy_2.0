// Provide minimal localStorage/sessionStorage shims during SSR to prevent ReferenceErrors
(() => {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map<string, string>();
    const localStorageShim = {
      getItem(key: string) {
        return store.has(key) ? (store.get(key) as string) : null;
      },
      setItem(key: string, value: string) {
        store.set(key, String(value));
      },
      removeItem(key: string) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
      key(index: number) {
        const keys = Array.from(store.keys());
        return keys[index] ?? null;
      },
      get length() {
        return store.size;
      },
    } as unknown as Storage;
    (globalThis as any).localStorage = localStorageShim;
  }

  if (typeof globalThis.sessionStorage === 'undefined') {
    const store = new Map<string, string>();
    const sessionStorageShim = {
      getItem(key: string) {
        return store.has(key) ? (store.get(key) as string) : null;
      },
      setItem(key: string, value: string) {
        store.set(key, String(value));
      },
      removeItem(key: string) {
        store.delete(key);
      },
      clear() {
        store.clear();
      },
      key(index: number) {
        const keys = Array.from(store.keys());
        return keys[index] ?? null;
      },
      get length() {
        return store.size;
      },
    } as unknown as Storage;
    (globalThis as any).sessionStorage = sessionStorageShim;
  }
})();

