
import streamlit as st
from openai import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AuthenticationError,
    NotFoundError,
    OpenAI,
    OpenAIError,
    RateLimitError,
)
from streamlit.errors import StreamlitSecretNotFoundError

MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b"
BASE_URL = "https://integrate.api.nvidia.com/v1"
ERROR_PREFIX = "NVIDIA request failed:"


def _api_key():
    try:
        api_key = st.secrets["NVIDIA_API_KEY"]
    except (KeyError, StreamlitSecretNotFoundError):
        return None

    if not isinstance(api_key, str) or not api_key or api_key == "YOUR_NVIDIA_API_KEY":
        return None
    return api_key


def ask_nemotron(question, context=""):
    api_key = _api_key()
    if not api_key:
        return f"{ERROR_PREFIX} NVIDIA_API_KEY is not configured in Streamlit secrets."

    try:
        client = OpenAI(
            api_key=api_key,
            base_url=BASE_URL,
            timeout=45.0,
            max_retries=1,
        )
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an AI assistant for STOCK AI. Answer clearly using "
                        "only the supplied inventory context for specific stock data "
                        "or numerical claims. If data is missing, explain what is "
                        "missing. Do not invent live prices, predictions, or financial results."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Inventory context:\n{context}\n\nUser question:\n{question}",
                },
            ],
        )
    except AuthenticationError:
        return f"{ERROR_PREFIX} NVIDIA rejected the API key. Check NVIDIA_API_KEY in Streamlit secrets."
    except RateLimitError:
        return f"{ERROR_PREFIX} NVIDIA rate limit reached. Please wait and try again."
    except NotFoundError:
        return f"{ERROR_PREFIX} the selected NVIDIA model is unavailable."
    except APITimeoutError:
        return f"{ERROR_PREFIX} the NVIDIA request timed out. Please try again."
    except APIConnectionError:
        return f"{ERROR_PREFIX} could not connect to NVIDIA. Check the network and try again."
    except APIStatusError as error:
        if error.status_code in (404, 410, 503):
            return f"{ERROR_PREFIX} the selected NVIDIA model is unavailable."
        return f"{ERROR_PREFIX} NVIDIA returned an API error. Please try again later."
    except OpenAIError:
        return f"{ERROR_PREFIX} the NVIDIA request could not be completed. Please try again later."

    answer = response.choices[0].message.content
    if not answer or not answer.strip():
        return f"{ERROR_PREFIX} Nemotron returned an empty response."
    return answer.strip()
