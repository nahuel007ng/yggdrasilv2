"""Textos de respuesta del bot: variantes para que no suene robótico.

La persona ('El Sistema', tratamiento 'Gran Maestro') vive en app.bot.persona.
"""
import random

from app.bot.persona import CONFIRMATION_PREFIXES

ERROR_GENERIC = (
    "Una interferencia perturbó al Sistema, Gran Maestro. "
    "El incidente quedó registrado en los archivos. "
    "Intentá de nuevo o reformulá."
)

PENDING_CONFIRM_HINT = "Respondé 'sí' para confirmar o 'no' para cancelar, Gran Maestro."


def prefix() -> str:
    return random.choice(CONFIRMATION_PREFIXES)
