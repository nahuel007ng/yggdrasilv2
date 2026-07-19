"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { formatARS } from "./MonthlySummary";
import { CHART_COLORS, PALETTE } from "../lib/palette";

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
      .eq("status", "completed")
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
          const cat = Array.isArray(r.categories)
            ? r.categories[0]
            : (r.categories as unknown as CategoryJoin | null);
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
                CHART_COLORS[byCategory.size % CHART_COLORS.length],
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

  const chartData: ChartDatum[] = (() => {
    const sorted = [...state.data].sort((a, b) => b.value - a.value);
    if (sorted.length <= 8) return sorted;
    const top = sorted.slice(0, 8);
    const rest = sorted.slice(8);
    const othersValue = rest.reduce((s, d) => s + d.value, 0);
    return [...top, { name: "Otros", value: othersValue, color: CHART_COLORS[CHART_COLORS.length - 1] }];
  })();

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
          <ResponsiveContainer
            width="100%"
            height={chartData.length < 4 ? 200 : 300}
          >
            <BarChart layout="vertical" data={chartData} margin={{ left: 80 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />
              <XAxis
                type="number"
                tick={{
                  fill: "var(--color-text-muted)",
                  fontSize: 11,
                }}
                tickFormatter={(v) => formatARS(Number(v))}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{
                  fill: "var(--color-text-muted)",
                  fontSize: 11,
                }}
                width={80}
              />
              <Tooltip
                formatter={(value) => formatARS(Number(value))}
                contentStyle={{
                  backgroundColor: PALETTE.bgSurface,
                  border: `1px solid ${PALETTE.border}`,
                  color: PALETTE.text,
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
