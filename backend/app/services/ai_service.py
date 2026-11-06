
import os

from dotenv import load_dotenv
from openai import (
    OpenAI,
    AuthenticationError,
    RateLimitError,
    NotFoundError,
    APITimeoutError,
    APIConnectionError,
    APIStatusError,
    OpenAIError,
)

load_dotenv()

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")
NVIDIA_BASE_URL = os.getenv(
    "NVIDIA_BASE_URL",
    "https://integrate.api.nvidia.com/v1"
)
NVIDIA_MODEL = os.getenv(
    "NVIDIA_MODEL",
    "nvidia/nemotron-3.5-lightning-30b-a3b"
)



def ask_nemotron(
    question: str,
    context: str = "",
    history: list[dict] | None = None
) -> str:

    if not NVIDIA_API_KEY:
        raise RuntimeError("NVIDIA API key is not configured.")

    try:
        client = OpenAI(
            api_key=NVIDIA_API_KEY,
            base_url=NVIDIA_BASE_URL,
            timeout=45.0,
            max_retries=1,
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are STOCK AI, an intelligent inventory "
                    "management assistant. Answer clearly and "
                    "professionally. Use only the supplied inventory "
                    "context for specific stock data and numerical "
                    "claims. Use conversation history to understand "
                    "follow-up questions. If information is missing, "
                    "explain what is missing. Never invent sales figures, "
                    "stock levels, or predictions."
                ),
            }
        ]

        # Add previous conversation
        if history:
            for item in history[-10:]:
                if item.get("role") in ("user", "assistant"):
                    messages.append({
                        "role": item["role"],
                        "content": item["content"]
                    })

        # Add current question and latest business context
        messages.append({
            "role": "user",
            "content": (
                f"Latest inventory and sales context:\n{context}\n\n"
                f"Current question:\n{question}"
            ),
        })

        response = client.chat.completions.create(
            model=NVIDIA_MODEL,
            messages=messages,
        )

        answer = response.choices[0].message.content

        if not answer or not answer.strip():
            raise RuntimeError("Nemotron returned an empty response.")

        return answer.strip()

    except AuthenticationError:
        raise RuntimeError("NVIDIA rejected the API key.")

    except RateLimitError:
        raise RuntimeError("NVIDIA rate limit reached.")

    except NotFoundError:
        raise RuntimeError("The selected NVIDIA model is unavailable.")

    except APITimeoutError:
        raise RuntimeError("NVIDIA request timed out.")

    except APIConnectionError:
        raise RuntimeError("Could not connect to NVIDIA.")

    except APIStatusError as error:
        if error.status_code in (404, 410, 503):
            raise RuntimeError("The NVIDIA model is currently unavailable.")
        raise RuntimeError("NVIDIA returned an API error.")

    except OpenAIError:
        raise RuntimeError("The NVIDIA request could not be completed.")

