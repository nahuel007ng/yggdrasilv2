"use client";

import CalendarView from "@/components/CalendarView";

export default function CalendarioPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold font-pixel" style={{ color: "var(--color-text-heading)" }}>
        Calendario
      </h1>
      <CalendarView />
    </div>
  );
}