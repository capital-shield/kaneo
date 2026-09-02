import "@testing-library/jest-dom/vitest";

// jsdom under this vitest version exposes no Storage implementation, so hooks
// that persist to localStorage have nothing to write to.
if (typeof globalThis.localStorage === "undefined") {
  class MemoryStorage implements Storage {
    #entries = new Map<string, string>();

    get length() {
      return this.#entries.size;
    }

    key(index: number) {
      return [...this.#entries.keys()][index] ?? null;
    }

    getItem(key: string) {
      return this.#entries.get(key) ?? null;
    }

    setItem(key: string, value: string) {
      this.#entries.set(key, String(value));
    }

    removeItem(key: string) {
      this.#entries.delete(key);
    }

    clear() {
      this.#entries.clear();
    }
  }

  for (const name of ["localStorage", "sessionStorage"] as const) {
    Object.defineProperty(globalThis, name, {
      value: new MemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
}
