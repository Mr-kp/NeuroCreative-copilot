"""
tribe_client.py — Remote TRIBE v2 inference client.

Calls the Colab/Kaggle endpoint running tribe_colab_backend.ipynb.
Falls back to mock scores on any error (network, timeout, bad response).
"""

import os
import json
import numpy as np
from pathlib import Path

from pipeline_logger import get_logger

logger = get_logger("tribe_client")

TRIBE_ENDPOINT = os.environ.get("TRIBE_ENDPOINT", "").strip()
TRIBE_TIMEOUT = int(os.environ.get("TRIBE_TIMEOUT", "30"))


def get_tribe_endpoint() -> str:
    env_path = Path(__file__).parent / ".env"
    if not TRIBE_ENDPOINT and env_path.exists():
        try:
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if line.startswith("TRIBE_ENDPOINT="):
                    val = line.split("=", 1)[1].strip()
                    if val:
                        return val
        except Exception:
            pass
    return TRIBE_ENDPOINT


def call_tribe(file_data: bytes, filename: str, content_type: str = "image/png") -> dict:
    endpoint = get_tribe_endpoint()

    if not endpoint:
        logger.info("No TRIBE_ENDPOINT configured, using mock scores")
        return _mock_scores()

    logger.info(f"Calling TRIBE endpoint: {endpoint} ({len(file_data)} bytes, {filename})")

    try:
        import httpx
        with httpx.Client(timeout=TRIBE_TIMEOUT) as client:
            resp = client.post(
                endpoint,
                files={"file": (filename, file_data, content_type)},
            )
            resp.raise_for_status()
            data = resp.json()
            brain = data.get("brain_features", {})
            source = brain.get("_source", "tribe_v2")
            logger.info(f"TRIBE response OK: source={source}, attention={brain.get('attention_score', '?')}")
            return {
                "attention_score": float(brain.get("attention_score", 50)),
                "reward_score": float(brain.get("reward_score", 50)),
                "memory_score": float(brain.get("memory_score", 50)),
                "emotion_score": float(brain.get("emotion_score", 50)),
                "visual_load_score": float(brain.get("visual_load_score", 50)),
                "_source": source,
            }
    except ImportError:
        logger.warning("httpx not installed, trying requests")
        return _call_with_requests(file_data, filename, content_type, endpoint)
    except Exception as e:
        logger.warning(f"TRIBE call failed: {type(e).__name__}: {e}")
        return _mock_scores(fallback=True)


def _call_with_requests(file_data: bytes, filename: str, content_type: str, endpoint: str) -> dict:
    try:
        import requests
        resp = requests.post(
            endpoint,
            files={"file": (filename, file_data, content_type)},
            timeout=TRIBE_TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        brain = data.get("brain_features", {})
        source = brain.get("_source", "tribe_v2")
        logger.info(f"TRIBE response OK (requests): source={source}")
        return {
            "attention_score": float(brain.get("attention_score", 50)),
            "reward_score": float(brain.get("reward_score", 50)),
            "memory_score": float(brain.get("memory_score", 50)),
            "emotion_score": float(brain.get("emotion_score", 50)),
            "visual_load_score": float(brain.get("visual_load_score", 50)),
            "_source": source,
        }
    except Exception as e:
        logger.warning(f"TRIBE requests call failed: {e}")
        return _mock_scores(fallback=True)


def _mock_scores(fallback: bool = False) -> dict:
    source = "fallback" if fallback else "mock"
    scores = {
        "attention_score": float(np.clip(np.random.normal(65, 15), 20, 98)),
        "reward_score": float(np.clip(np.random.normal(55, 18), 15, 95)),
        "memory_score": float(np.clip(np.random.normal(50, 14), 18, 92)),
        "emotion_score": float(np.clip(np.random.normal(52, 20), 10, 95)),
        "visual_load_score": float(np.clip(np.random.normal(45, 16), 12, 88)),
        "_source": source,
    }
    logger.info(f"Using {source} brain scores: att={scores['attention_score']:.1f}")
    return scores
