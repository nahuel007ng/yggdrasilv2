"""Textos de respuesta del bot: variantes para que no suene robótico."""
import random

CONFIRMATION_PREFIXES = ["Listo!", "Anotado.", "Hecho ✔", "Registrado.", "Ahí quedó."]

ERROR_GENERIC = (
    "Ups, algo salió mal procesando eso. Ya quedó registrado en los logs para revisarlo. "
    "Probá de nuevo o reformulá el mensaje."
)

PENDING_CONFIRM_HINT = "Respondé 'sí' para confirmar o 'no' para cancelar."


def prefix() -> str:
    return random.choice(CONFIRMATION_PREFIXES)
