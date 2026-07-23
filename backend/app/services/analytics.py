import logging
from collections import defaultdict
from datetime import date, timedelta

from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ParsedPayload

logger = logging.getLogger(__name__)


async def avg_expense(date_from: date | None, date_to: date | None) -> dict:
    """Promedio de gasto: total, promedio diario/mensual, breakdown por categoría."""
    supabase = get_supabase()
    user_id = get_user_id()

    if date_from is None:
        date_from = date.today() - timedelta(days=90)
    if date_to is None:
        date_to = date.today()
    date_from_str = date_from.isoformat()
    date_to_str = date_to.isoformat()

    result = (
        supabase.table("transactions")
        .select("amount, category_id")
        .gte("date", date_from_str)
        .lte("date", date_to_str)
        .eq("user_id", user_id)
        .eq("type", "expense")
        .execute()
    )

    if not result.data:
        return {"total": 0, "days": 0, "daily_avg": 0, "monthly_avg": 0, "by_category": {}}

    total = sum(abs(row["amount"]) for row in result.data if row.get("amount"))

    # Mapear category_id → nombre (primer letra mayúscula o dejarlo)
    cat_map: dict[str, str] = {}
    categories_result = (
        supabase.table("categories").select("id, name").eq("type", "expense").execute()
    )
    for cat in categories_result.data:
        cat_map[cat["id"]] = cat["name"]

    by_category: dict[str, float] = defaultdict(float)
    for row in result.data:
        cat_id = row.get("category_id")
        cat_name = cat_map.get(cat_id, "Otros") if cat_id else "Otros"
        by_category[cat_name] += abs(row["amount"])

    days = (date_to - date_from).days + 1
    if days < 1:
        days = 1
    months = max(days / 30.0, 0.1)
    return {
        "total": round(total, 2),
        "days": days,
        "daily_avg": round(total / days, 2),
        "monthly_avg": round(total / months, 2),
        "by_category": {k: round(v, 2) for k, v in by_category.items()},
    }


async def expense_by_category(category: str | None, date_from: date | None, date_to: date | None) -> dict:
    """Total de gastos en una categoría específica en el rango."""
    supabase = get_supabase()
    user_id = get_user_id()

    if date_from is None:
        date_from = date.today().replace(day=1)
    if date_to is None:
        date_to = date.today()
    date_from_str = date_from.isoformat()
    date_to_str = date_to.isoformat()

    query = (
        supabase.table("transactions")
        .select("amount, category_id")
        .gte("date", date_from_str)
        .lte("date", date_to_str)
        .eq("user_id", user_id)
        .eq("type", "expense")
    )
    result = query.execute()

    if not result.data:
        return {"category": category or "todas", "total": 0, "count": 0, "date_from": date_from_str, "date_to": date_to_str}

    # Resolver nombres de categorías
    cat_map: dict[str, str] = {}
    from_categories = supabase.table("categories").select("id, name").eq("type", "expense").execute()
    for cat in from_categories.data:
        cat_map[cat["id"]] = cat["name"].lower()

    cand = (category or "").strip().lower()
    total = 0.0
    count = 0
    for row in result.data:
        cat_id = row.get("category_id")
        cat_name = cat_map.get(cat_id, "").lower() if cat_id else ""
        if not cand or cand in cat_name:
            total += abs(row["amount"])
            count += 1

    return {"category": category or "todas", "total": round(total, 2), "count": count, "date_from": date_from_str, "date_to": date_to_str}


