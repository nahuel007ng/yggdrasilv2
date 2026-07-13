"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatARS } from "./MonthlySummary";

export interface SavingsCardProps {
  month: number;
  year: number;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

interface SavingsRow {
  amount: number;
  type: "deposit" | "withdrawal";
  date: string;
}

interface SavingsState {
  monthDeposits: number;
  monthWithdrawals: number;
  totalDeposits: number;
  totalWithdrawals: number;
  error: string | null;
  loadedKey: string;
}

export default function SavingsCard({ month, year }: SavingsCardProps) {
  const currentKey = `${year}-${month}`;
  const [state, setState] = useState<SavingsState>({
    monthDeposits: 0,
    monthWithdrawals: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
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
        .from("savings_transactions")
        .select("amount, type, date")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth),
      supabase
        .from("savings_transactions")
        .select("amount, type, date"),
    ]).then(([monthRes, allRes]) => {
      if (cancelled) return;
      const error = monthRes.error?.message ?? allRes.error?.message ?? null;
      if (error) {
        setState({
          monthDeposits: 0,
          monthWithdrawals: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
          error,
          loadedKey: key,
        });
        return;
      }

      const monthRows = (monthRes.data ?? []) as SavingsRow[];
      const allRows = (allRes.data ?? []) as SavingsRow[];

      const sum = (rows: SavingsRow[], type: string) =>
        rows
          .filter((r) => r.type === type)
          .reduce((s, r) => s + Number(r.amount), 0);

      setState({
        monthDeposits: sum(monthRows, "deposit"),
        monthWithdrawals: sum(monthRows, "withdrawal"),
        totalDeposits: sum(allRows, "deposit"),
        totalWithdrawals: sum(allRows, "withdrawal"),
        error: null,
        loadedKey: key,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [currentKey, month, year, startOfMonth, endOfMonth]);

  const isLoading = state.loadedKey !== currentKey;
  const monthNet = state.monthDeposits - state.monthWithdrawals;
  const totalNet = state.totalDeposits - state.totalWithdrawals;

  if (state.error) {
    return (
      <div className="pixel-card pixel-border-error">
        <p className="text-hp">Error: {state.error}</p>
      </div>
    );
  }

  if (isLoading) {
    return <p className="text-muted">Cargando ahorros...</p>;
  }

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Ahorros</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-muted text-xs mb-1">Este mes</p>
          <p
            className={`text-base font-semibold ${
              monthNet >= 0 ? "text-xp" : "text-hp"
            }`}
          >
            {monthNet >= 0 ? "+" : ""}{formatARS(monthNet)}
          </p>
        </div>
        <div>
          <p className="text-muted text-xs mb-1">Total acumulado</p>
          <p
            className={`text-base font-semibold ${
              totalNet >= 0 ? "text-xp" : "text-hp"
            }`}
          >
            {formatARS(totalNet)}
          </p>
        </div>
      </div>
      {(state.monthDeposits > 0 || state.monthWithdrawals > 0) && (
        <p className="text-muted text-xs mt-2">
          Depositado: {formatARS(state.monthDeposits)} | Retirado: {formatARS(state.monthWithdrawals)}
        </p>
      )}
    </div>
  );
}
