from pydantic import BaseModel
from enum import Enum
from typing import Optional
from datetime import date as Date


class ActionType(str, Enum):
    ADD_EXPENSE = "ADD_EXPENSE"
    TOGGLE_HABIT = "TOGGLE_HABIT"
    ADD_TASK = "ADD_TASK"
    LOG_STUDY = "LOG_STUDY"
    LOG_WORKOUT = "LOG_WORKOUT"
    SET_REMINDER = "SET_REMINDER"
    QUERY_DATA = "QUERY_DATA"
    UNKNOWN = "UNKNOWN"


class ParsedPayload(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[Date] = None
    habit_name: Optional[str] = None
    task_title: Optional[str] = None
    query_target: Optional[str] = None


class ParsedAction(BaseModel):
    action: ActionType
    payload: ParsedPayload
    confidence: Optional[float] = None


class ParseError(BaseModel):
    error: str
    original_text: str
