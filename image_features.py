import io
import numpy as np
from PIL import Image, ImageFilter


def extract_pil_features(image_bytes: bytes) -> dict:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img_arr = np.array(img, dtype=np.float64)
    gray_arr = np.array(img.convert("L"), dtype=np.float64)

    brightness = float(gray_arr.mean())
    contrast = float(gray_arr.std())

    r_mean = float(img_arr[:, :, 0].mean())
    g_mean = float(img_arr[:, :, 1].mean())
    b_mean = float(img_arr[:, :, 2].mean())
    r_std = float(img_arr[:, :, 0].std())
    g_std = float(img_arr[:, :, 1].std())
    b_std = float(img_arr[:, :, 2].std())
    color_var = float(img_arr.var())

    edges = img.convert("L").filter(ImageFilter.FIND_EDGES)
    edge_arr = np.array(edges, dtype=np.float64)
    edge_density = float((edge_arr > 30).sum() / edge_arr.size)

    w, h = gray_arr.shape[1], gray_arr.shape[0]

    left = gray_arr[:, : w // 2]
    right_flipped = gray_arr[:, w // 2:][:, ::-1]
    min_w = min(left.shape[1], right_flipped.shape[1])
    symmetry_v = float(1.0 - np.mean(np.abs(left[:, :min_w] - right_flipped[:, :min_w])) / 255.0)

    top = gray_arr[: h // 2, :]
    bottom_flipped = gray_arr[h // 2:, :][::-1, :]
    min_h = min(top.shape[0], bottom_flipped.shape[0])
    symmetry_h = float(1.0 - np.mean(np.abs(top[:min_h, :] - bottom_flipped[:min_h, :])) / 255.0)

    channel_means = [r_mean, g_mean, b_mean]
    dominant_channel = int(np.argmax(channel_means))

    hsv_arr = np.array(img.convert("HSV"), dtype=np.float64)
    saturation = hsv_arr[:, :, 1] / 255.0
    saturation_mean = float(saturation.mean())
    saturation_std = float(saturation.std())

    dark_pixel_frac = float((gray_arr < 50).sum() / gray_arr.size)
    bright_pixel_frac = float((gray_arr > 200).sum() / gray_arr.size)

    return {
        "width": w, "height": h,
        "brightness": brightness, "contrast": contrast,
        "color_r_mean": r_mean, "color_g_mean": g_mean, "color_b_mean": b_mean,
        "color_r_std": r_std, "color_g_std": g_std, "color_b_std": b_std,
        "color_var": color_var,
        "edge_density": edge_density,
        "symmetry_v": symmetry_v, "symmetry_h": symmetry_h,
        "dominant_channel": dominant_channel,
        "saturation_mean": saturation_mean, "saturation_std": saturation_std,
        "dark_pixel_frac": dark_pixel_frac, "bright_pixel_frac": bright_pixel_frac,
    }
