import { describe, it, expect } from "vitest";
import { LRUCache } from "../../src/cache.js";

describe("LRUCache", () => {
  describe("Basic Operations", () => {
    it("should store and retrieve values", () => {
      const cache = new LRUCache<string>(5);
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    it("should return null for non-existent keys", () => {
      const cache = new LRUCache<string>(5);
      expect(cache.get("nonexistent")).toBeNull();
    });

    it("should update existing keys", () => {
      const cache = new LRUCache<string>(5);
      cache.set("key1", "value1");
      cache.set("key1", "value2");
      expect(cache.get("key1")).toBe("value2");
    });

    it("should support different value types", () => {
      const cache = new LRUCache<object>(5);
      const obj = { foo: "bar" };
      cache.set("key1", obj);
      expect(cache.get("key1")).toEqual(obj);
    });
  });

  describe("LRU Eviction", () => {
    it("should evict the least recently used entry when maxSize is exceeded", () => {
      const cache = new LRUCache<string>(3);
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      // Adding a 4th entry should evict "a" (the oldest)
      cache.set("d", "4");

      expect(cache.get("a")).toBeNull();
      expect(cache.get("b")).toBe("2");
      expect(cache.get("c")).toBe("3");
      expect(cache.get("d")).toBe("4");
      expect(cache.size()).toBe(3);
    });

    it("should evict multiple entries as new ones are added", () => {
      const cache = new LRUCache<string>(2);
      cache.set("a", "1");
      cache.set("b", "2");

      cache.set("c", "3"); // evicts "a"
      expect(cache.get("a")).toBeNull();

      cache.set("d", "4"); // evicts "b"
      expect(cache.get("b")).toBeNull();

      expect(cache.size()).toBe(2);
      expect(cache.get("c")).toBe("3");
      expect(cache.get("d")).toBe("4");
    });

    it("should not evict when updating an existing key", () => {
      const cache = new LRUCache<string>(3);
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      cache.set("a", "updated"); // update, not a new entry

      expect(cache.size()).toBe(3);
      expect(cache.get("a")).toBe("updated");
      expect(cache.get("b")).toBe("2");
      expect(cache.get("c")).toBe("3");
    });
  });

  describe("Promotion on Access", () => {
    it("should promote accessed entry to most recently used", () => {
      const cache = new LRUCache<string>(3);
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      // Access "a" to promote it
      cache.get("a");

      // Now "b" is the LRU entry; adding a new entry should evict "b"
      cache.set("d", "4");

      expect(cache.get("b")).toBeNull();
      expect(cache.get("a")).toBe("1");
      expect(cache.get("c")).toBe("3");
      expect(cache.get("d")).toBe("4");
    });

    it("should promote on set (update) as well", () => {
      const cache = new LRUCache<string>(3);
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      // Update "a" to promote it
      cache.set("a", "updated");

      // "b" is now LRU
      cache.set("d", "4");

      expect(cache.get("b")).toBeNull();
      expect(cache.get("a")).toBe("updated");
    });

    it("should promote on has() check", () => {
      const cache = new LRUCache<string>(3);
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");

      // has() promotes "a"
      expect(cache.has("a")).toBe(true);

      // "b" is now LRU
      cache.set("d", "4");

      expect(cache.get("b")).toBeNull();
      expect(cache.get("a")).toBe("1");
    });
  });

  describe("has() Method", () => {
    it("should return true for existing keys", () => {
      const cache = new LRUCache<string>(5);
      cache.set("key1", "value1");
      expect(cache.has("key1")).toBe(true);
    });

    it("should return false for non-existent keys", () => {
      const cache = new LRUCache<string>(5);
      expect(cache.has("nonexistent")).toBe(false);
    });
  });

  describe("clear() Method", () => {
    it("should remove all entries", () => {
      const cache = new LRUCache<string>(5);
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      cache.clear();

      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe("size() Method", () => {
    it("should return number of entries", () => {
      const cache = new LRUCache<string>(5);
      expect(cache.size()).toBe(0);

      cache.set("key1", "value1");
      expect(cache.size()).toBe(1);

      cache.set("key2", "value2");
      expect(cache.size()).toBe(2);
    });

    it("should never exceed maxSize", () => {
      const cache = new LRUCache<string>(2);
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");
      cache.set("d", "4");

      expect(cache.size()).toBe(2);
    });
  });

  describe("stats() Method", () => {
    it("should return cache statistics", () => {
      const cache = new LRUCache<string>(10);
      cache.set("key1", "value1");

      const stats = cache.stats();

      expect(stats.size).toBe(1);
      expect(stats.maxSize).toBe(10);
    });

    it("should reflect current size", () => {
      const cache = new LRUCache<string>(3);
      cache.set("a", "1");
      cache.set("b", "2");
      cache.set("c", "3");
      cache.set("d", "4"); // evicts "a"

      const stats = cache.stats();
      expect(stats.size).toBe(3);
      expect(stats.maxSize).toBe(3);
    });
  });

  describe("Concurrent Access", () => {
    it("should handle multiple rapid sets", () => {
      const cache = new LRUCache<string>(200);

      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      expect(cache.size()).toBe(100);
    });

    it("should handle multiple rapid gets", () => {
      const cache = new LRUCache<string>(5);
      cache.set("key1", "value1");

      const results = [];
      for (let i = 0; i < 100; i++) {
        results.push(cache.get("key1"));
      }

      expect(results.every((r) => r === "value1")).toBe(true);
    });

    it("should handle interleaved sets and gets", () => {
      const cache = new LRUCache<string>(5);

      cache.set("key1", "v1");
      expect(cache.get("key1")).toBe("v1");
      cache.set("key1", "v2");
      expect(cache.get("key1")).toBe("v2");
      cache.set("key2", "v3");
      expect(cache.get("key1")).toBe("v2");
      expect(cache.get("key2")).toBe("v3");
    });
  });

  describe("Edge Cases", () => {
    it("should handle maxSize of 1", () => {
      const cache = new LRUCache<string>(1);
      cache.set("a", "1");
      expect(cache.get("a")).toBe("1");

      cache.set("b", "2");
      expect(cache.get("a")).toBeNull();
      expect(cache.get("b")).toBe("2");
      expect(cache.size()).toBe(1);
    });

    it("should handle empty string keys", () => {
      const cache = new LRUCache<string>(5);
      cache.set("", "empty-key");
      expect(cache.get("")).toBe("empty-key");
    });

    it("should handle null/undefined values", () => {
      const cache = new LRUCache<any>(5);
      cache.set("null-key", null);
      cache.set("undef-key", undefined);

      // null values are indistinguishable from cache misses via get()
      expect(cache.get("null-key")).toBe(null);
      expect(cache.get("undef-key")).toBe(undefined);
    });

    it("should use default maxSize of 50 if not specified", () => {
      const cache = new LRUCache<string>();
      const stats = cache.stats();
      expect(stats.maxSize).toBe(50);
    });

    it("should handle large number of entries up to maxSize", () => {
      const cache = new LRUCache<string>(1000);
      for (let i = 0; i < 1000; i++) {
        cache.set(`key${i}`, `value${i}`);
      }
      expect(cache.size()).toBe(1000);

      // Adding one more evicts the oldest
      cache.set("overflow", "value");
      expect(cache.size()).toBe(1000);
      expect(cache.get("key0")).toBeNull();
      expect(cache.get("overflow")).toBe("value");
    });
  });
});
