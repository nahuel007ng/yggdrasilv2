"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { formatARS } from "./MonthlySummary";

const RPG_COLORS = [
  "#e8845a",  // coral
  "#4a9e8e",  // teal
  "#f7d51d",  // gold
  "#92cc41",  // xp green
  "#e76e55",  // hp red
  "#6bbfae",  // teal light
  "#fd9978",  // coral light
  "#9b59b6",  // purple
  "#209cee",  // blue
  "#95a5a6",  // gray
];

export interface ExpenseChartProps {
  month: number;
  year: number;
}

interface CategoryJoin {
  name: string;
  color: string | null;
  icon: string | null;
}

interface TransactionRow {
  amount: number;
  category_id: string;
  categories: CategoryJoin[] | null;
}

interface ChartDatum {
  name: string;
  value: number;
  color: string;
}

interface ChartState {
  data: ChartDatum[];
  error: string | null;
  loadedKey: string;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export default function ExpenseChart({ month, year }: ExpenseChartProps) {
  const currentKey = `${year}-${month}`;
  const [state, setState] = useState<ChartState>({
    data: [],
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
      .select("amount, category_id, categories(name, color, icon)")
      .eq("type", "expense")
      .gte("date", startOfMonth)
      .lte("date", endOfMonth)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState({ data: [], error: error.message, loadedKey: key });
          return;
        }
        const rows = (data ?? []) as unknown as TransactionRow[];
        const byCategory = new Map<string, ChartDatum>();
        rows.forEach((r) => {
          const catId = r.category_id ?? "unknown";
          const cat = Array.isArray(r.categories) ? r.categories[0] : null;
          const name = cat?.name ?? "Sin categoria";
          const existing = byCategory.get(catId);
          if (existing) {
            existing.value += Number(r.amount);
          } else {
            byCategory.set(catId, {
              name,
              value: Number(r.amount),
              color:
                cat?.color ??
                RPG_COLORS[byCategory.size % RPG_COLORS.length],
            });
          }
        });
        setState({
          data: Array.from(byCategory.values()),
          error: null,
          loadedKey: key,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [currentKey, month, year, startOfMonth, endOfMonth]);

  const isLoading = state.loadedKey !== currentKey;

  return (
    <div className="pixel-card h-full">
      <h3 className="pixel-card-title">Gastos por categoria</h3>
      <div className="py-2">
        {state.error && <p className="text-hp">Error: {state.error}</p>}
        {!state.error && isLoading && (
          <p className="text-muted">Cargando...</p>
        )}
        {!state.error && !isLoading && state.data.length === 0 && (
          <p className="text-muted">Sin gastos este mes</p>
        )}
        {!state.error && !isLoading && state.data.length > 0 && (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={state.data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry: { name?: string; value?: number }) =>
                  `${entry.name ?? ""}: ${formatARS(Number(entry.value ?? 0))}`
                }
                labelLine={false}
              >
                {state.data.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatARS(Number(value))}
                contentStyle={{
                  backgroundColor: "var(--color-bg-surface)",
                  border: "2px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{
                  color: "var(--color-text-muted)",
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
