"use client";

type Props = {
  value: number | null | undefined;
  onChange?: (v: number) => void;
  readOnly?: boolean;
  size?: number;
};

// Estrellas con medias (0, 0.5, ..., 5). El relleno se logra clippeando el
// ancho de una estrella dorada sobre una vacía → 4.5 se ve como media estrella.
// Click en la mitad izquierda = .5, mitad derecha = entero. Re-clic exacto = limpia a 0.
export default function StarRating({ value, onChange, readOnly, size = 22 }: Props) {
  const v = value ?? 0;
  const editable = !readOnly && typeof onChange === "function";

  const set = (n: number) => {
    if (!editable || !onChange) return;
    onChange(v === n ? 0 : n);
  };

  return (
    <span
      className="inline-flex"
      style={{ lineHeight: 1 }}
      role={editable ? "slider" : "img"}
      aria-label={`Calificación: ${v} de 5`}
      aria-valuenow={editable ? v : undefined}
      aria-valuemin={editable ? 0 : undefined}
      aria-valuemax={editable ? 5 : undefined}
    >
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, v - i)); // 0 | 0.5 | 1
        return (
          <span
            key={i}
            style={{
              position: "relative",
              width: size,
              height: size,
              display: "inline-block",
            }}
          >
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                color: "var(--color-border-light)",
                fontSize: size,
                lineHeight: `${size}px`,
              }}
            >
              ★
            </span>
            <span
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                width: `${fill * 100}%`,
                overflow: "hidden",
                color: "var(--color-gold)",
                fontSize: size,
                lineHeight: `${size}px`,
              }}
            >
              ★
            </span>
            {editable && (
              <>
                <button
                  type="button"
                  aria-label={`${i + 0.5} estrellas`}
                  onClick={() => set(i + 0.5)}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "50%",
                    height: "100%",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
                <button
                  type="button"
                  aria-label={`${i + 1} estrellas`}
                  onClick={() => set(i + 1)}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 0,
                    width: "50%",
                    height: "100%",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                />
              </>
            )}
          </span>
        );
      })}
    </span>
  );
}
