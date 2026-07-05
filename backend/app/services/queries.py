from datetime import date

from app.db.supabase import get_supabase
from app.models.schemas import ParsedPayload


async def query_data(payload: ParsedPayload) -> dict:
    """Consulta datos de Supabase y devuelve un resumen formateado."""
    supabase = get_supabase()

    target = (payload.query_target or "").lower()
    date_from = (payload.date_from or payload.date or date.today()).isoformat()
    date_to = (payload.date_to or date.today()).isoformat()

    if target == "expenses":
        return await _query_expenses(supabase, date_from, date_to)
    elif target == "habits":
        return await _query_habits(supabase, date_from, date_to)
    elif target == "tasks":
        return await _query_tasks(supabase)
    elif target == "study":
        return await _query_study(supabase, date_from, date_to)
    elif target == "workouts":
        return await _query_workouts(supabase, date_from, date_to)
    else:
        return {"success": False, "error": f"No se que consultar: '{payload.query_target}'"}


async def _query_expenses(supabase, date_from: str, date_to: str) -> dict:
    """Consulta gastos en un rango de fechas."""
    result = (
        supabase.table("transactions")
        .select("amount, description, date, categories(name)")
        .eq("type", "expense")
        .gte("date", date_from)
        .lte("date", date_to)
        .order("date", desc=True)
        .execute()
    )

    if not result.data:
        return {"success": True, "summary": f"No hay gastos entre {date_from} y {date_to}."}

    total = sum(t["amount"] for t in result.data)
    lines = []
    for t in result.data:
        cat = t.get("categories", {})
        cat_name = cat.get("name", "Sin cat.") if cat else "Sin cat."
        lines.append(f"  - ${t['amount']:,.0f} {t['description'] or ''} ({cat_name}) [{t['date']}]")

    summary = f"Gastos ({date_from} a {date_to}):\n"
    summary += "\n".join(lines[:20])  # max 20 items
    if len(result.data) > 20:
        summary += f"\n  ... y {len(result.data) - 20} mas"
    summary += f"\n\nTotal: ${total:,.0f}"

    return {"success": True, "summary": summary}


async def _query_habits(supabase, date_from: str, date_to: str) -> dict:
    """Consulta habitos completados en un rango de fechas."""
    result = (
        supabase.table("habit_records")
        .select("date, completed, habits(name)")
        .eq("completed", True)
        .gte("date", date_from)
        .lte("date", date_to)
        .order("date", desc=True)
        .execute()
    )

    if not result.data:
        return {"success": True, "summary": f"No hay habitos completados entre {date_from} y {date_to}."}

    lines = []
    for r in result.data:
        habit = r.get("habits", {})
        habit_name = habit.get("name", "?") if habit else "?"
        lines.append(f"  - {habit_name} [{r['date']}]")

    summary = f"Habitos completados ({date_from} a {date_to}):\n"
    summary += "\n".join(lines[:20])
    summary += f"\n\nTotal: {len(result.data)} registros"

    return {"success": True, "summary": summary}


async def _query_tasks(supabase) -> dict:
    """Consulta tareas pendientes (sin filtro de fecha)."""
    result = (
        supabase.table("tasks")
        .select("title, status, due_date, priority")
        .eq("is_deleted", False)
        .in_("status", ["todo", "doing"])
        .order("sort_order")
        .execute()
    )

    if not result.data:
        return {"success": True, "summary": "No hay tareas pendientes."}

    lines = []
    for t in result.data:
        status = "En progreso" if t["status"] == "doing" else "Pendiente"
        due = f" (deadline: {t['due_date']})" if t["due_date"] else ""
        lines.append(f"  - [{status}] {t['title']}{due}")

    summary = f"Tareas pendientes ({len(result.data)}):\n"
    summary += "\n".join(lines)

    return {"success": True, "summary": summary}


async def _query_study(supabase, date_from: str, date_to: str) -> dict:
    """Consulta sesiones de estudio en un rango de fechas."""
    result = (
        supabase.table("study_sessions")
        .select("start_time, duration_minutes, notes, subjects(name)")
        .gte("start_time", f"{date_from}T00:00:00Z")
        .lte("start_time", f"{date_to}T23:59:59Z")
        .order("start_time", desc=True)
        .execute()
    )

    if not result.data:
        return {"success": True, "summary": f"No hay sesiones de estudio entre {date_from} y {date_to}."}

    total_minutes = sum(s.get("duration_minutes") or 0 for s in result.data)
    hours = total_minutes // 60
    mins = total_minutes % 60

    lines = []
    for s in result.data:
        subj = s.get("subjects", {})
        subj_name = subj.get("name", "?") if subj else "?"
        dur = f"{s.get('duration_minutes', 0)} min"
        lines.append(f"  - {subj_name}: {dur}")

    summary = f"Estudio ({date_from} a {date_to}):\n"
    summary += "\n".join(lines[:20])
    summary += f"\n\nTotal: {hours}h {mins}min en {len(result.data)} sesiones"

    return {"success": True, "summary": summary}


async def _query_workouts(supabase, date_from: str, date_to: str) -> dict:
    """Consulta entrenamientos en un rango de fechas."""
    result = (
        supabase.table("workouts")
        .select("date, duration_minutes, notes")
        .gte("date", date_from)
        .lte("date", date_to)
        .order("date", desc=True)
        .execute()
    )

    if not result.data:
        return {"success": True, "summary": f"No hay entrenamientos entre {date_from} y {date_to}."}

    total_minutes = sum(w.get("duration_minutes") or 0 for w in result.data)
    lines = []
    for w in result.data:
        dur = f"{w.get('duration_minutes', '?')} min" if w.get("duration_minutes") else ""
        notes = f" - {w['notes']}" if w.get("notes") else ""
        lines.append(f"  - [{w['date']}] {dur}{notes}")

    summary = f"Entrenamientos ({date_from} a {date_to}):\n"
    summary += "\n".join(lines[:20])
    summary += f"\n\nTotal: {len(result.data)} sesiones, {total_minutes} min"

    return {"success": True, "summary": summary}
