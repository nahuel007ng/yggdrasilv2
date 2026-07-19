"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type EventType = "reminder" | "task" | "finance" | "exam";

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: EventType;
  time?: string | null;
  detail?: string;
}

interface ReminderRow {
  id: string;
  description: string;
  reminder_date: string;
  reminder_time: string | null;
  is_recurring: boolean;
  remind_before_minutes: number | null;
}

interface TaskRow {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  priority: string | null;
}

interface TransactionRow {
  id: string;
  description: string | null;
  amount: number;
  expected_date: string | null;
  type: string;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const DOW_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const EVENT_META: Record<
  EventType,
  { color: string; emoji: string; label: string }
> = {
  reminder: { color: "var(--color-coral)", emoji: "🔔", label: "Recordatorio" },
  task: { color: "var(--color-mana)", emoji: "📋", label: "Tarea" },
  finance: { color: "var(--color-gold)", emoji: "💰", label: "Finanzas" },
  exam: { color: "var(--color-purple)", emoji: "📚", label: "Examen" },
};

const EXAM_PERIODS = [
  { start: "2026-11-30", end: "2026-12-04", label: "1er llamado Dic 2026" },
  { start: "2026-12-14", end: "2026-12-18", label: "2do llamado Dic 2026" },
  { start: "2027-02-22", end: "2027-02-26", label: "1er llamado Mar 2027" },
  { start: "2027-03-15", end: "2027-03-19", label: "2do llamado Mar 2027" },
];

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getDowIndex(date: Date): number {
  const jsDow = date.getDay();
  return jsDow === 0 ? 6 : jsDow - 1;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function dateStr(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function CalendarView() {
  const [today] = useState(() => new Date());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<CalendarEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const startOfMonth = `${year}-${pad2(month)}-01`;
    const lastDay = getLastDayOfMonth(year, month);
    const endOfMonth = `${year}-${pad2(month)}-${pad2(lastDay)}`;

    Promise.all([
      supabase
        .from("reminders")
        .select(
          "id, description, reminder_date, reminder_time, is_recurring, remind_before_minutes"
        )
        .eq("is_completed", false)
        .gte("reminder_date", startOfMonth)
        .lte("reminder_date", endOfMonth),
      supabase
        .from("tasks")
        .select("id, title, due_date, status, priority")
        .eq("is_deleted", false)
        .not("due_date", "is", null)
        .gte("due_date", startOfMonth)
        .lte("due_date", endOfMonth),
      supabase
        .from("transactions")
        .select("id, description, amount, expected_date, type")
        .eq("status", "pending")
        .not("expected_date", "is", null)
        .gte("expected_date", startOfMonth)
        .lte("expected_date", endOfMonth),
      supabase
        .from("subjects")
        .select("id, name, status")
        .eq("status", "cursando"),
    ]).then(([rRes, tRes, txRes, sRes]) => {
      if (cancelled) return;
      const err =
        rRes.error || tRes.error || txRes.error || sRes.error;
      if (err) {
        setError(err.message);
        return;
      }

      const reminders = (rRes.data ?? []) as ReminderRow[];
      const tasks = (tRes.data ?? []) as TaskRow[];
      const transactions = (txRes.data ?? []) as TransactionRow[];

      const evs: CalendarEvent[] = [];

      reminders.forEach((r) => {
        evs.push({
          id: r.id,
          date: r.reminder_date,
          title: r.description,
          type: "reminder",
          time: r.reminder_time || null,
          detail: r.is_recurring ? "recurrente" : undefined,
        });
      });

      tasks.forEach((t) => {
        if (!t.due_date) return;
        evs.push({
          id: t.id,
          date: t.due_date.slice(0, 10),
          title: t.title,
          type: "task",
          detail: t.status,
        });
      });

      transactions.forEach((tx) => {
        if (!tx.expected_date) return;
        evs.push({
          id: tx.id,
          date: tx.expected_date,
          title: tx.description || "Transaccion",
          type: "finance",
          detail: `$${Number(tx.amount).toLocaleString()}`,
        });
      });

      EXAM_PERIODS.forEach((period) => {
        const start = new Date(period.start + "T00:00:00");
        const end = new Date(period.end + "T00:00:00");
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const ds = toYmd(d);
          if (ds >= startOfMonth && ds <= endOfMonth) {
            evs.push({
              id: `exam-${period.label}-${ds}`,
              date: ds,
              title: period.label,
              type: "exam",
            });
          }
        }
      });

      setEvents(evs);
    });

    return () => {
      cancelled = true;
    };
  }, [year, month]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    if (!events) return map;
    for (const e of events) {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    }
    return map;
  }, [events]);

  const lastDay = getLastDayOfMonth(year, month);
  const firstDay = new Date(year, month - 1, 1);
  const startOffset = getDowIndex(firstDay);
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) cells.push(d);

  const todayStr = useMemo(() => toYmd(today), [today]);
  const monthTitle = `${MONTH_NAMES[month - 1]} ${year}`;

  const handlePrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };
  const handleNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const weekLaterStr = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return toYmd(d);
  }, [today]);

  const upcomingEvents = useMemo(() => {
    if (!events) return [];
    return events
      .filter((e) => e.date >= todayStr && e.date <= weekLaterStr)
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          (a.time || "").localeCompare(b.time || "")
      );
  }, [events, todayStr, weekLaterStr]);

  const displayDate = selectedDate ?? todayStr;
  const selectedEvents = eventsByDate[displayDate] ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="pixel-card">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            className="pixel-btn"
            onClick={handlePrev}
            aria-label="Mes anterior"
          >
            ◀
          </button>
          <span className="text-mana text-pixel text-xs">{monthTitle}</span>
          <button
            type="button"
            className="pixel-btn"
            onClick={handleNext}
            aria-label="Mes siguiente"
          >
            ▶
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-3 text-xs">
          {(Object.keys(EVENT_META) as EventType[]).map((t) => {
            const meta = EVENT_META[t];
            return (
              <span key={t} className="flex items-center gap-1 text-muted">
                <span
                  className="inline-block w-2.5 h-2.5"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${meta.color} 20%, transparent)`,
                    border: `1px solid ${meta.color}`,
                  }}
                />
                <span style={{ color: meta.color }}>{meta.emoji}</span> {meta.label}
              </span>
            );
          })}
        </div>

        {error && <p className="text-hp">Error: {error}</p>}
        {!error && events === null && (
          <p className="text-muted">Cargando calendario...</p>
        )}

        {!error && events !== null && (
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 min-w-[280px]">
              {DOW_LABELS.map((d) => (
                <div
                  key={d}
                  className="text-center text-xs text-muted text-pixel py-1"
                >
                  {d}
                </div>
              ))}
              {cells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} />;
                }
                const ds = dateStr(year, month, day);
                const dayEvents = eventsByDate[ds] ?? [];
                const isToday = ds === todayStr;
                const isSelected = ds === selectedDate;

                const typesPresent = new Set(
                  dayEvents.map((e) => e.type)
                );

                let cellClass =
                  "flex flex-col items-center justify-center py-2 text-xs cursor-pointer border ";
                cellClass += isSelected
                  ? "ring-2 ring-[--color-purple] bg-[--color-bg-surface-hover] border-[--color-border] "
                  : "bg-[--color-bg] hover:bg-[--color-bg-surface-hover] border-[--color-border] ";
                const cellStyle: React.CSSProperties = {};
                if (isToday) {
                  cellClass = cellClass
                    .replace("border-[--color-border]", "border-[--color-border-accent]")
                    .replace("ring-2 ring-[--color-purple]", "ring-2 ring-[--color-border-accent]");
                  cellStyle.boxShadow = "var(--glow-mana-soft)";
                }

                return (
                  <div
                    key={ds}
                    className={cellClass}
                    style={cellStyle}
                    onClick={() => setSelectedDate(ds)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedDate(ds);
                      }
                    }}
                  >
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                        {(Object.keys(EVENT_META) as EventType[]).map((t) =>
                          typesPresent.has(t) ? (
                            <span
                              key={t}
                              className="inline-block w-1.5 h-1.5"
                              style={{
                                backgroundColor: EVENT_META[t].color,
                                boxShadow: `0 0 4px ${EVENT_META[t].color}`,
                              }}
                            />
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pixel-card">
        <h3 className="pixel-card-title">
          {selectedDate
            ? `Eventos del ${selectedDate}`
            : "Proximos 7 dias"}
        </h3>
        {selectedEvents.length === 0 && upcomingEvents.length === 0 ? (
          <p className="text-muted text-sm">No hay eventos.</p>
        ) : !selectedDate && upcomingEvents.length === 0 ? (
          <p className="text-muted text-sm">
            No hay eventos en los proximos 7 dias.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {(selectedDate ? selectedEvents : upcomingEvents).map((e) => {
              const meta = EVENT_META[e.type];
              return (
                <div
                  key={e.id}
                  className="flex items-start gap-2 pixel-border bg-[--color-bg] p-2 px-3"
                >
                  <span style={{ color: meta.color }}>{meta.emoji}</span>
                  <div className="flex-1">
                    <div className="text-xs" style={{ color: meta.color }}>{e.title}</div>
                    <div className="text-muted text-[10px] flex gap-2">
                      {e.time && <span>{e.time.slice(0, 5)}</span>}
                      {e.detail && <span>{e.detail}</span>}
                      <span>{meta.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}