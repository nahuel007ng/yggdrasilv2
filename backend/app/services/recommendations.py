"""Recomendaciones generativas sobre los datos del usuario."""
from app.services.analytics import avg_expense, reading_stats
from app.llm.composer import compose_reply


async def get_recommendation(payload) -> dict:
    """payload es ParsedPayload — acceso por ATRIBUTO, nunca .get()."""
    topic = payload.topic or ""
    question = payload.original_question or ""

    if topic == "books":
        data = await reading_stats()
        if not data.get("books_finished"):
            return {
                "success": True,
                "reply": "Todavía no registraste libros terminados, así que no tengo de dónde sacar tus gustos. Contame cuando termines uno ('terminé Hamlet, es un clásico') y te recomiendo el siguiente.",
            }
        reply = await compose_reply(question, "book_recommendation", data)
        return {"success": True, "reply": reply}

    if topic == "finance":
        data = await avg_expense(None, None)  # últimos 90 días
        if not data.get("by_category"):
            return {
                "success": True,
                "reply": "Todavía no hay suficientes gastos registrados para analizar dónde recortar.",
            }
        reply = await compose_reply(question, "finance_advice", data)
        return {"success": True, "reply": reply}

    return {"success": False, "error": f"No sé recomendar sobre '{topic}' todavía. Puedo con libros y finanzas."}
