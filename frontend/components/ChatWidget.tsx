"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  xpGained?: number | null;
  level?: number | null;
}

const CHAT_FAB_CSS = `
.chat-fab {
  color: var(--color-mana-light);
  box-shadow:
    0 calc(-1 * var(--pixel-size)) 0 0 var(--color-border-accent),
    0 var(--pixel-size) 0 0 var(--color-border-accent),
    calc(-1 * var(--pixel-size)) 0 0 0 var(--color-border-accent),
    var(--pixel-size) 0 0 0 var(--color-border-accent),
    var(--glow-mana);
}
.chat-fab.chat-fab:hover {
  background-color: var(--color-bg-surface-hover);
  box-shadow:
    0 calc(-1 * var(--pixel-size)) 0 0 var(--color-border-accent),
    0 var(--pixel-size) 0 0 var(--color-border-accent),
    calc(-1 * var(--pixel-size)) 0 0 0 var(--color-border-accent),
    var(--pixel-size) 0 0 0 var(--color-border-accent),
    var(--glow-mana-soft);
}
`;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setHasSession(!!session);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(!!session);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Prevent body scroll when chat is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen, isMobile]);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: "Error: no estás autenticado. Recargá la página.",
          },
        ]);
        return;
      }

      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      const res = await fetch(`${backendUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              text: "Tu sesión expiró. Recargá la página e iniciá sesión de nuevo.",
            },
          ]);
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const json = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: json.reply,
          xpGained: json.xp_gained,
          level: json.level,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Error al enviar el mensaje. Intentá de nuevo.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!hasSession) return null;

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100dvh",
        zIndex: 70,
      }
    : {
        position: "fixed",
        bottom: "calc(var(--space-5) + 70px)",
        right: "var(--space-5)",
        width: "360px",
        height: "500px",
        zIndex: 70,
      };

  return (
    <>
      <style>{CHAT_FAB_CSS}</style>

      {/* Backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[60] bg-black/35"
        />
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="panel-system flex flex-col" style={panelStyle}>
          {/* Header */}
          <div className="panel-system-title flex items-center justify-between px-3 py-2 flex-shrink-0">
            <span>Yggdrasil Chat</span>
            <button
              type="button"
              className="pixel-btn"
              style={{ padding: "2px 8px", fontSize: "10px" }}
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-[--color-bg-deep]"
            style={{ minHeight: 0 }}
          >
            {messages.length === 0 && !loading && (
              <p className="text-muted text-xs">
                Escribí un mensaje para el asistente...
              </p>
            )}

            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={m.id}
                  className="flex flex-col"
                  style={{ alignItems: isUser ? "flex-end" : "flex-start" }}
                >
                  <div
                    className={`pixel-border text-xs ${
                      isUser
                        ? "bg-[--color-bg-surface-hover] text-[--color-text]"
                        : "bg-[--color-bg] text-[--color-text]"
                    }`}
                    style={{
                      maxWidth: "85%",
                      padding: "var(--space-2) var(--space-3)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.text}
                  </div>
                  {!isUser && m.xpGained ? (
                    <span className="text-[10px] mt-1 text-xp">
                      +{m.xpGained} XP
                      {m.level != null ? ` (nivel ${m.level})` : ""}
                    </span>
                  ) : null}
                </div>
              );
            })}

            {loading && (
              <span className="text-muted text-xs">escribiendo...</span>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="flex gap-2 p-2 border-t-2 border-[--color-border] flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribí un mensaje..."
              disabled={loading}
              className="flex-1 pixel-input text-xs"
            />
            <button
              type="submit"
              className="pixel-btn pixel-btn-primary"
              disabled={loading || !input.trim()}
              aria-label="Enviar mensaje"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Floating button - hidden on mobile when chat is open */}
      {!(isOpen && isMobile) && (
        <div
          style={{
            position: "fixed",
            bottom: "var(--space-5)",
            right: "var(--space-5)",
            zIndex: 70,
          }}
        >
          <button
            type="button"
            className="chat-fab pixel-btn"
            onClick={() => setIsOpen((v) => !v)}
            aria-label={isOpen ? "Cerrar chat" : "Abrir chat"}
            style={{
              width: "56px",
              height: "56px",
              fontSize: "24px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isOpen ? "✕" : "💬"}
          </button>
        </div>
      )}
    </>
  );
}
