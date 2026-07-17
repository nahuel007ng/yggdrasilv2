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
    DELETE_REMINDER = "DELETE_REMINDER"
    QUERY_DATA = "QUERY_DATA"
    ADD_SAVINGS = "ADD_SAVINGS"
    WITHDRAW_SAVINGS = "WITHDRAW_SAVINGS"
    LOG_READING = "LOG_READING"
    FINISH_BOOK = "FINISH_BOOK"
    QUERY_ANALYTICS = "QUERY_ANALYTICS"
    GET_RECOMMENDATION = "GET_RECOMMENDATION"
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

    # SET_REMINDER / DELETE_REMINDER
    reminder_time: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None
    remind_before_minutes: Optional[int] = None

    # QUERY_DATA
    date_from: Optional[Date] = None
    date_to: Optional[Date] = None

    # ADD_EXPECTED / CONFIRM_TRANSACTION
    transaction_id: Optional[str] = None
    confirmed: Optional[bool] = None
    actual_amount: Optional[float] = None
    transaction_type: Optional[str] = None

    # LOG_READING / FINISH_BOOK
    book_title: Optional[str] = None
    title: Optional[str] = None
    author: Optional[str] = None

    # QUERY_ANALYTICS
    metric: Optional[str] = None
    target_amount: Optional[float] = None
    original_question: Optional[str] = None

    # GET_RECOMMENDATION
    topic: Optional[str] = None


class ParsedAction(BaseModel):
    action: ActionType
    payload: ParsedPayload
    confidence: Optional[float] = None


class ParseError(BaseModel):
    error: str
    original_text: str
