import os
from types import SimpleNamespace

import pytest
import httpx
from openai import AuthenticationError

import nvidia_ai


class FakeCompletions:
    def __init__(self):
        self.request = None

    def create(self, **request):
        self.request = request
        message = SimpleNamespace(content="Review the low-stock items first.")
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])


class FakeOpenAI:
    def __init__(self, *, api_key, base_url, timeout, max_retries):
        self.options = (api_key, base_url, timeout, max_retries)
        self.completions = FakeCompletions()
        self.chat = SimpleNamespace(completions=self.completions)


def test_ask_nemotron_sends_question_and_inventory_context(monkeypatch):
    fake_client = None

    def create_client(**options):
        nonlocal fake_client
        fake_client = FakeOpenAI(**options)
        return fake_client

    monkeypatch.setattr(nvidia_ai, "_api_key", lambda: "test-key")
    monkeypatch.setattr(nvidia_ai, "OpenAI", create_client)

    answer = nvidia_ai.ask_nemotron(
        "Which items need reordering?",
        context="SKU A: current stock 2; reorder point 5.",
    )

    assert answer == "Review the low-stock items first."
    assert fake_client.options == (
        "test-key",
        nvidia_ai.BASE_URL,
        45.0,
        1,
    )
    request = fake_client.completions.request
    assert request["model"] == nvidia_ai.MODEL
    assert request["messages"][1]["content"] == (
        "Inventory context:\nSKU A: current stock 2; reorder point 5."
        "\n\nUser question:\nWhich items need reordering?"
    )


def test_ask_nemotron_reports_missing_api_key(monkeypatch):
    monkeypatch.setattr(nvidia_ai, "_api_key", lambda: None)

    assert nvidia_ai.ask_nemotron("How much stock do I have?").startswith(
        nvidia_ai.ERROR_PREFIX
    )


def test_ask_nemotron_sanitizes_authentication_errors(monkeypatch):
    response = httpx.Response(
        401,
        request=httpx.Request("POST", nvidia_ai.BASE_URL),
    )
    auth_error = AuthenticationError(
        "private provider detail",
        response=response,
        body={"message": "private provider detail"},
    )

    def reject_client(**options):
        raise auth_error

    monkeypatch.setattr(nvidia_ai, "_api_key", lambda: "test-key")
    monkeypatch.setattr(nvidia_ai, "OpenAI", reject_client)

    answer = nvidia_ai.ask_nemotron("How much stock do I have?")

    assert answer.startswith(nvidia_ai.ERROR_PREFIX)
    assert "private provider detail" not in answer


@pytest.mark.skipif(
    os.getenv("NVIDIA_RUN_INTEGRATION_TESTS") != "1",
    reason="Set NVIDIA_RUN_INTEGRATION_TESTS=1 to call the real NVIDIA API.",
)
def test_real_nemotron_inventory_request():
    answer = nvidia_ai.ask_nemotron(
        "Which product should I reorder first?",
        context=(
            "Selected date range: 2026-10-01 to 2026-10-29\n"
            "Product A: current stock 2, reorder point 5, recommended quantity 10."
        ),
    )

    assert not answer.startswith(nvidia_ai.ERROR_PREFIX), answer
    assert answer.strip()
