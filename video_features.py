import base64
import tempfile
import numpy as np


def extract_video_frames(video_bytes: bytes, max_frames: int = 15):
    try:
        import cv2
    except ImportError:
        return []

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        f.write(video_bytes)
        tmp_path = f.name

    cap = cv2.VideoCapture(tmp_path)
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total_frames / fps if fps > 0 else 0

    if total_frames <= 0:
        cap.release()
        return []

    frames = []
    interval = max(1, total_frames // max_frames)
    for i in range(0, total_frames, interval):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if ret:
            ts = round(i / fps, 1) if fps > 0 else 0
            _, buf = cv2.imencode(".png", frame)
            b64 = base64.b64encode(buf).decode("utf-8")
            frames.append({"timestamp": ts, "base64": b64})

    cap.release()

    import os
    os.unlink(tmp_path)

    return frames, duration
