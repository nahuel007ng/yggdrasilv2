from datetime import date, datetime, timedelta, timezone

from app.db.supabase import get_supabase

# Timezone Argentina (UTC-3)
AR_TIMEZONE = timezone(timedelta(hours=-3))

# Grace period: el "dia de habitos" empieza a las 4 AM
GRACE_PERIOD_HOUR = 4

# Maximo shields almacenados
MAX_SHIELDS = 3

# Dias para semana perfecta
PERFECT_WEEK_DAYS = 7


def get_habit_date() -> date:
    """Devuelve la fecha logica del habito considerando grace period.

    Si la hora local (Argentina) es antes de las 4 AM, el habito
    cuenta para el dia anterior. Esto evita ansiedad por "llegar tarde".
    """
    now_ar = datetime.now(AR_TIMEZONE)
    if now_ar.hour < GRACE_PERIOD_HOUR:
        return (now_ar - timedelta(days=1)).date()
    return now_ar.date()


async def update_streak(habit_id: str) -> dict:
    """Recalcula la racha de un habito despues de marcar un registro.

    Logica de shields: si hay un gap de exactamente 1 dia y el usuario
    tiene shields, se consume 1 shield y la racha continua. Gaps >1 dia
    reinician la racha sin consumir shields.
    """
    supabase = get_supabase()
    today = get_habit_date()

    # Leer registros completados ordenados por fecha descendente
    records_result = (
        supabase.table("habit_records")
        .select("date")
        .eq("habit_id", habit_id)
        .eq("completed", True)
        .order("date", desc=True)
        .execute()
    )

    # Leer info del habito
    habit_result = (
        supabase.table("habits")
        .select("name, current_streak, longest_streak")
        .eq("id", habit_id)
        .single()
        .execute()
    )

    # Leer shields del perfil
    profile_result = (
        supabase.table("user_profile")
        .select("id, streak_shields")
        .limit(1)
        .single()
        .execute()
    )

    habit_data = habit_result.data
    profile_data = profile_result.data
    shields = profile_data["streak_shields"] or 0

    # Parsear fechas de registros completados a un set para busqueda rapida
    completed_dates: set[date] = set()
    for record in records_result.data:
        completed_dates.add(date.fromisoformat(record["date"]))

    # Calcular racha consecutiva hacia atras desde hoy
    streak = 0
    shield_consumed = False
    current_date = today

    while True:
        if current_date in completed_dates:
            streak += 1
            current_date -= timedelta(days=1)
        elif (
            not shield_consumed
            and shields > 0
            and streak > 0
            and (current_date - timedelta(days=1)) in completed_dates
        ):
            # Gap de exactamente 1 dia: consumir shield
            shield_consumed = True
            shields -= 1
            streak += 1  # el dia del gap cuenta como cubierto
            current_date -= timedelta(days=1)
            # Continuar contando desde el dia anterior al gap
        else:
            break

    # Actualizar habit
    new_longest = max(habit_data["longest_streak"] or 0, streak)
    supabase.table("habits").update({
        "current_streak": streak,
        "longest_streak": new_longest,
    }).eq("id", habit_id).execute()

    # Si consumio shield, actualizar user_profile
    if shield_consumed:
        supabase.table("user_profile").update({
            "streak_shields": shields,
        }).eq("id", profile_data["id"]).execute()

    return {
        "habit_name": habit_data["name"],
        "current_streak": streak,
        "longest_streak": new_longest,
        "shield_consumed": shield_consumed,
        "shields_remaining": shields,
    }


async def check_perfect_week() -> dict:
    """Verifica si el usuario completo una semana perfecta y otorga shield.

    Una semana perfecta es 7 dias consecutivos con TODOS los habitos activos
    (no archivados, creados hace >=7 dias) completados cada dia.
    """
    supabase = get_supabase()
    today = get_habit_date()

    # Early return: si ya tiene max shields, no calcular
    profile_result = (
        supabase.table("user_profile")
        .select("id, streak_shields")
        .limit(1)
        .single()
        .execute()
    )
    profile_data = profile_result.data
    current_shields = profile_data["streak_shields"] or 0

    if current_shields >= MAX_SHIELDS:
        return {
            "perfect_week": False,
            "shield_awarded": False,
            "shields_total": current_shields,
            "shields_at_max": True,
        }

    # Rango de la semana: ultimos 7 dias (hoy inclusive)
    week_start = today - timedelta(days=PERFECT_WEEK_DAYS - 1)

    # Obtener habitos activos creados hace >=7 dias
    habits_result = (
        supabase.table("habits")
        .select("id")
        .eq("is_archived", False)
        .lte("created_at", week_start.isoformat())
        .execute()
    )

    active_habits = habits_result.data
    if not active_habits:
        # No hay habitos elegibles para semana perfecta
        return {
            "perfect_week": False,
            "shield_awarded": False,
            "shields_total": current_shields,
            "shields_at_max": False,
        }

    habit_ids = [h["id"] for h in active_habits]

    # Obtener todos los registros completados en el rango de la semana
    records_result = (
        supabase.table("habit_records")
        .select("habit_id, date")
        .in_("habit_id", habit_ids)
        .eq("completed", True)
        .gte("date", week_start.isoformat())
        .lte("date", today.isoformat())
        .execute()
    )

    # Construir set de (habit_id, date) para verificacion rapida
    completed: set[tuple[str, str]] = set()
    for record in records_result.data:
        completed.add((record["habit_id"], record["date"]))

    # Verificar que TODOS los habitos tienen registro TODOS los dias
    perfect = True
    check_date = week_start
    while check_date <= today:
        date_str = check_date.isoformat()
        for habit_id in habit_ids:
            if (habit_id, date_str) not in completed:
                perfect = False
                break
        if not perfect:
            break
        check_date += timedelta(days=1)

    if not perfect:
        return {
            "perfect_week": False,
            "shield_awarded": False,
            "shields_total": current_shields,
            "shields_at_max": False,
        }

    # Semana perfecta: otorgar shield
    new_shields = current_shields + 1
    supabase.table("user_profile").update({
        "streak_shields": new_shields,
    }).eq("id", profile_data["id"]).execute()

    return {
        "perfect_week": True,
        "shield_awarded": True,
        "shields_total": new_shields,
        "shields_at_max": new_shields >= MAX_SHIELDS,
    }
