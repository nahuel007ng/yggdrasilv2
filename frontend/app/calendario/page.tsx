"use client";

import CalendarView from "@/components/CalendarView";

export default function CalendarioPage() {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="section-title">Calendario</h2>
      <CalendarView />
    </div>
  );
}