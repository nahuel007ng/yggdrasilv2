from datetime import date

from app.db.supabase import get_supabase, get_user_id
from app.models.schemas import ParsedPayload


async def log_workout(payload: ParsedPayload) -> dict:
    """Registra un entrenamiento con ejercicios y sets en Supabase."""
    supabase = get_supabase()

    workout_date = (payload.date or date.today()).isoformat()

    user_id = get_user_id()

    # Insertar workout
    workout = {
        "date": workout_date,
        "duration_minutes": payload.duration_minutes,
        "notes": payload.notes,
        "user_id": user_id,
    }
    workout_result = supabase.table("workouts").insert(workout).execute()
    workout_id = workout_result.data[0]["id"]

    # Insertar ejercicios y sets
    exercise_count = 0
    if payload.exercises:
        for i, ex in enumerate(payload.exercises):
            exercise = {
                "workout_id": workout_id,
                "name": ex.name,
                "sort_order": i,
                "user_id": user_id,
            }
            ex_result = supabase.table("exercises").insert(exercise).execute()
            exercise_id = ex_result.data[0]["id"]
            exercise_count += 1

            # Insertar sets si hay datos de sets/reps
            if ex.sets and ex.reps:
                for set_num in range(1, ex.sets + 1):
                    exercise_set = {
                        "exercise_id": exercise_id,
                        "set_number": set_num,
                        "reps": ex.reps,
                        "weight": ex.weight,
                        "duration_seconds": ex.duration_seconds,
                        "user_id": user_id,
                    }
                    supabase.table("exercise_sets").insert(exercise_set).execute()
            elif ex.duration_seconds:
                # Ejercicio de duracion (ej. plancha 1 min)
                exercise_set = {
                    "exercise_id": exercise_id,
                    "set_number": 1,
                    "duration_seconds": ex.duration_seconds,
                    "user_id": user_id,
                }
                supabase.table("exercise_sets").insert(exercise_set).execute()

    return {
        "success": True,
        "exercise_count": exercise_count,
        "date": workout_date,
    }
