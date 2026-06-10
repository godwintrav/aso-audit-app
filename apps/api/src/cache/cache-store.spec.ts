import { describe, expect, it } from "vitest";
import { InMemoryCacheStore } from "./cache-store";

function clock(start = 1_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("InMemoryCacheStore", () => {
  it("stores and retrieves a value before it expires", () => {
    const c = clock();
    const store = new InMemoryCacheStore({ maxEntries: 10, now: c.now });
    store.set("k", { a: 1 }, 1_000);
    expect(store.get("k")).toEqual({ a: 1 });
  });

  it("returns undefined once a value has expired", () => {
    const c = clock();
    const store = new InMemoryCacheStore({ maxEntries: 10, now: c.now });
    store.set("k", "v", 1_000);
    c.advance(1_001);
    expect(store.get("k")).toBeUndefined();
    expect(store.size()).toBe(0);
  });

  it("evicts the least-recently-used entry past maxEntries", () => {
    const store = new InMemoryCacheStore({ maxEntries: 2 });
    store.set("a", 1, 10_000);
    store.set("b", 2, 10_000);
    store.get("a");
    store.set("c", 3, 10_000);

    expect(store.get("a")).toBe(1);
    expect(store.get("c")).toBe(3);
    expect(store.get("b")).toBeUndefined();
    expect(store.size()).toBe(2);
  });

  it("supports delete and clear", () => {
    const store = new InMemoryCacheStore({ maxEntries: 10 });
    store.set("a", 1, 10_000);
    store.set("b", 2, 10_000);
    store.delete("a");
    expect(store.get("a")).toBeUndefined();
    store.clear();
    expect(store.size()).toBe(0);
  });
});
