"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function formatARS(amount: number): string {
  return currencyFormatter.format(amount);
}

export interface MonthlySummaryProps {
  month: number;
  year: number;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface BudgetRow {
  amount: number;
}

interface SummaryState {
  totalIncome: number;
  totalExpenses: number;
  budget: number | null;
  error: string | null;
  loadedKey: string;
}

export default function MonthlySummary({ month, year }: MonthlySummaryProps) {
  const currentKey = `${year}-${month}`;
  const [state, setState] = useState<SummaryState>({
    totalIncome: 0,
    totalExpenses: 0,
    budget: null,
    error: null,
    loadedKey: "",
  });

  const startOfMonth = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = getLastDayOfMonth(year, month);
  const endOfMonth = `${year}-${String(month).padStart(2, "0")}-${String(
    lastDay
  ).padStart(2, "0")}`;

  useEffect(() => {
    const key = currentKey;
    let cancelled = false;

    Promise.all([
      supabase
        .from("transactions")
        .select("amount")
        .eq("type", "income")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth),
      supabase
        .from("transactions")
        .select("amount")
        .eq("type", "expense")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth),
      supabase
        .from("budgets")
        .select("amount")
        .is("category_id", null)
        .eq("month", month)
        .eq("year", year),
    ]).then(([incRes, expRes, budRes]) => {
      if (cancelled) return;
      let error: string | null = null;
      if (incRes.error) error = incRes.error.message;
      if (expRes.error) error = expRes.error.message;

      const totalIncome = (incRes.data ?? []).reduce(
        (sum: number, r: { amount: number }) => sum + Number(r.amount),
        0
      );
      const totalExpenses = (expRes.data ?? []).reduce(
        (sum: number, r: { amount: number }) => sum + Number(r.amount),
        0
      );
      const budgetRows = (budRes.data ?? []) as BudgetRow[];
      const budget =
        budgetRows.length > 0 ? Number(budgetRows[0].amount) : null;

      setState({
        totalIncome,
        totalExpenses,
        budget,
        error,
        loadedKey: key,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [currentKey, month, year, startOfMonth, endOfMonth]);

  const isLoading = state.loadedKey !== currentKey;

  if (state.error) {
    return (
      <div className="pixel-card pixel-border-error">
        <p className="text-hp">Error: {state.error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-muted">Cargando resumen...</p>;
  }

  const balance = state.totalIncome - state.totalExpenses;
  const budget = state.budget;
  const budgetUsage =
    budget && budget > 0
      ? Math.min(Math.round((state.totalExpenses / budget) * 100), 100)
      : null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="pixel-card">
        <p className="text-muted text-xs mb-1">💰 Ingresos</p>
        <p className="text-xp text-lg font-semibold">
          {formatARS(state.totalIncome)}
        </p>
      </div>
      <div className="pixel-card">
        <p className="text-muted text-xs mb-1">💸 Gastos</p>
        <p className="text-hp text-lg font-semibold">
          {formatARS(state.totalExpenses)}
        </p>
      </div>
      <div className="pixel-card">
        <p className="text-muted text-xs mb-1">📊 Balance</p>
        <p
          className={`text-lg font-semibold ${
            balance >= 0 ? "text-xp" : "text-hp"
          }`}
        >
          {formatARS(balance)}
        </p>
      </div>
      {budget !== null && budget > 0 && (
        <div className="pixel-card sm:col-span-3">
          <h3 className="pixel-card-title">Presupuesto</h3>
          <p className="text-muted text-xs mb-2">
            Presupuesto: {formatARS(budget)} — Usado: {budgetUsage}%
          </p>
          <div className="pixel-progress">
            <div
              className={`pixel-progress-fill ${
                (budgetUsage ?? 0) >= 100 ? "is-hp" : "is-xp"
              }`}
              style={{ width: `${budgetUsage ?? 0}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
