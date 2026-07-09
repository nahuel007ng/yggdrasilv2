"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatARS } from "./MonthlySummary";

export interface TransactionListProps {
  month: number;
  year: number;
}

interface CategoryJoin {
  name: string;
  icon: string | null;
}

interface TransactionRow {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  date: string;
  categories: CategoryJoin[] | null;
}

interface ListState {
  transactions: TransactionRow[];
  error: string | null;
  loadedKey: string;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function formatDateDDMM(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

export default function TransactionList({ month, year }: TransactionListProps) {
  const currentKey = `${year}-${month}`;
  const [state, setState] = useState<ListState>({
    transactions: [],
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

    supabase
      .from("transactions")
      .select(
        "id, amount, type, description, date, categories(name, icon)"
      )
      .gte("date", startOfMonth)
      .lte("date", endOfMonth)
      .order("date", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ transactions: [], error: error.message, loadedKey: key });
        } else {
          setState({
            transactions: (data ?? []) as unknown as TransactionRow[],
            error: null,
            loadedKey: key,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentKey, month, year, startOfMonth, endOfMonth]);

  const isLoading = state.loadedKey !== currentKey;

  return (
    <div className="pixel-card h-full">
      <h3 className="pixel-card-title">Transacciones recientes</h3>
      <div className="py-2">
        {state.error && <p className="text-hp">Error: {state.error}</p>}
        {!state.error && isLoading && (
          <p className="text-muted">Cargando...</p>
        )}
        {!state.error && !isLoading && state.transactions.length === 0 && (
          <p className="text-muted">Sin transacciones este mes</p>
        )}
        {!state.error && !isLoading && state.transactions.length > 0 && (
          <div className="overflow-x-auto">
            <table
              className="w-full text-sm"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr className="border-b border-[--color-border]">
                  <th className="py-2 pr-3 text-left text-muted text-xs font-normal">
                    Fecha
                  </th>
                  <th className="py-2 pr-3 text-left text-muted text-xs font-normal">
                    Categoria
                  </th>
                  <th className="py-2 pr-3 text-left text-muted text-xs font-normal">
                    Descripcion
                  </th>
                  <th className="py-2 pr-3 text-right text-muted text-xs font-normal">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody>
                {state.transactions.map((t) => {
                  const cat = Array.isArray(t.categories)
                    ? t.categories[0]
                    : null;
                  const icon = cat?.icon || "💸";
                  const isIncome = t.type === "income";
                  const sign = isIncome ? "+" : "-";
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-[--color-bg-surface-hover]"
                    >
                      <td className="py-2 pr-3">{formatDateDDMM(t.date)}</td>
                      <td className="py-2 pr-3">
                        {icon} {cat?.name ?? "Sin categoria"}
                      </td>
                      <td className="py-2 pr-3 break-words max-w-[200px]">
                        {t.description || "—"}
                      </td>
                      <td
                        className={`py-2 pr-3 text-right font-semibold ${
                          isIncome ? "text-xp" : "text-hp"
                        }`}
                      >
                        {sign}
                        {formatARS(Number(t.amount))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
