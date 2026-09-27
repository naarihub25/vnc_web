import { useEffect, useSyncExternalStore } from "react";

export type StoreCategory = {
  _id: string; name: string; slug: string; parentCategory: string | { _id: string } | null;
  description?: string; imageUrl: string; isActive: boolean; sortOrder: number;
};
type State = { categories: StoreCategory[]; loading: boolean; error: string };
const initial: State = { categories: [], loading: true, error: "" };
let state = initial;
let pending: Promise<void> | null = null;
const listeners = new Set<() => void>();
function publish(next: State) { state = next; listeners.forEach((listener) => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export const parentId = (category: StoreCategory) => typeof category.parentCategory === "object" ? category.parentCategory?._id ?? null : category.parentCategory || null;
export const categoryHref = (category: StoreCategory, wholesale = false) => `${wholesale ? "/wholesale" : ""}/categories/${encodeURIComponent(category.slug)}`;
async function load() {
  if (pending) return pending;
  publish({ ...state, loading: true, error: "" });
  pending = (async () => {
    try {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
      const records = new Map<string, StoreCategory>();
      let page = 1;
      while (true) {
        const response = await fetch(`${base}/api/categories?page=${page}&limit=100`, { cache: "no-store" });
        const result = await response.json();
        if (!response.ok || !Array.isArray(result?.categories) || typeof result.total !== "number") throw new Error("Categories are unavailable. Please try again.");
        const previousSize = records.size;
        for (const category of result.categories) records.set(category._id, category);
        if (records.size >= result.total) break;
        if (records.size === previousSize) throw new Error("Unable to load all categories. Please try again.");
        page += 1;
      }
      const categories = [...records.values()].filter((category) => category.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
      publish({ categories, loading: false, error: "" });
    } catch {
      publish({ categories: [], loading: false, error: "Categories are unavailable. Please try again." });
    }
  })().finally(() => { pending = null; });
  return pending;
}
const getSnapshot = () => state;
const getServerSnapshot = () => initial;
export function useStoreCategories() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => { if (state === initial) void load(); }, []);
  return { ...snapshot, roots: snapshot.categories.filter((category) => !parentId(category)), retry: load };
}
