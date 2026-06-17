"use client";

import { useMemo, useState } from "react";
import type { AvailableDeliveryDateDTO } from "@/lib/types";
import type { Language } from "@/lib/i18n";

type Props = {
  availableDates: AvailableDeliveryDateDTO[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
  language?: Language;
};

function parseDateKey(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function DeliveryCalendar({ availableDates, selectedDate, onSelect, language = "en" }: Props) {
  const availability = useMemo(
    () => new Map(availableDates.map((row) => [row.date, row])),
    [availableDates],
  );

  const schedulableDates = useMemo(
    () => availableDates.filter((row) => row.isAvailable),
    [availableDates],
  );

  const initialMonth = selectedDate
    ? parseDateKey(selectedDate)
    : schedulableDates[0]
      ? parseDateKey(schedulableDates[0].date)
      : availableDates[0]
        ? parseDateKey(availableDates[0].date)
        : new Date();

  const [viewMonth, setViewMonth] = useState(
    () => new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  );

  const monthLabel = viewMonth.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
    month: "long",
    year: "numeric",
  });

  const weeks = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days: Array<{ key: string; date: Date; inMonth: boolean }> = [];

    for (let i = 0; i < startPad; i += 1) {
      const d = new Date(year, month, -startPad + i + 1);
      days.push({ key: toDateKey(d), date: d, inMonth: false });
    }

    for (let day = 1; day <= last.getDate(); day += 1) {
      const d = new Date(year, month, day);
      days.push({ key: toDateKey(d), date: d, inMonth: true });
    }

    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - last.getDate() - startPad + 1);
      days.push({ key: toDateKey(d), date: d, inMonth: false });
    }

    const rows: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
    return rows;
  }, [viewMonth]);

  const weekdayLabels =
    language === "ar"
      ? ["أحد", "إثن", "ثل", "أرب", "خم", "جم", "سب"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-3 dark:bg-surface/60">
      <div className="mb-3 flex items-center justify-between gap-2">
        <button
          type="button"
          className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <p className="text-sm font-semibold">{monthLabel}</p>
        <button
          type="button"
          className="rounded-lg border border-border px-2 py-1 text-sm hover:bg-surface"
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-text-muted">
        {weekdayLabels.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="mt-1 space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((cell) => {
              const info = availability.get(cell.key);
              const inSchedulingWindow = availability.has(cell.key);
              const disabled = !cell.inMonth || !inSchedulingWindow || !info?.isAvailable;
              const selected = selectedDate === cell.key;
              return (
                <button
                  key={cell.key}
                  type="button"
                  disabled={disabled}
                  title={info?.reason ?? undefined}
                  onClick={() => onSelect(cell.key)}
                  className={`min-h-9 rounded-lg text-sm transition sm:min-h-10 ${
                    selected
                      ? "bg-primary font-semibold text-primary-foreground"
                      : disabled
                        ? "cursor-not-allowed text-text-muted/40"
                        : "hover:bg-primary/10 text-foreground"
                  } ${!cell.inMonth ? "opacity-30" : ""}`}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {availableDates.length > 0 && schedulableDates.length === 0 ? (
        <p className="mt-3 text-center text-xs text-text-muted">
          {language === "ar"
            ? "لا توجد تواريخ متاحة حالياً. تحقق من إعدادات الشحن أو جرّب لاحقاً."
            : "No delivery dates are available right now. Check shipping settings or try again later."}
        </p>
      ) : null}
    </div>
  );
}
