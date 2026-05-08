export type ApiDatePreset = "all" | "today" | "7d" | "30d" | "90d" | "12m" | "custom";

export interface ApiDateFilterStateLike {
  preset: ApiDatePreset;
  customStartDate: string;
  customEndDate: string;
}

function toYmd(value: string): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function buildDateFilterParams(
  filter?: ApiDateFilterStateLike
): Record<string, string> {
  if (!filter || filter.preset === "all") return {};

  if (filter.preset === "custom") {
    const fromDate = toYmd(filter.customStartDate);
    const toDate = toYmd(filter.customEndDate);
    if (fromDate && toDate) {
      return {
        filter: "custom",
        from_date: fromDate,
        to_date: toDate,
      };
    }
    return {};
  }

  return { filter: filter.preset };
}

