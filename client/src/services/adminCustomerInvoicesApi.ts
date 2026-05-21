import APIClient from "./apiClient";
import { BACKEND_BASE_URL } from "./apiConfig";

const customerInvoicesClient = new APIClient("/api/v1/admin/customer-invoices", {
  baseURL: BACKEND_BASE_URL,
});

export interface CustomerInvoiceRow {
  id?: string | number;
  subtotal?: number | string | null;
  sub_total?: number | string | null;
  created_at?: string | null;
  customer?: {
    user_name?: string | null;
    email?: string | null;
  } | null;
  user_name?: string | null;
}

const INVOICE_LIST_KEYS = ["customer", "customers", "invoices", "items", "data"] as const;

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Unwrap nested `{ data: ... }` envelopes (Laravel-style). */
function unwrapPayload(raw: unknown): Record<string, unknown> {
  let current: unknown = raw;
  for (let depth = 0; depth < 6; depth += 1) {
    const record = readRecord(current);
    if (!record) break;
    const nested = record.data;
    if (nested !== undefined && typeof nested === "object") {
      current = nested;
      continue;
    }
    return record;
  }
  return readRecord(current) ?? {};
}

/** Find invoice rows array anywhere in the API payload. */
export function extractCustomerInvoiceRowsFromPayload(raw: unknown): CustomerInvoiceRow[] {
  if (Array.isArray(raw)) return raw as CustomerInvoiceRow[];

  const root = unwrapPayload(raw);
  for (const key of INVOICE_LIST_KEYS) {
    const value = root[key];
    if (Array.isArray(value)) return value as CustomerInvoiceRow[];
    const nested = readRecord(value);
    if (nested) {
      for (const innerKey of INVOICE_LIST_KEYS) {
        const inner = nested[innerKey];
        if (Array.isArray(inner)) return inner as CustomerInvoiceRow[];
      }
    }
  }

  return [];
}

export type CustomerRevenueTableRow = {
  id: string;
  name: string;
  plan: string;
  totalRevenue: number | null;
  lastBilling: string;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function displayOrNa(value: unknown): string {
  if (value == null) return "N/A";
  const s = String(value).trim();
  if (!s || s.toLowerCase() === "null") return "N/A";
  return s;
}

/** Stripe amounts are in cents; convert to dollars for display. */
function stripeAmountToDollars(value: unknown): number | null {
  if (value == null) return null;
  const cents = toNumber(value, Number.NaN);
  if (!Number.isFinite(cents)) return null;
  return cents / 100;
}

export function mapCustomerInvoicesToTableRows(
  rows: CustomerInvoiceRow[]
): CustomerRevenueTableRow[] {
  return rows.map((row, rowIndex) => {
    const customer =
      row.customer && typeof row.customer === "object" ? row.customer : null;
    const subtotal = row.subtotal ?? row.sub_total ?? null;
    const createdAt = row.created_at ?? null;
    const displayName =
      customer?.user_name ?? row.user_name ?? customer?.email ?? null;

    return {
      id: `invoice-${String(row.id ?? rowIndex)}`,
      name: displayOrNa(displayName),
      plan: "N/A",
      totalRevenue: stripeAmountToDollars(subtotal),
      lastBilling: displayOrNa(createdAt),
    };
  });
}

/** GET `/api/v1/admin/customer-invoices` — no date filter or pagination params. */
export async function adminCustomerInvoices(): Promise<unknown> {
  const { data } = await customerInvoicesClient.get<unknown>({});
  return data;
}
