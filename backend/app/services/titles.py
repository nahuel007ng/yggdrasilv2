"""Servicio de títulos (Gamificación V2.2).

Los títulos se desbloquean por combinaciones de logros (badges) y se guardan
en user_titles. El usuario equipa uno en user_profile.active_title (frontend).
"""

from enum import Enum

from app.db.supabase import get_supabase, get_user_id


class TitleCode(str, Enum):
    SABIO_FORMACION = "title_sabio_formacion"
    FORJADOR_HIERRO = "title_forjador_hierro"
    TESORERO_NOVATO = "title_tesorero_novato"
    BIBLIOTECARIO_JUNIOR = "title_bibliotecario_junior"
    ESTRATEGA_ASCENSO = "title_estratega_ascenso"
    HEROE_CONSTANCIA = "title_heroe_constancia"
    FORJADOR_VOLUNTAD = "title_forjador_voluntad"
    TODOTERRENO_EPICO = "title_todoterreno_epico"
    SABIO_INTEGRAL = "title_sabio_integral"
    DIOS_SISTEMA = "title_dios_sistema"
    CUERPO_DAO_INNATO = "title_cuerpo_dao_innato"
    SENTIDO_DIVINO = "title_sentido_divino"
    CUERPO_DORADO = "title_cuerpo_dorado"
    LINAJE_REY_DRAGON = "title_linaje_rey_dragon"


TITLE_NAMES = {
    TitleCode.SABIO_FORMACION: "Sabio en Formación",
    TitleCode.FORJADOR_HIERRO: "Forjador de Hierro",
    TitleCode.TESORERO_NOVATO: "Tesorero Novato",
    TitleCode.BIBLIOTECARIO_JUNIOR: "Bibliotecario Junior",
    TitleCode.ESTRATEGA_ASCENSO: "Estratega en Ascenso",
    TitleCode.HEROE_CONSTANCIA: "Héroe de la Constancia",
    TitleCode.FORJADOR_VOLUNTAD: "Forjador de Voluntad",
    TitleCode.TODOTERRENO_EPICO: "Todoterreno Épico",
    TitleCode.SABIO_INTEGRAL: "Sabio Integral",
    TitleCode.DIOS_SISTEMA: "Dios del Sistema",
    TitleCode.CUERPO_DAO_INNATO: "Cuerpo Dao Innato",
    TitleCode.SENTIDO_DIVINO: "Apertura del Sentido Divino",
    TitleCode.CUERPO_DORADO: "Cuerpo Dorado Primordial",
    TitleCode.LINAJE_REY_DRAGON: "Linaje del Rey Dragón Primordial",
}

ROUTE_ACHIEVEMENTS = {
    "erudito": ["first_study", "study_10h", "study_50h", "study_100h", "study_250h", "study_500h"],
    "guerrero": ["first_workout", "first_habit", "streak_7", "streak_30", "perfect_week",
                 "workout_30", "workout_60", "workout_90", "workout_120", "workout_150",
                 "workout_200", "workout_300", "workout_500"],
    "tesorero": ["first_expense", "savings_10k", "savings_100k", "savings_500k", "savings_1m"],
    "bibliotecario": ["read_50h", "read_100h", "read_250h", "read_500h",
                      "books_classics_5", "books_philosophy_10", "books_science_5"],
    "estratega": ["first_task", "tasks_10", "tasks_50", "tasks_100", "tasks_zero_overdue"],
    "sistema": ["xp_1000", "rank_despertado", "rank_maestro", "rank_santo",
                "rank_soberano", "rank_espiritu", "rank_dios", "all_rounder"],
}

_FIVE_ROUTES = ["erudito", "guerrero", "tesorero", "bibliotecario", "estratega"]


def _count_in_route(unlocked: set[str], route: str) -> int:
    return len(unlocked & set(ROUTE_ACHIEVEMENTS[route]))


def _title_condition(code: TitleCode, unlocked: set[str], unlocked_titles: set[str]) -> bool:
    if code == TitleCode.SABIO_FORMACION:
        return _count_in_route(unlocked, "erudito") >= 3
    if code == TitleCode.FORJADOR_HIERRO:
        return _count_in_route(unlocked, "guerrero") >= 3
    if code == TitleCode.TESORERO_NOVATO:
        return _count_in_route(unlocked, "tesorero") >= 2
    if code == TitleCode.BIBLIOTECARIO_JUNIOR:
        return _count_in_route(unlocked, "bibliotecario") >= 2
    if code == TitleCode.ESTRATEGA_ASCENSO:
        return _count_in_route(unlocked, "estratega") >= 2
    if code == TitleCode.HEROE_CONSTANCIA:
        return {"streak_30", "study_100h", "workout_90"} <= unlocked
    if code == TitleCode.FORJADOR_VOLUNTAD:
        return {"streak_7", "streak_30", "perfect_week"} <= unlocked
    if code == TitleCode.TODOTERRENO_EPICO:
        return all(_count_in_route(unlocked, r) >= 1 for r in _FIVE_ROUTES)
    if code == TitleCode.SABIO_INTEGRAL:
        return all(_count_in_route(unlocked, r) >= 3 for r in _FIVE_ROUTES)
    if code == TitleCode.DIOS_SISTEMA:
        return "rank_soberano" in unlocked and len(unlocked) >= 20
    if code == TitleCode.CUERPO_DAO_INNATO:
        return set(ROUTE_ACHIEVEMENTS["erudito"]) <= unlocked
    if code == TitleCode.SENTIDO_DIVINO:
        return set(ROUTE_ACHIEVEMENTS["bibliotecario"]) <= unlocked
    if code == TitleCode.CUERPO_DORADO:
        return "workout_500" in unlocked
    if code == TitleCode.LINAJE_REY_DRAGON:
        return {TitleCode.CUERPO_DAO_INNATO.value, TitleCode.SENTIDO_DIVINO.value,
                TitleCode.CUERPO_DORADO.value} <= unlocked_titles
    return False


async def check_and_award_titles() -> list[dict]:
    """Chequea y otorga títulos pendientes. Devuelve [{code, name}] de los nuevos.

    Itera hasta estabilizar (el Linaje depende de otros 3 títulos que pueden
    desbloquearse en la misma pasada).
    """
    supabase = get_supabase()
    badges_res = supabase.table("badges").select("code").execute()
    unlocked = {row["code"] for row in badges_res.data}
    titles_res = supabase.table("user_titles").select("code").execute()
    unlocked_titles = {row["code"] for row in titles_res.data}

    newly: list[dict] = []
    changed = True
    while changed:
        changed = False
        for code in TitleCode:
            if code.value in unlocked_titles:
                continue
            if _title_condition(code, unlocked, unlocked_titles):
                supabase.table("user_titles").insert(
                    {"code": code.value, "user_id": get_user_id()}
                ).execute()
                unlocked_titles.add(code.value)
                newly.append({"code": code.value, "name": TITLE_NAMES[code]})
                changed = True
    return newly
