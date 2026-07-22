"use client";

import { useState } from "react";
import AcademicProgress from "@/components/AcademicProgress";
import ExamsPanel from "@/components/ExamsPanel";
import SubjectProgress from "@/components/SubjectProgress";
import StudyCalendar from "@/components/StudyCalendar";
import StudyStats from "@/components/StudyStats";

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

export default function EstudiosPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const goPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth() + 1;
  const canNext = !isCurrentMonth;
  const canPrev = true;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="section-title">Estudios</h2>
      <div className="flex items-center justify-between pixel-card p-3">
        <button
          type="button"
          className="pixel-btn"
          onClick={goPrev}
          disabled={!canPrev}
        >
          ◀
        </button>
        <span className="text-mana text-pixel text-sm">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          type="button"
          className="pixel-btn"
          onClick={goNext}
          disabled={!canNext}
        >
          ▶
        </button>
      </div>

      <StudyStats month={month} year={year} />

      <AcademicProgress />

      <ExamsPanel />

      <SubjectProgress />

      <StudyCalendar month={month} year={year} />
    </div>
  );
}
