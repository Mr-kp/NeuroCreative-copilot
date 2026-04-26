"""
pipeline_logger.py — Structured logging for NeuroCreative pipeline.

Logs to both console and logs/pipeline.log with rotation.
Every function call, file operation, model inference, and error is logged
with timestamps and context.
"""

import logging
import logging.handlers
import os
import sys
import time
from pathlib import Path
from datetime import datetime

LOG_DIR = Path(__file__).parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "pipeline.log"

_formatter = logging.Formatter(
    fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

_file_handler = logging.handlers.RotatingFileHandler(
    str(LOG_FILE), maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8"
)
_file_handler.setFormatter(_formatter)
_file_handler.setLevel(logging.DEBUG)

_console_handler = logging.StreamHandler(sys.stdout)
_console_handler.setFormatter(_formatter)
_console_handler.setLevel(logging.INFO)

_logger = logging.getLogger("neurocreative")
_logger.setLevel(logging.DEBUG)
_logger.addHandler(_file_handler)
_logger.addHandler(_console_handler)
_logger.propagate = False


def get_logger(name: str = "") -> logging.Logger:
    if name:
        return _logger.getChild(name)
    return _logger


class StepTimer:
    def __init__(self, step_name: str, logger: logging.Logger = None):
        self.step_name = step_name
        self.logger = logger or get_logger("pipeline")
        self.start = None

    def __enter__(self):
        self.start = time.time()
        self.logger.info(f"[START] {self.step_name}")
        return self

    def __exit__(self, *args):
        elapsed = time.time() - self.start
        self.logger.info(f"[DONE] {self.step_name} ({elapsed:.2f}s)")
