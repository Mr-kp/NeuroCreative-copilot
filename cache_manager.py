"""
cache_manager.py — Hash-based result cache for demo speed.

Stores analysis results as JSON in tmp/cache/.
If a file was already analyzed, returns cached result instantly.
"""

import hashlib
import json
import os
from pathlib import Path
from datetime import datetime

from pipeline_logger import get_logger

logger = get_logger("cache")

CACHE_DIR = Path(__file__).parent / "tmp" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


def _hash_file(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()[:16]


def _hash_bytes(data: bytes, filename: str) -> str:
    h = hashlib.sha256()
    h.update(filename.encode())
    h.update(data)
    return h.hexdigest()[:16]


def cache_exists(file_path: str = None, file_data: bytes = None, filename: str = "") -> bool:
    if file_path:
        key = _hash_file(file_path)
    elif file_data is not None:
        key = _hash_bytes(file_data, filename)
    else:
        return False
    cache_file = CACHE_DIR / f"{key}.json"
    exists = cache_file.exists()
    logger.info(f"Cache lookup '{key}' ({filename or file_path}): {'HIT' if exists else 'MISS'}")
    return exists


def cache_load(file_path: str = None, file_data: bytes = None, filename: str = "") -> dict | None:
    if file_path:
        key = _hash_file(file_path)
    elif file_data is not None:
        key = _hash_bytes(file_data, filename)
    else:
        return None
    cache_file = CACHE_DIR / f"{key}.json"
    if not cache_file.exists():
        logger.warning(f"Cache MISS on load for '{key}'")
        return None
    with open(cache_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    logger.info(f"Cache loaded '{key}': {len(json.dumps(data, cls=_NumpyEncoder))} bytes")
    return data


class _NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        import numpy as np
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


def cache_save(result: dict, file_path: str = None, file_data: bytes = None, filename: str = "") -> str:
    if file_path:
        key = _hash_file(file_path)
    elif file_data is not None:
        key = _hash_bytes(file_data, filename)
    else:
        key = hashlib.sha256(str(datetime.now()).encode()).hexdigest()[:16]
    cache_file = CACHE_DIR / f"{key}.json"
    result["_cache_key"] = key
    result["_cached_at"] = datetime.now().isoformat()
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2, cls=_NumpyEncoder)
    logger.info(f"Cache saved '{key}' -> {cache_file.name} ({len(json.dumps(result, cls=_NumpyEncoder))} bytes)")
    return key


def cache_list() -> list[dict]:
    entries = []
    for f in sorted(CACHE_DIR.glob("*.json")):
        try:
            with open(f, "r") as fh:
                data = json.load(fh)
                entries.append({
                    "key": data.get("_cache_key", f.stem),
                    "cached_at": data.get("_cached_at", "?"),
                    "creative_id": data.get("creatives", [{}])[0].get("creative_id", "?"),
                })
        except Exception:
            entries.append({"key": f.stem, "cached_at": "?", "creative_id": "?"})
    return entries
