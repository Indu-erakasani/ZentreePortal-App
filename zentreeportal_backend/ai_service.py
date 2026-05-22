"""
ai_service.py
─────────────────────────────────────────────────────────────────────────────
Centralised AI helper used by every route in this project.

  from ai_service import ai_call, ai_vision_call, extract_text

Usage:
  text = ai_call(prompt)                    # text-only (JSON or prose)
  text = ai_vision_call(b64, prompt)        # image + text
  text = extract_text(gemini_response_json) # parse Gemini response dict

Fallback chain on 429 / 503 / 502:
  1. Gemini 2.5 Flash      (fastest, cheapest, primary)
  2. Gemini 2.0 Flash      (slightly older, separate quota)
  3. Groq  llama-3.3-70b   (different provider entirely)

Set these env vars:
  GEMINI_API_KEY      required
  GROQ_API_KEY        optional – enables fallback 3
  GRADING_PROVIDER    "gemini" | "groq"  (default: gemini)
  AI_LOG_LEVEL        "debug" to see which model answered each call
─────────────────────────────────────────────────────────────────────────────
"""

import os
import json
import time
import logging

import requests as _http

logger = logging.getLogger(__name__)

# ── Model constants ───────────────────────────────────────────────────────────

_GEMINI_BASE = (
    "https://generativelanguage.googleapis.com/v1beta/models"
)

# Text models tried in order when the previous one returns 429/503

_GEMINI_TEXT_MODELS = [
    "gemini-3.5-flash",
    "gemini-2.5-flash",       # primary
    "gemini-2.0-flash",       # fallback 1
    "gemini-2.0-flash-lite",  # fallback 2
]

# Vision model used for proctoring snapshots
# _VISION_MODELS = "gemini-2.0-flash"


_GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL = "llama-3.3-70b-versatile"

# HTTP status codes we treat as "retry with next model"
_RETRYABLE = {429, 503, 502, 500}


# ── Low-level helpers ─────────────────────────────────────────────────────────

def extract_text(response_json: dict) -> str:
    """
    Extract the final answer text from any Gemini generateContent response.
    Thinking-model safe: returns the LAST non-empty text part.
    """
    try:
        parts = response_json["candidates"][0]["content"]["parts"]
        text_parts = [p["text"] for p in parts if p.get("text", "").strip()]
        if not text_parts:
            raise ValueError("No text content in Gemini response")
        return text_parts[-1]
    except (KeyError, IndexError) as exc:
        raise ValueError(f"Unexpected Gemini response structure: {exc}") from exc


def _gemini_post(model: str, payload: dict, timeout: int = 90) -> _http.Response:
    """POST to a single Gemini model endpoint."""
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise ValueError("GEMINI_API_KEY is not set")
    url = f"{_GEMINI_BASE}/{model}:generateContent?key={key}"
    return _http.post(
        url,
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=timeout,
    )


def _groq_post(prompt: str, max_retries: int = 2) -> str:
    """Call Groq with a text-only prompt. Returns the raw text content."""
    key = os.environ.get("GROQ_API_KEY", "")
    if not key:
        raise ValueError("GROQ_API_KEY is not set")
    delays = [2, 4]
    for attempt in range(max_retries + 1):
        try:
            resp = _http.post(
                _GROQ_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {key}",
                },
                json={
                    "model": _GROQ_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are an expert technical assistant. "
                                "Always respond with valid JSON only. "
                                "No markdown. No backticks. No extra text."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.1,
                    "max_tokens": 4096,
                },
                timeout=45,
            )
            if resp.status_code in _RETRYABLE and attempt < max_retries:
                time.sleep(delays[attempt])
                continue
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"].strip()
        except _http.exceptions.Timeout:
            if attempt < max_retries:
                time.sleep(delays[attempt])
                continue
            raise ValueError("Groq timed out")
    raise ValueError("Groq failed after retries")


# ── Public API ────────────────────────────────────────────────────────────────