async def savings_projection(target_amount: float | None) -> dict:
    """Proyección de ahorro: total actual, promedio mensual, meses para llegar a target."""
    supabase = get_supabase()
    user_id = get_user_id()

    result = (
        supabase.table("savings_transactions")
        .select("amount, type, created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=False)
        .execute()
    )

    if not result.data:
        return {"actual_savings": 0, "monthly_avg": 0, "insufficient_data": True}

    # Calcular ahorro actual (neto)
    actual = 0.0
    monthly_totals: dict[str, float] = defaultdict(float)
    for row in result.data:
        amt = row.get("amount", 0)
        t = row.get("type", "deposit")
        net = amt if t == "deposit" else -amt
        actual += net
        # Agrupar por mes
        created = row.get("created_at", "")
        if created:
            month_key = created[:7]  # YYYY-MM
            monthly_totals[month_key] += net

    actual = round(actual, 2)

    # Promedio mensual
    months_count = len(monthly_totals)
    monthly_avg = actual / months_count if months_count > 0 else 0
    monthly_avg = round(monthly_avg, 2)

    projection: dict = {
        "actual_savings": actual,
        "monthly_avg": monthly_avg,
        "months_of_data": months_count,
    }

    if target_amount and target_amount > 0:
        if actual >= target_amount:
            projection["already_at_target"] = True
            projection["months_to_target"] = 0
        elif monthly_avg <= 0:
            projection["months_to_target"] = None
            projection["insufficient_data"] = True
        else:
            remaining = target_amount - actual
            projection["months_to_target"] = round(remaining / monthly_avg, 1)
            projection["needed_per_month_6m"] = round(remaining / 6, 2)
            projection["needed_per_month_12m"] = round(remaining / 12, 2)
            projection["needed_per_month_24m"] = round(remaining / 24, 2)

    return projection


async def reading_stats() -> dict:
    """Estadísticas de lectura: libros terminados, minutos totales y recientes."""
    supabase = get_supabase()
    user_id = get_user_id()

    books_result = (
        supabase.table("books")
        .select("title, category, author")
        .eq("user_id", user_id)
        .eq("status", "leido")
        .execute()
    )

    sessions_result = (
        supabase.table("reading_sessions")
        .select("duration_minutes, date")
        .eq("user_id", user_id)
        .execute()
    )

    books = books_result.data or []
    sessions = sessions_result.data or []

    total_minutes = sum(s.get("duration_minutes") or 0 for s in sessions)

    # Últimos 30 días
    cutoff = (date.today() - timedelta(days=30)).isoformat()
    recent_minutes = sum(
        s.get("duration_minutes") or 0
        for s in sessions
        if s.get("date", "") >= cutoff
    )

    return {
        "books_finished": len(books),
        "books": [{"title": b.get("title"), "category": b.get("category"), "author": b.get("author")} for b in books],
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 1),
        "recent_minutes_30d": recent_minutes,
        "recent_hours_30d": round(recent_minutes / 60, 1),
    }


async def study_stats(date_from: date | None, date_to: date | None) -> dict:
    """Estadísticas de estudio: minutos por materia, total, promedio semanal."""
    supabase = get_supabase()
    user_id = get_user_id()

    if date_from is None:
        date_from = date.today() - timedelta(days=30)
    if date_to is None:
        date_to = date.today()
    date_from_str = date_from.isoformat()
    date_to_str = date_to.isoformat()

    result = (
        supabase.table("study_sessions")
        .select("duration_minutes, subject_id, start_time")
        .gte("start_time", date_from_str)
        .lte("start_time", f"{date_to_str}T23:59:59")
        .eq("user_id", user_id)
        .execute()
    )

    if not result.data:
        return {"total_minutes": 0, "by_subject": {}, "weekly_avg_hours": 0, "date_from": date_from_str, "date_to": date_to_str}

    # Mapear subject_id → nombre
    subject_map: dict[str, str] = {}
    subjects_result = supabase.table("subjects").select("id, name").execute()
    for subj in subjects_result.data:
        subject_map[subj["id"]] = subj["name"]

    by_subject: dict[str, float] = defaultdict(float)
    total = 0
    for row in result.data:
        dur = row.get("duration_minutes") or 0
        subj_id = row.get("subject_id")
        subj_name = subject_map.get(subj_id, "Desconocida") if subj_id else "Desconocida"
        by_subject[subj_name] += dur
        total += dur

    days = (date_to - date_from).days + 1
    weeks = max(days / 7.0, 0.1)

    return {
        "total_minutes": total,
        "total_hours": round(total / 60, 1),
        "by_subject": {k: round(v, 2) for k, v in by_subject.items()},
        "weekly_avg_hours": round(total / 60 / weeks, 1),
        "weekly_avg_minutes": round(total / weeks, 1),
        "date_from": date_from_str,
        "date_to": date_to_str,
    }


async def get_metric(payload: ParsedPayload) -> dict:
    """Rutea la métrica pedida a su función."""
    metric = payload.metric or ""
    if metric == "avg_expense":
        data = await avg_expense(payload.date_from, payload.date_to)
    elif metric == "expense_by_category":
        data = await expense_by_category(payload.category, payload.date_from, payload.date_to)
    elif metric == "savings_projection":
        data = await savings_projection(payload.target_amount)
    elif metric == "reading_stats":
        data = await reading_stats()
    elif metric == "study_stats":
        data = await study_stats(payload.date_from, payload.date_to)
    else:
        return {"success": False, "error": f"Gran Maestro, métrica desconocida: '{metric}'"}
    return {"success": True, "metric": metric, "data": data}
