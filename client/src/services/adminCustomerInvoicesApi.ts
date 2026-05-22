import APIClient from "./apiClient";
import { buildDateFilterParams, type ApiDateFilterStateLike } from "./dateFilterParams";
import { BACKEND_BASE_URL } from "./apiConfig";

const customerInvoicesClient = new APIClient("/api/v1/admin/customer-invoices", {
  baseURL: BACKEND_BASE_URL,
});

export interface CustomerInvoiceRow {
  id?: string | number;
  subtotal?: number | string | null;
  sub_total?: number | string | null;
  created_at?: string | null;
  stripe_customer_id?: string | null;
  customer_type?: string | null;
  customer?: {
    user_name?: string | null;
    email?: string | null;
    stripe_customer_id?: string | null;
    customer_type?: string | null;
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

function planFromCustomerType(value: unknown): string {
  if (value == null) return "N/A";
  const s = String(value).trim();
  if (!s || s.toLowerCase() === "null") return "N/A";
  const lower = s.toLowerCase();
  if (lower === "standard") return "Standard";
  if (lower === "enterprise") return "Enterprise";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Stripe amounts are in cents; convert to dollars for display. */
function stripeAmountToDollars(value: unknown): number | null {
  if (value == null) return null;
  const cents = toNumber(value, Number.NaN);
  if (!Number.isFinite(cents)) return null;
  return cents / 100;
}

export type TopCustomerByRevenue = {
  name: string;
  amount: number;
  stripeCustomerId: string;
};

function customerDisplayName(row: CustomerInvoiceRow): string {
  const customer =
    row.customer && typeof row.customer === "object" ? row.customer : null;
  const raw =
    customer?.user_name ?? row.user_name ?? customer?.email ?? null;
  const name = displayOrNa(raw);
  return name === "N/A" ? "Unknown" : name;
}

function invoiceStripeCustomerId(row: CustomerInvoiceRow): string {
  const customer =
    row.customer && typeof row.customer === "object" ? row.customer : null;
  const id = row.stripe_customer_id ?? customer?.stripe_customer_id ?? null;
  if (id == null) return "";
  const s = String(id).trim();
  if (!s || s.toLowerCase() === "null") return "";
  return s;
}

/** Group by `stripe_customer_id`, sum subtotals (cents → dollars), return top N. */
export function mapTopCustomersByRevenueFromInvoices(
  rows: CustomerInvoiceRow[],
  limit = 5
): TopCustomerByRevenue[] {
  const grouped = new Map<
    string,
    { name: string; amount: number; stripeCustomerId: string }
  >();

  rows.forEach((row, rowIndex) => {
    const stripeCustomerId = invoiceStripeCustomerId(row);
    const groupKey =
      stripeCustomerId.length > 0
        ? stripeCustomerId
        : `__invoice_${String(row.id ?? rowIndex)}`;
    const added = stripeAmountToDollars(row.subtotal ?? row.sub_total) ?? 0;
    const name = customerDisplayName(row);

    const existing = grouped.get(groupKey);
    if (existing) {
      existing.amount += added;
      if (existing.name === "Unknown" && name !== "Unknown") {
        existing.name = name;
      }
    } else {
      grouped.set(groupKey, {
        name,
        amount: added,
        stripeCustomerId: stripeCustomerId || groupKey,
      });
    }
  });

  return Array.from(grouped.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
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
    const customerType = row.customer_type ?? customer?.customer_type ?? null;
    return {
      id: `invoice-${String(row.id ?? rowIndex)}`,
      name: displayOrNa(displayName),
      plan: planFromCustomerType(customerType),
      totalRevenue: stripeAmountToDollars(subtotal),
      lastBilling: displayOrNa(createdAt),
    };
  });
}

export interface CustomerInvoicesPaginationMeta {
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

export function extractCustomerInvoicesPagination(
  raw: unknown
): CustomerInvoicesPaginationMeta | null {
  const root = unwrapPayload(raw);
  const invoices = readRecord(root.invoices);
  if (!invoices) return null;

  const total = Number(invoices.total);
  const currentPage = Number(invoices.current_page);
  const lastPage = Number(invoices.last_page);
  const perPage = Number(invoices.per_page);

  if (!Number.isFinite(total) || !Number.isFinite(currentPage) || !Number.isFinite(lastPage)) {
    return null;
  }

  return {
    total,
    current_page: currentPage,
    last_page: Math.max(1, lastPage),
    per_page: Number.isFinite(perPage) ? perPage : 10,
  };
}

export function extractInvoiceRevenueSummaryFromPayload(raw: unknown): {
  totalEarning: number;
  averageRevenuePerUser: number;
  totalEarningPercentage: number;
  averageRevenuePerUserPercentage: number;
  uniqueCustomersCount: number;
} | null {
  const candidates: Record<string, unknown>[] = [];
  const unwrapped = unwrapPayload(raw);
  candidates.push(unwrapped);
  const top = readRecord(raw);
  if (top) candidates.push(top);
  const nested = readRecord(top?.data);
  if (nested) candidates.push(nested);

  for (const root of candidates) {
    const totalEarning = toNumber(root.total_earning, Number.NaN);
    const averageRevenuePerUser = toNumber(root.average_revenue_per_user, Number.NaN);
    const totalEarningPercentage = toNumber(root.total_earning_percentage, Number.NaN);
    const averageRevenuePerUserPercentage = toNumber(
      root.average_revenue_per_user_percentage,
      Number.NaN
    );
    const hasTotal = Number.isFinite(totalEarning);
    const hasAverage = Number.isFinite(averageRevenuePerUser);
    const hasTotalPct = Number.isFinite(totalEarningPercentage);
    const hasAveragePct = Number.isFinite(averageRevenuePerUserPercentage);
    if (!hasTotal && !hasAverage && !hasTotalPct && !hasAveragePct) continue;

    return {
      totalEarning: hasTotal ? totalEarning : 0,
      averageRevenuePerUser: hasAverage ? averageRevenuePerUser : 0,
      totalEarningPercentage: hasTotalPct ? totalEarningPercentage : 0,
      averageRevenuePerUserPercentage: hasAveragePct ? averageRevenuePerUserPercentage : 0,
      uniqueCustomersCount: toNumber(root.unique_customers_count, 0),
    };
  }

  return null;
}

export type RevenueOverTimePoint = {
  month: string;
  earning: number;
};

export function extractRevenueOverTimeFromPayload(raw: unknown): RevenueOverTimePoint[] {
  const candidates: Record<string, unknown>[] = [];
  const unwrapped = unwrapPayload(raw);
  candidates.push(unwrapped);
  const top = readRecord(raw);
  if (top) candidates.push(top);
  const nested = readRecord(top?.data);
  if (nested) candidates.push(nested);

  for (const root of candidates) {
    const series = root.revenue_over_time;
    if (!Array.isArray(series)) continue;

    return series.map((item) => {
      const row = readRecord(item) ?? {};
      return {
        month: String(row.month ?? row.label ?? row.period ?? row.date ?? "—"),
        earning: toNumber(
          row.earning ??
            row.total_earning ??
            row.total_earnings ??
            row.revenue ??
            row.mrr,
          0
        ),
      };
    });
  }

  return [];
}

export function extractTopCustomersByRevenueFromPayload(
  raw: unknown
): TopCustomerByRevenue[] {
  const root = unwrapPayload(raw);
  const items = root.top_customers_by_revenue;
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const row = readRecord(item);
      if (!row) return null;
      const amount = toNumber(row.amount, Number.NaN);
      if (!Number.isFinite(amount)) return null;
      const name = displayOrNa(row.name);
      const stripeCustomerId = String(row.stripe_customer_id ?? "").trim();

      return {
        name: name === "N/A" ? "Unknown" : name,
        amount,
        stripeCustomerId: stripeCustomerId || "—",
      };
    })
    .filter((row): row is TopCustomerByRevenue => row !== null);
}

/** GET `/api/v1/admin/customer-invoices` — date filter + pagination query params. */
export async function adminCustomerInvoices(
  filter?: ApiDateFilterStateLike,
  options?: { page?: number; perPage?: number }
): Promise<unknown> {
  const params: Record<string, unknown> = {
    ...buildDateFilterParams(filter),
  };
  if (options?.page != null && options.page > 0) {
    params.page = options.page;
  }
  if (options?.perPage != null && options.perPage > 0) {
    params.per_page = options.perPage;
  }
  const { data } = await customerInvoicesClient.get<unknown>(params);
  return data;
}
