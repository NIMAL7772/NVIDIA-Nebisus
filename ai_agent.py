"""Local open-source AI adapter for StockSense via Ollama."""
from __future__ import annotations
import os
from typing import Any
import requests
from dotenv import load_dotenv
from database import analytics, dashboard_metrics, reorder_recommendations

load_dotenv()
DEFAULT_MODEL = "qwen2.5:7b"
DEFAULT_BASE_URL = "http://localhost:11434"

def _base_url() -> str:
    return os.getenv("OLLAMA_BASE_URL", DEFAULT_BASE_URL).rstrip("/")

def _model() -> str:
    return os.getenv("OLLAMA_MODEL", DEFAULT_MODEL)

def ai_status() -> tuple[bool, str]:
    """Check the local service without sending inventory data."""
    try:
        response = requests.get(f"{_base_url()}/api/tags", timeout=2)
        response.raise_for_status()
        models = {item.get("name") for item in response.json().get("models", [])}
        if _model() in models:
            return True, f"Local open-source AI enabled · {_model()}"
        return False, f"Ollama is running, but {_model()} is not installed. Run: ollama pull {_model()}"
    except requests.RequestException:
        return False, "Local AI is offline. Install/start Ollama, then run: ollama pull qwen2.5:7b"

def _verified_context(start: str, end: str) -> dict[str, Any]:
    """Approved read-only inventory functions exposed to the assistant."""
    performance = analytics(start, end)
    return {
        "date_range": {"start": start, "end": end},
        "dashboard_metrics": dashboard_metrics(start, end),
        "top_products": performance["top"].to_dict("records"),
        "slow_products": performance["slow"].to_dict("records"),
        "top_customers": performance["customers"].to_dict("records"),
        "reorder_recommendations": reorder_recommendations(start, end),
    }

def ask(question: str, start: str, end: str) -> tuple[str, list[str]]:
    facts = _verified_context(start, end)
    system = """You are StockSense AI, a retail and wholesale inventory analyst.
Answer only from VERIFIED BUSINESS DATA supplied below. Never make up numbers,
customers, sales, stock, or external facts. If the data says insufficient_data,
clearly say that there is insufficient data. End with: 'Data provenance: verified local SQLite analytics.'"""
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": f"Question: {question}\n\nVERIFIED BUSINESS DATA:\n{facts}"},
    ]
    try:
        response = requests.post(
            f"{_base_url()}/api/chat",
            json={"model": _model(), "messages": messages, "stream": False,
                  "options": {"temperature": 0.1}}, timeout=90,
        )
        response.raise_for_status()
        answer = response.json().get("message", {}).get("content", "").strip()
        if not answer:
            return "The local model returned an empty answer. Please try again.", []
        return answer, ["dashboard_metrics", "product_performance", "reorder_recommendations"]
    except requests.RequestException as exc:
        return f"Local AI could not answer: {exc.__class__.__name__}. Ensure Ollama is running and the selected model is installed.", []
