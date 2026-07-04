import json
import logging

import httpx

from app.config import settings
from app.llm.prompts import get_system_prompt
from app.models.schemas import ParsedAction, ParseError

logger = logging.getLogger(__name__)


def _clean_llm_response(content: str) -> str:
    """Limpia markdown wrapping que algunos modelos agregan al JSON."""
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()


async def parse_message(text: str) -> ParsedAction | ParseError:
    """Parsea un mensaje de texto libre y devuelve una acción estructurada."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.opencode_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.opencode_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.llm_model,
                    "messages": [
                        {"role": "system", "content": get_system_prompt()},
                        {"role": "user", "content": text},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 200,
                },
            )
            response.raise_for_status()

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        content = _clean_llm_response(content)

        parsed = json.loads(content)
        return ParsedAction(**parsed)

    except httpx.HTTPStatusError as e:
        logger.error("Error HTTP al llamar al LLM: %s", e.response.status_code)
        return ParseError(
            error=f"Error del servicio LLM: {e.response.status_code}",
            original_text=text,
        )
    except json.JSONDecodeError as e:
        logger.error("Error parseando JSON del LLM: %s", e)
        return ParseError(
            error="No pude entender la respuesta del modelo",
            original_text=text,
        )
    except Exception as e:
        logger.error("Error inesperado en parser: %s", e)
        return ParseError(
            error=f"Error inesperado: {e!s}",
            original_text=text,
        )
