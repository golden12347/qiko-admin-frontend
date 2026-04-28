import React, { createContext, useContext, useMemo, useState } from "react";

export type GlobalDatePreset = "all" | "today" | "7d" | "30d" | "90d" | "12m" | "custom";

export interface GlobalDateFilterState {
  preset: GlobalDatePreset;
  customStartDate: string;
  customEndDate: string;
}

interface GlobalDateFilterContextType {
  filter: GlobalDateFilterState;
  setPreset: (preset: GlobalDatePreset) => void;
  setCustomStartDate: (value: string) => void;
  setCustomEndDate: (value: string) => void;
  clearFilter: () => void;
}

const GlobalDateFilterContext = createContext<GlobalDateFilterContextType | undefined>(undefined);

export function parseDateValue(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const dateTimeMatch = value.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (dateTimeMatch) {
    const [, datePart, hh, mm, ss = "00", meridiemRaw] = dateTimeMatch;
    let hours = Number(hh);
    const minutes = Number(mm);
    const seconds = Number(ss);
    const meridiem = meridiemRaw?.toUpperCase();

    if (meridiem && hours >= 1 && hours <= 12) {
      if (meridiem === "PM" && hours !== 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
    }

    const normalized = new Date(`${datePart}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`);
    if (!Number.isNaN(normalized.getTime())) {
      return normalized;
    }
  }

  const nativeParsed = new Date(value);
  if (!Number.isNaN(nativeParsed.getTime())) {
    return nativeParsed;
  }

  const monthMatch = value.match(/^([A-Za-z]{3})\s+(\d{4})$/);
  if (monthMatch) {
    const monthParsed = new Date(`${monthMatch[1]} 1, ${monthMatch[2]}`);
    if (!Number.isNaN(monthParsed.getTime())) {
      return monthParsed;
    }
  }

  return null;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function resolveDateFilterRange(filter: GlobalDateFilterState, nowInput = new Date()): { start?: Date; end?: Date } {
  const now = new Date(nowInput);
  const end = endOfDay(now);

  switch (filter.preset) {
    case "today":
      return { start: startOfDay(now), end };
    case "7d":
      return { start: startOfDay(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)), end };
    case "30d":
      return { start: startOfDay(new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)), end };
    case "90d":
      return { start: startOfDay(new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)), end };
    case "12m":
      return { start: startOfDay(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())), end };
    case "custom": {
      const start = filter.customStartDate ? parseDateValue(filter.customStartDate) : null;
      const customEnd = filter.customEndDate ? parseDateValue(filter.customEndDate) : null;
      return {
        start: start ? startOfDay(start) : undefined,
        end: customEnd ? endOfDay(customEnd) : undefined,
      };
    }
    case "all":
    default:
      return {};
  }
}

export function isDateInGlobalRange(value: string | Date, filter: GlobalDateFilterState): boolean {
  const parsedDate = parseDateValue(value);
  if (!parsedDate) return false;

  const { start, end } = resolveDateFilterRange(filter);
  if (start && parsedDate < start) return false;
  if (end && parsedDate > end) return false;
  return true;
}

export function getDatePresetLabel(preset: GlobalDatePreset): string {
  switch (preset) {
    case "all":
      return "All time";
    case "today":
      return "Today";
    case "7d":
      return "Last 7 days";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 90 days";
    case "12m":
      return "Last 12 months";
    case "custom":
      return "Custom";
    default:
      return "All time";
  }
}

export function GlobalDateFilterProvider({ children }: { children: React.ReactNode }) {
  const [filter, setFilter] = useState<GlobalDateFilterState>({
    preset: "all",
    customStartDate: "",
    customEndDate: "",
  });

  const value = useMemo<GlobalDateFilterContextType>(() => ({
    filter,
    setPreset: (preset) => setFilter((prev) => ({ ...prev, preset })),
    setCustomStartDate: (customStartDate) => setFilter((prev) => ({ ...prev, customStartDate })),
    setCustomEndDate: (customEndDate) => setFilter((prev) => ({ ...prev, customEndDate })),
    clearFilter: () => setFilter({ preset: "all", customStartDate: "", customEndDate: "" }),
  }), [filter]);

  return (
    <GlobalDateFilterContext.Provider value={value}>
      {children}
    </GlobalDateFilterContext.Provider>
  );
}

export function useGlobalDateFilter() {
  const context = useContext(GlobalDateFilterContext);
  if (!context) {
    throw new Error("useGlobalDateFilter must be used within GlobalDateFilterProvider");
  }
  return context;
}
