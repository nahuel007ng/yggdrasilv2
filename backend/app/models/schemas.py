from pydantic import BaseModel
from enum import Enum
from typing import Optional
from datetime import date as Date


class ActionType(str, Enum):
    ADD_EXPENSE = "ADD_EXPENSE"
    ADD_EXPECTED = "ADD_EXPECTED"
    CONFIRM_TRANSACTION = "CONFIRM_TRANSACTION"
    TOGGLE_HABIT = "TOGGLE_HABIT"
    ADD_TASK = "ADD_TASK"
    LOG_STUDY = "LOG_STUDY"
    LOG_WORKOUT = "LOG_WORKOUT"
    SET_REMINDER = "SET_REMINDER"
    QUERY_DATA = "QUERY_DATA"
    UNKNOWN = "UNKNOWN"


class ExercisePayload(BaseModel):
    name: str
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: Optional[float] = None
    duration_seconds: Optional[int] = None


class ParsedPayload(BaseModel):
    # Existentes
    amount: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[Date] = None
    habit_name: Optional[str] = None
    task_title: Optional[str] = None
    query_target: Optional[str] = None

    # LOG_STUDY
    subject_name: Optional[str] = None
    topic_name: Optional[str] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None

    # LOG_WORKOUT
    exercises: Optional[list[ExercisePayload]] = None

    # SET_REMINDER
    reminder_time: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None

    # QUERY_DATA
    date_from: Optional[Date] = None
    date_to: Optional[Date] = None

    # ADD_EXPECTED / CONFIRM_TRANSACTION
    transaction_id: Optional[str] = None
    confirmed: Optional[bool] = None
    actual_amount: Optional[float] = None
    transaction_type: Optional[str] = None


class ParsedAction(BaseModel):
    action: ActionType
    payload: ParsedPayload
    confidence: Optional[float] = None


class ParseError(BaseModel):
    error: str
    original_text: str
