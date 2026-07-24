import { supabase } from "@/lib/supabase";

// Helper fetch → API /api/config/* del backend (mismo patrón Bearer que ChatWidget).
export async function configApi<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000").replace(/\/$/, "");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return (res.status === 204 ? null : res.json()) as Promise<T>;
}

export type ConfigCategory = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  type: string;
  is_default: boolean;
};

export type ConfigHabit = {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  icon: string | null;
  color: string | null;
  xp_override: number | null;
};

export type XpConfigRow = {
  action_type: string;
  xp_per_unit: number;
  unit_size: number | string | null;
  unit_label: string | null;
  cap_units: number | null;
};

export type ConfigTag = {
  id: string;
  name: string;
  color: string | null;
};
