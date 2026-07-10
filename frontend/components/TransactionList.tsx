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
  type: "income" | "expense";
  status: "pending" | "completed";
  description: string | null;
  date: string;
  expected_date: string | null;
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

const WARNING_COLOR = "#f0ad4e";

export default function TransactionList({
  month,
  year,
}: TransactionListProps) {
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

    const selectCols =
      "id, amount, type, status, description, date, expected_date, categories(name, icon)";

    Promise.all([
      supabase
        .from("transactions")
        .select(selectCols)
        .eq("status", "completed")
        .gte("date", startOfMonth)
        .lte("date", endOfMonth)
        .order("date", { ascending: false }),
      supabase
        .from("transactions")
        .select(selectCols)
        .eq("status", "pending")
        .gte("expected_date", startOfMonth)
        .lte("expected_date", endOfMonth)
        .order("expected_date", { ascending: false }),
    ]).then(([doneRes, pendingRes]) => {
      if (cancelled) return;
      let error: string | null = null;
      if (doneRes.error) error = doneRes.error.message;
      if (pendingRes.error) error = pendingRes.error.message;

      const doneRows = (doneRes.data ?? []) as unknown as TransactionRow[];
      const pendingRows = (pendingRes.data ?? []) as
        unknown as TransactionRow[];
      const merged = [...doneRows, ...pendingRows];

      if (error) {
        setState({ transactions: [], error, loadedKey: key });
      } else {
        setState({ transactions: merged, error: null, loadedKey: key });
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
                  const isPending = t.status === "pending";
                  const sign = isIncome ? "+" : "-";
                  const refDate = isPending
                    ? t.expected_date || t.date
                    : t.date;
                  const rowStyle: React.CSSProperties = isPending
                    ? {
                        opacity: 0.75,
                        borderLeft: `3px solid ${WARNING_COLOR}`,
                        fontStyle: "italic",
                      }
                    : {};
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-[--color-bg-surface-hover]"
                      style={rowStyle}
                    >
                      <td className="py-2 pr-3">
                        <div className="flex flex-col gap-1">
                          <span>{formatDateDDMM(refDate)}</span>
                          {isPending && (
                            <span
                              style={{
                                background: WARNING_COLOR,
                                color: "#000",
                                padding: "1px 6px",
                                fontSize: "9px",
                                fontFamily: "var(--font-pixel)",
                                display: "inline-block",
                                width: "fit-content",
                              }}
                            >
                              ⏳ Pendiente
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        {icon} {cat?.name ?? "Sin categoria"}
                      </td>
                      <td className="py-2 pr-3 break-words max-w-[200px]">
                        <div className="flex flex-col gap-1">
                          <span>{t.description || "—"}</span>
                          {isPending && t.expected_date && (
                            <span
                              className="text-muted text-[10px]"
                              style={{ fontStyle: "normal", opacity: 0.9 }}
                            >
                              Esperado: {formatDateDDMM(t.expected_date)}
                            </span>
                          )}
                        </div>
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