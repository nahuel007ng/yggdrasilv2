"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import AvatarHero from "@/components/AvatarHero";
import PixelIcon from "@/components/PixelIcon";
import DailyQuests from "@/components/DailyQuests";
import { getRankName } from "@/lib/spriteMap";
import { TITLES_BY_CODE } from "@/lib/achievements";

interface UserProfile {
  display_name: string | null;
  avatar_level: number;
  total_xp: number;
  current_level: number;
  streak_shields: number;
  active_title: string | null;
}

function xpForLevel(n: number): number {
  return Math.floor((10 * n * (n + 1)) / 2);
}

interface TxRow {
  amount: number;
  type: "income" | "expense";
  status: "pending" | "completed";
}

interface HabitRow {
  id: string;
  name: string;
  icon: string | null;
}

interface HabitRecordRow {
  habit_id: string;
  completed: boolean;
}

interface TaskRow {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
}

interface UpcomingTxRow {
  id: string;
  amount: number;
  type: "income" | "expense";
  description: string | null;
  expected_date: string | null;
  date: string;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<TxRow[] | null>(null);
  const [habits, setHabits] = useState<HabitRow[] | null>(null);
  const [habitRecords, setHabitRecords] = useState<HabitRecordRow[] | null>(
    null
  );
  const [tasks, setTasks] = useState<TaskRow[] | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingTxRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(() => {
    const now = new Date();
    const monthStart = ymdLocal(startOfMonth(now));
    const monthEnd = ymdLocal(endOfMonth(now));
    const todayStr = ymdLocal(now);
    const horizon = new Date(now);
    horizon.setDate(horizon.getDate() + 7);
    const horizonStr = ymdLocal(horizon);

    Promise.all([
      supabase
        .from("user_profile")
        .select(
          "display_name, avatar_level, total_xp, current_level, streak_shields, active_title"
        )
        .maybeSingle(),
      supabase
        .from("transactions")
        .select("amount, type, status")
        .gte("date", monthStart)
        .lte("date", monthEnd),
      supabase
        .from("habits")
        .select("id, name, icon")
        .eq("is_archived", false)
        .order("created_at", { ascending: true }),
      supabase
        .from("habit_records")
        .select("habit_id, completed")
        .eq("date", todayStr),
      supabase
        .from("tasks")
        .select("id, title, status, due_date")
        .eq("is_deleted", false)
        .in("status", ["todo", "doing"])
        .order("created_at", { ascending: false }),
      supabase
        .from("transactions")
        .select("id, amount, type, description, expected_date, date")
        .eq("status", "pending")
        .gte("expected_date", todayStr)
        .lte("expected_date", horizonStr)
        .order("expected_date", { ascending: true }),
    ]).then(
      ([
        profileRes,
        txRes,
        habitsRes,
        recordsRes,
        tasksRes,
        upcomingRes,
      ]) => {
        if (profileRes.error) setError(profileRes.error.message);
        else if (profileRes.data) setProfile(profileRes.data as UserProfile);
        else
          setProfile({
            display_name: null,
            avatar_level: 1,
            total_xp: 0,
            current_level: 1,
            streak_shields: 0,
            active_title: null,
          });

        if (txRes.error) setError(txRes.error.message);
        else setTransactions((txRes.data ?? []) as TxRow[]);

        if (habitsRes.error) setError(habitsRes.error.message);
        else setHabits((habitsRes.data ?? []) as HabitRow[]);

        if (recordsRes.error) setError(recordsRes.error.message);
        else setHabitRecords((recordsRes.data ?? []) as HabitRecordRow[]);

        if (tasksRes.error) setError(tasksRes.error.message);
        else setTasks((tasksRes.data ?? []) as TaskRow[]);

        if (upcomingRes.error) setError(upcomingRes.error.message);
        else setUpcoming((upcomingRes.data ?? []) as UpcomingTxRow[]);
      }
    );
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Refetch when user returns to the tab (e.g., after using the bot)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchAll();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [fetchAll]);

  if (error) {
    return (
      <div className="pixel-card">
        <h3 className="pixel-card-title">Dashboard</h3>
        <div className="pixel-border-error p-4">
          <p className="text-hp">Error: {error}</p>
        </div>
      </div>
    );
  }

  // ---- Derived data ----
  const incomeCompleted =
    transactions
      ?.filter((t) => t.type === "income" && t.status === "completed")
      .reduce((s, t) => s + t.amount, 0) ?? 0;
  const incomePending =
    transactions
      ?.filter((t) => t.type === "income" && t.status === "pending")
      .reduce((s, t) => s + t.amount, 0) ?? 0;
  const expenseCompleted =
    transactions
      ?.filter((t) => t.type === "expense" && t.status === "completed")
      .reduce((s, t) => s + t.amount, 0) ?? 0;
  const available = incomeCompleted - expenseCompleted;

  const completedHabitIds = new Set(
    (habitRecords ?? [])
      .filter((r) => r.completed)
      .map((r) => r.habit_id)
  );
  const habitsCompleted = (habits ?? []).filter((h) =>
    completedHabitIds.has(h.id)
  ).length;
  const habitsTotal = habits?.length ?? 0;

  const todayStr = ymdLocal(new Date());
  const todaysTasks =
    tasks?.filter(
      (t) => !t.due_date || t.due_date.slice(0, 10) === todayStr
    ) ?? [];

  const fmMoney = (n: number) =>
    "$" + n.toLocaleString("es-AR", { maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-1 md:grid-cols-[40%_1fr] gap-4">
      {/* Columna izquierda (40%): Avatar hero + misiones + XP */}
      <div className="flex flex-col gap-4">
        {profile && <HeroCard profile={profile} />}
        <DailyQuests />
      </div>

      {/* Columna derecha (60%): Finanzas + Hábitos + Tareas */}
      <div className="flex flex-col gap-4">
        <MoneyCard
          available={available}
          incomeCompleted={incomeCompleted}
          incomePending={incomePending}
          expenseCompleted={expenseCompleted}
          loading={transactions === null}
          fmMoney={fmMoney}
        />
        <HabitsCard
          completed={habitsCompleted}
          total={habitsTotal}
          habits={habits ?? []}
          completedIds={completedHabitIds}
          loading={habits === null || habitRecords === null}
        />
        <TasksCard
          tasks={todaysTasks}
          loading={tasks === null}
        />
        <UpcomingCard
          upcoming={upcoming ?? []}
          loading={upcoming === null}
          fmMoney={fmMoney}
        />
      </div>
    </div>
  );
}

// ============================================================
// HeroCard — Avatar hero (video + recuadro) + nivel + XP bar
// ============================================================

function HeroCard({ profile }: { profile: UserProfile }) {
  const xpForCurrent = xpForLevel(profile.current_level);
  const xpForNext = xpForLevel(profile.current_level + 1);
  const xpSpan = Math.max(xpForNext - xpForCurrent, 1);
  const xpInLevel = Math.max(profile.total_xp - xpForCurrent, 0);
  const progress = Math.min(Math.max((xpInLevel / xpSpan) * 100, 0), 100);
  const titleDef = profile.active_title ? TITLES_BY_CODE[profile.active_title] : null;

  return (
    <div className="flex flex-col gap-2">
      <AvatarHero
        avatarLevel={profile.avatar_level || 1}
        showRankName={false}
        activeTitle={profile.active_title || null}
      />
      <div className="pixel-card">
        <div className="flex flex-col items-center gap-1 mb-2 text-center">
          <span
            className="text-[--color-text] break-words"
            style={{ fontSize: "14px" }}
          >
            {profile.display_name || "Aventurero"} — {getRankName(profile.avatar_level || 1)}
          </span>
          {titleDef && (
            <span className={`text-pixel text-xs title-${titleDef.rarity}`}>
              « {titleDef.name} »
            </span>
          )}
          <span className="text-pixel text-mana text-sm">
            Nivel {profile.current_level}
          </span>
          {profile.streak_shields > 0 && (
            <span className="text-xp text-xs flex items-center gap-1"><PixelIcon name="shield" size={14} /> x{profile.streak_shields}</span>
          )}
        </div>
        <div className="pixel-progress">
          <div
            className="pixel-progress-fill is-xp"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2">
          <p className="text-muted text-xs">
            {xpInLevel.toLocaleString()} / {xpSpan.toLocaleString()} XP
          </p>
          <Link
            href="/perfil"
            className="text-mana text-xs hover:text-[--color-mana-light] transition-colors"
          >
            Ver perfil completo →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MoneyCard
// ============================================================

function MoneyCard({
  available,
  incomeCompleted,
  incomePending,
  expenseCompleted,
  loading,
  fmMoney,
}: {
  available: number;
  incomeCompleted: number;
  incomePending: number;
  expenseCompleted: number;
  loading: boolean;
  fmMoney: (n: number) => string;
}) {
  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title flex items-center gap-2"><PixelIcon name="nav-finanzas" size={16} /> Disponible</h3>
      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-gold text-pixel text-sm">{fmMoney(available)}</p>
          <p className="text-muted text-xs">
            Cobrado: <span className="text-xp">{fmMoney(incomeCompleted)}</span>
          </p>
          <p className="text-muted text-xs">
            Por cobrar:{" "}
            <span className="text-[--color-coral-light]">
              {fmMoney(incomePending)}
            </span>
          </p>
          <p className="text-muted text-xs">
            Gastado: <span className="text-hp">{fmMoney(expenseCompleted)}</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HabitsCard — solo lectura
// ============================================================

function HabitsCard({
  completed,
  total,
  habits,
  completedIds,
  loading,
}: {
  completed: number;
  total: number;
  habits: HabitRow[];
  completedIds: Set<string>;
  loading: boolean;
}) {
  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title flex items-center gap-2"><PixelIcon name="nav-habitos" size={16} /> Hábitos hoy</h3>
      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : total === 0 ? (
        <p className="text-muted">No hay hábitos activos</p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-mana text-sm mb-1">
            {completed}/{total} completados
          </p>
          <ul className="flex flex-col gap-1">
            {habits.slice(0, 5).map((h) => (
              <li
                key={h.id}
                className="text-xs flex items-center gap-2"
              >
                <span>{h.icon || "·"}</span>
                <span
                  className={
                    completedIds.has(h.id) ? "text-xp" : "text-muted"
                  }
                >
                  {h.name}
                </span>
                <span className="ml-auto">
                  {completedIds.has(h.id) ? <PixelIcon name="status-complete" size={14} /> : <PixelIcon name="status-pending" size={14} />}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// TasksCard
// ============================================================

function TasksCard({
  tasks,
  loading,
}: {
  tasks: TaskRow[];
  loading: boolean;
}) {
  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title flex items-center gap-2"><PixelIcon name="nav-tareas" size={16} /> Tareas hoy</h3>
      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : tasks.length === 0 ? (
        <p className="text-muted flex items-center gap-1">Sin tareas pendientes para hoy <PixelIcon name="celebration" size={16} /></p>
      ) : (
        <div className="flex flex-col gap-1">
          <p className="text-mana text-sm mb-1">
            {tasks.length} pendiente{tasks.length === 1 ? "" : "s"}
          </p>
          <ul className="flex flex-col gap-1">
            {tasks.slice(0, 4).map((t) => (
              <li key={t.id} className="text-xs text-[--color-text]">
                · {t.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// UpcomingCard — transacciones pendientes próximos 7 días
// ============================================================

function UpcomingCard({
  upcoming,
  loading,
  fmMoney,
}: {
  upcoming: UpcomingTxRow[];
  loading: boolean;
  fmMoney: (n: number) => string;
}) {
  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Próximos pagos/cobros</h3>
      {loading ? (
        <p className="text-muted">Cargando...</p>
      ) : upcoming.length === 0 ? (
        <p className="text-muted">Sin pagos/cobros próximos</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {upcoming.slice(0, 5).map((t) => {
            const refDate = t.expected_date || t.date;
            const days = daysUntil(refDate);
            const isIncome = t.type === "income";
            return (
              <li
                key={t.id}
                className="text-xs flex items-center gap-2"
              >
                <span>{isIncome ? "⬆️" : "⬇️"}</span>
                <span className="text-[--color-text] flex-1 truncate">
                  {t.description || (isIncome ? "Cobro" : "Pago")}
                </span>
                <span
                  className={
                    isIncome ? "text-xp" : "text-hp"
                  }
                >
                  {fmMoney(t.amount)}
                </span>
                <span className="text-muted">
                  {days === 0
                    ? "hoy"
                    : days === 1
                      ? "mañana"
                      : `en ${days} días`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}