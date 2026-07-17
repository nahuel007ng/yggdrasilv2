import json
import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

COMPOSER_SYSTEM = (
    "Sos Yggdrasil, un asistente personal argentino. Te paso la pregunta del usuario "
    "y los datos reales calculados desde su base de datos. Redactá una respuesta breve (2-5 líneas), "
    "natural, en español argentino (vos), con los números formateados ($1.234, horas legibles). "
    "No inventes datos que no estén en el JSON. Si los datos son insuficientes, decilo honestamente "
    "y sugerí qué registrar. Podés cerrar con UNA observación útil si surge de los datos."
)


def _format_fallback(metric: str, data: dict) -> str:
    """Formateo básico de datos si el LLM falla."""
    import locale
    try:
        locale.setlocale(locale.LC_ALL, "")
    except Exception:
        pass

    parts = []
    if metric == "avg_expense":
        parts.append(f"Promedio de gasto (últimos {data.get('days', '?')} días):")
        parts.append(f"- Total: ${data.get('total', 0):,.0f}")
        parts.append(f"- Diario: ${data.get('daily_avg', 0):,.0f}")
        parts.append(f"- Mensual: ${data.get('monthly_avg', 0):,.0f}")
        parts.append("Por categoría:")
        for cat, amt in data.get("by_category", {}).items():
            parts.append(f"  {cat}: ${amt:,.0f}")
    elif metric == "expense_by_category":
        parts.append(f"Gasto en {data.get('category', '?')} ({data.get('date_from', '?')} a {data.get('date_to', '?')}):")
        parts.append(f"- Total: ${data.get('total', 0):,.0f}")
        parts.append(f"- Transacciones: {data.get('count', 0)}")
    elif metric == "savings_projection":
        parts.append(f"Ahorro actual: ${data.get('actual_savings', 0):,.0f}")
        parts.append(f"Promedio mensual: ${data.get('monthly_avg', 0):,.0f}")
        if data.get("already_at_target"):
            parts.append("Ya alcanzaste la meta.")
        elif "months_to_target" in data and data["months_to_target"] is not None:
            parts.append(f"Meses para llegar: {data['months_to_target']}")
            parts.append(f"Necesitás/mes (6m): ${data.get('needed_per_month_6m', 0):,.0f}")
            parts.append(f"Necesitás/mes (12m): ${data.get('needed_per_month_12m', 0):,.0f}")
            parts.append(f"Necesitás/mes (24m): ${data.get('needed_per_month_24m', 0):,.0f}")
        elif data.get("insufficient_data"):
            parts.append("Todavía no hay datos suficientes para hacer una proyección.")
    elif metric == "reading_stats":
        parts.append(f"Libros terminados: {data.get('books_finished', 0)}")
        parts.append(f"Total de lectura: {data.get('total_hours', 0)} horas")
        parts.append(f"Últimos 30 días: {data.get('recent_hours_30d', 0)} horas")
    elif metric == "study_stats":
        parts.append(f"Estudio ({data.get('date_from', '?')} a {data.get('date_to', '?')}):")
        parts.append(f"- Total: {data.get('total_hours', 0)} horas")
        parts.append(f"- Promedio semanal: {data.get('weekly_avg_hours', 0)} horas")
        for subj, mins in data.get("by_subject", {}).items():
            parts.append(f"  {subj}: {round(mins / 60, 1)}h")
    else:
        parts.append(json.dumps(data, ensure_ascii=False, default=str))

    return "\n".join(parts)


async def compose_reply(question: str, metric: str, data: dict) -> str:
    """Redacta una respuesta natural a partir de datos calculados."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.llm_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.llm_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.llm_model,
                    "messages": [
                        {"role": "system", "content": COMPOSER_SYSTEM},
                        {
                            "role": "user",
                            "content": f"Pregunta: {question}\nMétrica: {metric}\nDatos: {json.dumps(data, ensure_ascii=False, default=str)}",
                        },
                    ],
                    "temperature": 0.7,
                    "max_tokens": 400,
                },
            )
            response.raise_for_status()

        response_data = response.json()
        usage = response_data.get("usage", {})
        logger.info(
            "Composer LLM usage — prompt: %s (cache hit: %s, miss: %s), completion: %s, total: %s",
            usage.get("prompt_tokens"),
            usage.get("prompt_cache_hit_tokens"),
            usage.get("prompt_cache_miss_tokens"),
            usage.get("completion_tokens"),
            usage.get("total_tokens"),
        )

        content = response_data["choices"][0]["message"]["content"]
        return content.strip()

    except Exception:
        logger.exception("Error en composer LLM, usando fallback")
        return _format_fallback(metric, data)
