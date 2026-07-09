"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { session, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      router.replace("/dashboard");
    }
  }, [session, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setSubmitting(false);
    } else {
      router.replace("/dashboard");
    }
  };

  if (loading || session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted text-pixel text-sm">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="pixel-card w-full max-w-sm">
        <h1 className="text-center text-gold mb-6" style={{ fontSize: "16px" }}>
          Yggdrasil
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-pixel text-xs text-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[--color-bg] text-[--color-text] px-3 py-2 outline-none pixel-border text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-pixel text-xs text-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[--color-bg] text-[--color-text] px-3 py-2 outline-none pixel-border text-sm"
            />
          </div>

          {error && (
            <div className="pixel-border-error p-3">
              <p className="text-hp text-xs">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="pixel-btn pixel-btn-primary w-full mt-2"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
