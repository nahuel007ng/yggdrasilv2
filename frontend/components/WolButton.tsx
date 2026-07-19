"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

type WolStatus = "idle" | "sending" | "sent" | "error";

export default function WolButton() {
  const { session } = useAuth();
  const [status, setStatus] = useState<WolStatus>("idle");

  async function handleWake() {
    if (!session) return;
    setStatus("sending");
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const res = await fetch(`${backendUrl}/api/wol/wake`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const label: Record<WolStatus, string> = {
    idle: "Encender PC",
    sending: "Enviando...",
    sent: "Enviado ✓",
    error: "Error, reintentar",
  };

  return (
    <div className="pixel-card">
      <h3 className="pixel-card-title">Wake On LAN</h3>
      <div className="flex flex-col gap-2 py-1">
        <p className="text-muted text-xs">
          Encendé tu PC de forma remota (misma red que el celular).
        </p>
        <button
          type="button"
          className="pixel-btn self-start"
          onClick={handleWake}
          disabled={status === "sending"}
        >
          {label[status]}
        </button>
      </div>
    </div>
  );
}
