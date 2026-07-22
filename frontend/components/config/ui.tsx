"use client";

import { useState } from "react";

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="pixel-border-error p-3 mb-3">
      <p className="text-hp text-sm">{message}</p>
    </div>
  );
}

// Borrado en dos pasos inline (evita window.confirm, que no es confiable en WebView).
export function DeleteButton({
  onConfirm,
  disabled,
}: {
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  if (confirming) {
    return (
      <span className="flex gap-2">
        <button
          type="button"
          className="pixel-btn"
          disabled={disabled}
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
        >
          Confirmar
        </button>
        <button
          type="button"
          className="pixel-btn"
          onClick={() => setConfirming(false)}
        >
          Cancelar
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      className="pixel-btn"
      disabled={disabled}
      onClick={() => setConfirming(true)}
    >
      Borrar
    </button>
  );
}

export function ColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <span className="flex items-center gap-2">
      <input
        className="pixel-input"
        style={{ width: "110px" }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#8a93c2"
        aria-label="Color (hex)"
      />
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          flexShrink: 0,
          background: value || "transparent",
          boxShadow: "0 0 0 1px var(--color-border)",
        }}
      />
    </span>
  );
}
