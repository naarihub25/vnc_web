import { useMemo, useSyncExternalStore } from "react";
export type GuestCheckout = {
  name: string; email: string; phone: string;
  address: { line1: string; line2: string; city: string; state: string; postalCode: string; country: string };
  guestId?: string;
};
const key = "vnuGuestCheckout";
const eventName = "vnu-guest-checkout";
export function saveGuestCheckout(guest: GuestCheckout) {
  sessionStorage.setItem(key, JSON.stringify(guest));
  window.dispatchEvent(new Event(eventName));
}
function snapshot() { try { return sessionStorage.getItem(key); } catch { return null; } }
function subscribe(listener: () => void) {
  window.addEventListener(eventName, listener); window.addEventListener("storage", listener);
  return () => { window.removeEventListener(eventName, listener); window.removeEventListener("storage", listener); };
}
const serverSnapshot = () => undefined;
export function useGuestCheckout() {
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const guest = useMemo((): GuestCheckout | null => {
    try {
      const data = JSON.parse(value ?? "null");
      if (!data || ![data.name, data.email, data.phone, data.address?.line1, data.address?.city, data.address?.state, data.address?.postalCode, data.address?.country].every((field) => typeof field === "string" && field.trim())) return null;
      return data;
    } catch { return null; }
  }, [value]);
  return { guest, ready: value !== undefined };
}
