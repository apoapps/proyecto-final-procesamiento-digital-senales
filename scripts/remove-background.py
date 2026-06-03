#!/usr/bin/env python3
"""Remove or replace a chroma-key background with Pillow.

Example:
  python3 scripts/remove-background.py fixtures/chroma-green-demo.png dist/sin-fondo.png --key '#00ff00'
  python3 scripts/remove-background.py fixtures/chroma-green-demo.png dist/fondo-blanco.jpg --key '#00ff00' --mode replace --background '#ffffff'
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path


def parse_hex_color(value: str) -> tuple[int, int, int]:
    normalized = value.strip().lstrip("#")
    if len(normalized) != 6:
        raise argparse.ArgumentTypeError("Use a 6 digit hex color, for example #00ff00.")
    try:
        parsed = int(normalized, 16)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("Use a valid hex color, for example #00ff00.") from exc
    return (parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    r_mean = (a[0] + b[0]) / 2
    delta_r = a[0] - b[0]
    delta_g = a[1] - b[1]
    delta_b = a[2] - b[2]
    return math.sqrt((2 + r_mean / 256) * delta_r * delta_r + 4 * delta_g * delta_g + (2 + (255 - r_mean) / 256) * delta_b * delta_b)


def main() -> int:
    parser = argparse.ArgumentParser(description="Remove or replace a green/blue chroma-key background.")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--key", type=parse_hex_color, default=parse_hex_color("#00ff00"), help="Chroma color in #RRGGBB format.")
    parser.add_argument("--mode", choices=["transparent", "replace"], default="transparent")
    parser.add_argument("--background", type=parse_hex_color, default=parse_hex_color("#ffffff"), help="Replacement color used with --mode replace.")
    parser.add_argument("--transparent-threshold", type=float, default=58.0)
    parser.add_argument("--opaque-threshold", type=float, default=92.0)
    args = parser.parse_args()

    try:
        from PIL import Image
    except ImportError as exc:
        raise SystemExit("Pillow is required. Install it with: python3 -m pip install Pillow") from exc

    image = Image.open(args.input).convert("RGBA")
    pixels = image.load()
    width, height = image.size
    key = args.key
    background = args.background
    soft_range = max(1.0, args.opaque_threshold - args.transparent_threshold)

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            distance = color_distance((r, g, b), key)
            if distance < args.transparent_threshold:
                if args.mode == "replace":
                    pixels[x, y] = (*background, 255)
                else:
                    pixels[x, y] = (r, g, b, 0)
            elif distance < args.opaque_threshold:
                keep = (distance - args.transparent_threshold) / soft_range
                if args.mode == "replace":
                    mixed = tuple(round(background[index] * (1 - keep) + (r, g, b)[index] * keep) for index in range(3))
                    pixels[x, y] = (*mixed, 255)
                else:
                    pixels[x, y] = (r, g, b, min(a, round(keep * 255)))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    if args.output.suffix.lower() in {".jpg", ".jpeg"}:
        image = image.convert("RGB")
    image.save(args.output)
    print(args.output)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
