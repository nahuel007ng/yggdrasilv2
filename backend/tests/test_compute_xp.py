import pytest

from app.services.gamification import compute_xp, invalidate_xp_config_cache
from app.models.schemas import ActionType


@pytest.fixture(autouse=True)
def _clear_cache():
    invalidate_xp_config_cache()
    yield
    invalidate_xp_config_cache()


def test_reading_scales_and_caps(monkeypatch):
    monkeypatch.setattr(
        "app.services.gamification._load_xp_config",
        lambda: {"LOG_READING": {"xp_per_unit": 15, "unit_size": 30, "cap_units": 4}},
    )
    assert compute_xp(ActionType.LOG_READING, quantity=30) == 15
    assert compute_xp(ActionType.LOG_READING, quantity=120) == 60   # 4× tope justo
    assert compute_xp(ActionType.LOG_READING, quantity=300) == 60   # 10×, capado a 4×
    assert compute_xp(ActionType.LOG_READING, quantity=15) == 8     # 0.5× redondeado
    assert compute_xp(ActionType.LOG_READING, quantity=None) == 15  # sin cantidad → base


def test_study_scales_more_than_reading(monkeypatch):
    monkeypatch.setattr(
        "app.services.gamification._load_xp_config",
        lambda: {
            "LOG_READING": {"xp_per_unit": 15, "unit_size": 30, "cap_units": 4},
            "LOG_STUDY": {"xp_per_unit": 20, "unit_size": 30, "cap_units": 4},
        },
    )
    assert compute_xp(ActionType.LOG_STUDY, quantity=45) == 30      # round(20 × 1.5)
    assert compute_xp(ActionType.LOG_STUDY, quantity=60) == 40
    assert compute_xp(ActionType.LOG_STUDY, quantity=60) > compute_xp(
        ActionType.LOG_READING, quantity=60
    )


def test_unit_size_as_string(monkeypatch):
    # supabase-py devuelve NUMERIC como str
    monkeypatch.setattr(
        "app.services.gamification._load_xp_config",
        lambda: {"LOG_READING": {"xp_per_unit": 15, "unit_size": "30", "cap_units": 4}},
    )
    assert compute_xp(ActionType.LOG_READING, quantity=60) == 30


def test_habit_binary_and_override(monkeypatch):
    monkeypatch.setattr(
        "app.services.gamification._load_xp_config",
        lambda: {"TOGGLE_HABIT": {"xp_per_unit": 15}},
    )
    assert compute_xp(ActionType.TOGGLE_HABIT) == 15                            # sin override → base
    agua = {"xp_override": 25}
    assert compute_xp(ActionType.TOGGLE_HABIT, habit=agua) == 25                # override fijo
    assert compute_xp(ActionType.TOGGLE_HABIT, quantity=999, habit=agua) == 25  # binario: no escala
    sin_override = {"xp_override": None}
    assert compute_xp(ActionType.TOGGLE_HABIT, habit=sin_override) == 15


def test_fixed_actions_ignore_quantity(monkeypatch):
    monkeypatch.setattr(
        "app.services.gamification._load_xp_config",
        lambda: {"ADD_EXPENSE": {"xp_per_unit": 10, "unit_size": None, "cap_units": None}},
    )
    assert compute_xp(ActionType.ADD_EXPENSE) == 10
    assert compute_xp(ActionType.ADD_EXPENSE, quantity=500) == 10


def test_fallback_to_xp_rewards_when_config_missing(monkeypatch):
    monkeypatch.setattr("app.services.gamification._load_xp_config", lambda: {})
    assert compute_xp(ActionType.LOG_READING) == 15   # fallback a XP_REWARDS
    assert compute_xp(ActionType.FINISH_BOOK) == 40


def test_fallback_when_db_fails(monkeypatch):
    def _boom():
        raise RuntimeError("db caída")

    monkeypatch.setattr("app.services.gamification._load_xp_config", _boom)
    assert compute_xp(ActionType.LOG_READING) == 15


def test_unknown_string_action(monkeypatch):
    monkeypatch.setattr("app.services.gamification._load_xp_config", lambda: {})
    assert compute_xp("QUEST_BONUS") == 0
