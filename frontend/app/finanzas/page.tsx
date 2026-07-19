"use client";

import { useState } from "react";
import MonthlySummary from "@/components/MonthlySummary";
import SavingsCard from "@/components/SavingsCard";
import ExpenseChart from "@/components/ExpenseChart";
import TransactionList from "@/components/TransactionList";

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

export default function FinanzasPage() {
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
      <h1 className="section-title glow-text">Finanzas</h1>
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

      <MonthlySummary month={month} year={year} />
      <SavingsCard month={month} year={year} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpenseChart month={month} year={year} />
        <TransactionList month={month} year={year} />
      </div>
    </div>
  );
}
