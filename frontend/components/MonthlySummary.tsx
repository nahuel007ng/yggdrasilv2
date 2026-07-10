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

interface AmountRow {
  amount: number;
  type: "income" | "expense";
  status: "pending" | "completed";
}

interface BudgetRow {
  amount: number;
}

interface SummaryState {
  incomeCompleted: number;
  incomePending: number;
  expenseCompleted: number;
  expensePending: number;
  budget: number | null;
  error: string | null;
  loadedKey: string;
}

const WARNING_COLOR = "#f0ad4e";

export default function MonthlySummary({
  month,
  year,
}: MonthlySummaryProps) {
  const currentKey = `${year}-${month}`;
  const [state, setState] = useState<SummaryState>({
    incomeCompleted: 0,
    incomePending: 0,
    expenseCompleted: 0,
    expensePending: 0,
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
        .select("amount, type, status")
        .eq("status", "completed")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth),
      supabase
        .from("transactions")
        .select("amount, type, status")
        .eq("status", "pending")
        .gte("expected_date", startOfMonth)
        .lte("expected_date", endOfMonth),
      supabase
        .from("budgets")
        .select("amount")
        .is("category_id", null)
        .eq("month", month)
        .eq("year", year),
    ]).then(([doneRes, pendingRes, budRes]) => {
      if (cancelled) return;
      let error: string | null = null;
      if (doneRes.error) error = doneRes.error.message;
      if (pendingRes.error) error = pendingRes.error.message;
      if (budRes.error) error = budRes.error.message;

      const doneRows = (doneRes.data ?? []) as AmountRow[];
      const pendingRows = (pendingRes.data ?? []) as AmountRow[];

      const sum = (rows: AmountRow[], type: string, status: string) =>
        rows
          .filter((r) => r.type === type && r.status === status)
          .reduce((s, r) => s + Number(r.amount), 0);

      const incomeCompleted = sum(doneRows, "income", "completed");
      const expenseCompleted = sum(doneRows, "expense", "completed");
      const incomePending = sum(pendingRows, "income", "pending");
      const expensePending = sum(pendingRows, "expense", "pending");

      const budgetRows = (budRes.data ?? []) as BudgetRow[];
      const budget =
        budgetRows.length > 0 ? Number(budgetRows[0].amount) : null;

      setState({
        incomeCompleted,
        incomePending,
        expenseCompleted,
        expensePending,
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

  const balanceReal =
    state.incomeCompleted - state.expenseCompleted;
  const balanceProjected =
    state.incomeCompleted +
    state.incomePending -
    (state.expenseCompleted + state.expensePending);
  const incomeExpected = state.incomeCompleted + state.incomePending;
  const expenseExpected = state.expenseCompleted + state.expensePending;

  return (
    <div className="flex flex-col gap-3">
      {/* INGRESOS */}
      <div className="pixel-card">
        <h3 className="pixel-card-title">Ingresos</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-muted text-xs mb-1">Cobrados ✅</p>
            <p className="text-xp text-base font-semibold">
              {formatARS(state.incomeCompleted)}
            </p>
          </div>
          <div
            style={{
              opacity: 0.85,
              borderLeft: `3px solid ${WARNING_COLOR}`,
              paddingLeft: "8px",
            }}
          >
            <p className="text-muted text-xs mb-1">Por cobrar ⏳</p>
            <p
              className="text-base font-semibold"
              style={{ color: WARNING_COLOR }}
            >
              {formatARS(state.incomePending)}
            </p>
          </div>
        </div>
        <p className="text-muted text-xs mt-2">
          Total esperado: {formatARS(incomeExpected)}
        </p>
      </div>

      {/* GASTOS */}
      <div className="pixel-card">
        <h3 className="pixel-card-title">Gastos</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-muted text-xs mb-1">Pagados ✅</p>
            <p className="text-hp text-base font-semibold">
              {formatARS(state.expenseCompleted)}
            </p>
          </div>
          <div
            style={{
              opacity: 0.85,
              borderLeft: `3px solid ${WARNING_COLOR}`,
              paddingLeft: "8px",
            }}
          >
            <p className="text-muted text-xs mb-1">Pendientes ⏳</p>
            <p
              className="text-base font-semibold"
              style={{ color: WARNING_COLOR }}
            >
              {formatARS(state.expensePending)}
            </p>
          </div>
        </div>
        <p className="text-muted text-xs mt-2">
          Total esperado: {formatARS(expenseExpected)}
        </p>
      </div>

      {/* BALANCE */}
      <div className="pixel-card">
        <h3 className="pixel-card-title">Balance</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-muted text-xs mb-1">Real (cobrado - pagado)</p>
            <p
              className={`text-base font-semibold ${
                balanceReal >= 0 ? "text-xp" : "text-hp"
              }`}
            >
              {formatARS(balanceReal)}
            </p>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">Proyectado (todo)</p>
            <p
              className={`text-base font-semibold ${
                balanceProjected >= 0 ? "text-mana" : "text-hp"
              }`}
            >
              {formatARS(balanceProjected)}
            </p>
          </div>
        </div>
      </div>

      {/* PRESUPUESTO */}
      {state.budget !== null && state.budget > 0 && (
        <div className="pixel-card">
          <h3 className="pixel-card-title">Presupuesto</h3>
          <BudgetBar
            spent={state.expenseCompleted}
            budget={state.budget}
          />
        </div>
      )}
    </div>
  );
}

function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  const usage =
    budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  return (
    <>
      <p className="text-muted text-xs mb-2">
        Presupuesto: {formatARS(budget)} — Usado: {usage}%
      </p>
      <div className="pixel-progress">
        <div
          className={`pixel-progress-fill ${usage >= 100 ? "is-hp" : "is-xp"}`}
          style={{ width: `${usage}%` }}
        />
      </div>
    </>
  );
}