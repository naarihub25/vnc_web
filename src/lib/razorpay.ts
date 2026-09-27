export type RazorpayPayment = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayMethods = {
  card: boolean;
  upi: boolean;
  netbanking: Record<string, string>;
};

export type RazorpayPaymentData = {
  amount: number;
  currency: string;
  email: string;
  contact: string;
  order_id: string;
  method: "card" | "upi" | "netbanking";
  description: string;
  notes: { orderId: string };
  upi?: { vpa: string; flow: "collect" };
  bank?: string;
  "card[name]"?: string;
  "card[number]"?: string;
  "card[cvv]"?: string;
  "card[expiry_month]"?: string;
  "card[expiry_year]"?: string;
};

type RazorpayError = {
  code?: string;
  description?: string;
  source?: string;
  step?: string;
  reason?: string;
  metadata?: { order_id?: string; payment_id?: string };
};

export type CustomCheckoutResult =
  | { status: "paid"; payment: RazorpayPayment }
  | { status: "failed"; message: string; details?: RazorpayError };

type RazorpayInstance = {
  createPayment(data: RazorpayPaymentData): void;
  once(event: "ready", callback: (response: { methods?: unknown }) => void): void;
  on(event: "payment.success", callback: (response: RazorpayPayment) => void): void;
  on(event: "payment.error", callback: (response: { error?: RazorpayError }) => void): void;
};

type RazorpayConstructor = new (options: { key: string; image?: string }) => RazorpayInstance;

declare global {
  interface Window { Razorpay?: RazorpayConstructor }
}

const scriptId = "razorpay-custom-checkout-script";
const fallbackMethods: RazorpayMethods = { card: true, upi: true, netbanking: {} };

export function loadRazorpay() {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise<boolean>((resolve) => {
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.razorpay.com/v1/razorpay.js";
    script.async = true;
    script.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });
    document.head.appendChild(script);
  });
}

function normalizeMethods(value: unknown): RazorpayMethods {
  if (!value || typeof value !== "object") return { card: false, upi: false, netbanking: {} };
  const methods = value as Record<string, unknown>;
  const banks = methods.netbanking && typeof methods.netbanking === "object" && !Array.isArray(methods.netbanking)
    ? Object.fromEntries(Object.entries(methods.netbanking as Record<string, unknown>).filter((entry): entry is [string, string] => typeof entry[1] === "string")) : {};
  return { card: methods.card === true, upi: methods.upi === true, netbanking: banks };
}

export async function fetchRazorpayMethods(key: string): Promise<{ methods: RazorpayMethods; fallback: boolean }> {
  const loaded = await loadRazorpay();
  if (!loaded || !window.Razorpay) return { methods: fallbackMethods, fallback: true };
  const Razorpay = window.Razorpay;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (methods: RazorpayMethods, fallback: boolean) => { if (!settled) { settled = true; resolve({ methods, fallback }); } };
    const timer = window.setTimeout(() => finish(fallbackMethods, true), 5000);
    const razorpay = new Razorpay({ key, image: "/brand/vnu-logo.jpeg" });
    razorpay.once("ready", (response) => {
      window.clearTimeout(timer);
      const methods = normalizeMethods(response.methods);
      const available = methods.card || methods.upi || Object.keys(methods.netbanking).length > 0;
      finish(available ? methods : fallbackMethods, !available);
    });
  });
}

export function createRazorpayPayment(key: string, data: RazorpayPaymentData): Promise<CustomCheckoutResult> {
  return new Promise((resolve) => {
    if (!window.Razorpay) { resolve({ status: "failed", message: "Razorpay Custom Checkout is unavailable." }); return; }
    let settled = false;
    const finish = (result: CustomCheckoutResult) => { if (!settled) { settled = true; resolve(result); } };
    const razorpay = new window.Razorpay({ key, image: "/brand/vnu-logo.jpeg" });
    razorpay.on("payment.success", (payment) => finish({ status: "paid", payment }));
    razorpay.on("payment.error", (response) => {
      const details = response.error;
      finish({ status: "failed", message: details?.description || "The payment was unsuccessful.", details });
    });
    razorpay.createPayment(data);
  });
}