def ai_call(prompt: str, timeout: int = 90) -> str:
    """
    Send a text-only prompt to the AI.
    Tries each Gemini model in _GEMINI_TEXT_MODELS, then falls back to Groq.

    Returns the raw text from the model (JSON string or prose).
    Raises ValueError only if ALL providers fail.

    Example:
        raw = ai_call(my_prompt)
        data = json.loads(raw.replace("```json","").replace("```","").strip())
    """
    key = os.environ.get("GEMINI_API_KEY", "")
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    last_error: Exception = ValueError("No AI provider attempted")

    # ── Try each Gemini model ─────────────────────────────────────────────────
    if key:
        for model in _GEMINI_TEXT_MODELS:
            try:
                resp = _gemini_post(model, payload, timeout=timeout)

                if resp.status_code in _RETRYABLE:
                    logger.warning(
                        "[ai_service] %s returned %s — trying next model",
                        model, resp.status_code,
                    )
                    last_error = ValueError(f"{model} HTTP {resp.status_code}")
                    time.sleep(2)   # brief pause before trying next model
                    continue

                resp.raise_for_status()
                text = extract_text(resp.json())
                if logger.isEnabledFor(logging.DEBUG):
                    logger.debug("[ai_service] answered by %s", model)
                return text

            except ValueError:
                raise   # propagate parse errors — don't retry
            except Exception as exc:
                logger.warning("[ai_service] %s error: %s", model, exc)
                last_error = exc
                continue   # try next Gemini model

    # ── Groq fallback ─────────────────────────────────────────────────────────
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if groq_key:
        try:
            logger.info("[ai_service] all Gemini models failed — using Groq")
            return _groq_post(prompt)
        except Exception as exc:
            last_error = exc
            logger.error("[ai_service] Groq also failed: %s", exc)

    raise ValueError(
        f"All AI providers failed. Last error: {last_error}. "
        "Check GEMINI_API_KEY / GROQ_API_KEY and your quota."
    )


def ai_vision_call(b64_image: str, prompt: str, timeout: int = 30) -> str:
    key = os.environ.get("GEMINI_API_KEY", "")

    _VISION_MODELS = [
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
    ]

    if key:
        payload = {
            "contents": [{
                "parts": [
                    {"inline_data": {"mime_type": "image/jpeg", "data": b64_image}},
                    {"text": prompt},
                ]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 1024,
            },
        }

        for model in _VISION_MODELS:
            try:
                resp = _gemini_post(model, payload, timeout=timeout)
                if resp.status_code in _RETRYABLE:
                    logger.warning("[ai_service] vision %s returned %s — trying next", model, resp.status_code)
                    time.sleep(3)
                    continue
                resp.raise_for_status()

                data = resp.json()
                if data.get("promptFeedback", {}).get("blockReason"):
                    raise ValueError(f"Blocked: {data['promptFeedback']['blockReason']}")
                candidates = data.get("candidates", [])
                if not candidates:
                    raise ValueError("No candidates in vision response")
                if candidates[0].get("finishReason") in ("SAFETY", "RECITATION"):
                    raise ValueError(f"Response blocked: {candidates[0]['finishReason']}")

                logger.debug("[ai_service] vision answered by %s", model)
                return candidates[0]["content"]["parts"][0]["text"].strip()

            except ValueError:
                raise
            except Exception as exc:
                logger.warning("[ai_service] vision %s failed: %s — trying next", model, exc)
                continue

    # ── OpenRouter fallback ───────────────────────────────────────────────────
    or_key = os.environ.get("OPENROUTER_API_KEY", "")
    if or_key:
        try:
            resp = _http.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {or_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": os.environ.get("FRONTEND_URL", "http://localhost:3000"),
                },
                json={
                    "model": "google/gemini-2.0-flash-exp:free",
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_image}"}},
                            {"type": "text", "text": prompt},
                        ],
                    }],
                    "max_tokens": 500,
                    "temperature": 0.1,
                },
                timeout=timeout,
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"].strip()
        except Exception as exc:
            logger.error("[ai_service] OpenRouter vision failed: %s", exc)

    raise ValueError("No vision AI provider available — set GEMINI_API_KEY or OPENROUTER_API_KEY")




def ai_parse_pdf(file_b64: str, prompt: str, timeout: int = 60) -> str:
    """
    Send a PDF (base64) + text prompt to Gemini (inline_data).
    Falls back through Gemini models on 429; no Groq fallback (PDFs need vision).
    """
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise ValueError("GEMINI_API_KEY is not set")

    payload = {
        "contents": [{
            "parts": [
                {"inline_data": {"mime_type": "application/pdf", "data": file_b64}},
                {"text": prompt},
            ]
        }]
    }

    last_error: Exception = ValueError("No Gemini model attempted")

    for model in _GEMINI_TEXT_MODELS:
        try:
            resp = _gemini_post(model, payload, timeout=timeout)
            if resp.status_code in _RETRYABLE:
                logger.warning("[ai_service] pdf %s returned %s — trying next model", model, resp.status_code)
                last_error = ValueError(f"{model} HTTP {resp.status_code}")
                time.sleep(2)
                continue
            resp.raise_for_status()
            return extract_text(resp.json())
        except ValueError:
            raise
        except Exception as exc:
            logger.warning("[ai_service] pdf %s error: %s", model, exc)
            last_error = exc
            continue

    raise ValueError(f"All Gemini models failed for PDF parsing. Last error: {last_error}")





