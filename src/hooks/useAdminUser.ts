import { useMemo, useSyncExternalStore } from "react";

type AdminUser = {
  _id: string;
  name: string;
  email: string;
  role: "admin";
  isActive: true;
};

function parseUser(value: string | null | undefined): AdminUser | null {
  if (!value) return null;
  try {
    const user = JSON.parse(value);
    return user && typeof user._id === "string" && user._id.length > 0 &&
      typeof user.name === "string" && typeof user.email === "string" &&
      user.role === "admin" && user.isActive === true ? user : null;
  } catch {
    return null;
  }
}

function getSnapshot(): string | null {
  for (const storageName of ["localStorage", "sessionStorage"] as const) {
    try {
      const value = window[storageName].getItem("vnucAdminUser");
      if (parseUser(value)) return value;
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  }
  return null;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

const getServerSnapshot = () => undefined;

export function useAdminUser() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const user = useMemo(() => parseUser(snapshot), [snapshot]);
  return { user, ready: snapshot !== undefined };
}
