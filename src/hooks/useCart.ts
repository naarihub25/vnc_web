import { useMemo, useSyncExternalStore } from "react";

export type CartItem = {
  id: string; slug?: string; name: string; image: string; price: number; currency: string;
  wholesale: boolean; quantity: number; minimum: number; stock: number;
};
const key = "vnuCart";
const eventName = "vnu-cart-change";
const cartLifetime = 5 * 60 * 1000;
function readCart(): { items: CartItem[]; expiresAt: number } | null {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? "null");
    if (!stored || !Array.isArray(stored.items) || !Number.isFinite(stored.expiresAt)) return null;
    return stored;
  } catch { return null; }
}
function snapshot() {
  const cart = readCart();
  return cart && cart.expiresAt > Date.now() ? JSON.stringify(cart.items) : "[]";
}
function parse(value: string): CartItem[] {
  try {
    const items = JSON.parse(value);
    return Array.isArray(items) ? items.filter((item) => item && typeof item.id === "string" && (item.slug === undefined || typeof item.slug === "string") && typeof item.name === "string" &&
      typeof item.image === "string" && typeof item.currency === "string" && /^[A-Z]{3}$/.test(item.currency) && typeof item.wholesale === "boolean" &&
      Number.isFinite(item.price) && item.price >= 0 && Number.isSafeInteger(item.minimum) && item.minimum >= 1 &&
      Number.isSafeInteger(item.stock) && item.stock >= item.minimum && Number.isSafeInteger(item.quantity) && item.quantity >= item.minimum && item.quantity <= item.stock) : [];
  } catch { return []; }
}
function subscribe(listener: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    clearTimeout(timer);
    const cart = readCart();
    if (!cart || cart.expiresAt <= Date.now()) {
      // Remove expired and legacy carts without a trustworthy expiration timestamp.
      try { localStorage.removeItem(key); } catch { /* Storage can be unavailable. */ }
    } else {
      timer = setTimeout(refresh, Math.min(cart.expiresAt - Date.now(), cartLifetime));
    }
    listener();
  };
  window.addEventListener("storage", refresh);
  window.addEventListener(eventName, refresh);
  window.addEventListener("focus", refresh);
  document.addEventListener("visibilitychange", refresh);
  refresh();
  return () => {
    clearTimeout(timer);
    window.removeEventListener("storage", refresh);
    window.removeEventListener(eventName, refresh);
    window.removeEventListener("focus", refresh);
    document.removeEventListener("visibilitychange", refresh);
  };
}
function save(items: CartItem[]) {
  try {
    if (items.length) localStorage.setItem(key, JSON.stringify({ items, expiresAt: Date.now() + cartLifetime }));
    else localStorage.removeItem(key);
    window.dispatchEvent(new Event(eventName));
  } catch { throw new Error("Your browser could not save the cart. Please enable local storage and try again."); }
}
export const cartItemKey = (item: Pick<CartItem, "id" | "wholesale">) => `${item.wholesale ? "wholesale" : "retail"}:${item.id}`;
export function addToCart(item: CartItem) {
  if (parse(JSON.stringify([item])).length !== 1) throw new Error("This quantity or product is unavailable.");
  const items = parse(snapshot());
  const index = items.findIndex((entry) => cartItemKey(entry) === cartItemKey(item));
  const quantity = item.quantity + (index >= 0 ? items[index].quantity : 0);
  if (quantity > item.stock) throw new Error("This quantity exceeds available stock, including items already in your cart.");
  const next = { ...item, quantity };
  if (index >= 0) items[index] = next; else items.push(next);
  save(items);
}
export function setCartQuantity(itemKey: string, quantity: number) {
  const items = parse(snapshot());
  const item = items.find((entry) => cartItemKey(entry) === itemKey);
  if (!item || !Number.isSafeInteger(quantity) || quantity < item.minimum || quantity > item.stock) throw new Error("Choose a quantity within the available stock and minimum order quantity.");
  save(items.map((entry) => cartItemKey(entry) === itemKey ? { ...entry, quantity } : entry));
}
export function removeCartItem(itemKey: string) { save(parse(snapshot()).filter((item) => cartItemKey(item) !== itemKey)); }
const serverSnapshot = () => "[]";
export function useCart() {
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const items = useMemo(() => parse(value), [value]);
  return { items, count: items.reduce((sum, item) => sum + item.quantity, 0) };
}

export function getCartItems(): CartItem[] { return parse(snapshot()); }
export function clearOrderedCart(ordered: CartItem[]) {
  // Preserve a cart changed in another tab while the order was being submitted.
  if (JSON.stringify(getCartItems()) === JSON.stringify(ordered)) save([]);
}
