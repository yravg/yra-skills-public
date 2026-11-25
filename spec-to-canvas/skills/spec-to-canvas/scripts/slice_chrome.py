#!/usr/bin/env python3
"""Cut a 1600x900 app screenshot into top, rail and status strips.

    python slice_chrome.py shot.png out_dir --top 178 --rail 25 --status 22 [--name assist]

Measure the three numbers from the DOM (page body bounding box), not by eye.
Needs Pillow. Without arguments it runs a self-check.
"""
import argparse
import os
import sys


def crop_boxes(width, height, top, rail, status):
    if not (0 < top < height and 0 < rail < width and 0 <= status < height - top):
        raise ValueError(f"crop lines do not fit a {width}x{height} image: top={top} rail={rail} status={status}")
    return {
        "top": (0, 0, width, top),
        "rail": (0, top, rail, height - status),
        "status": (0, height - status, width, height),
    }


def main():
    from PIL import Image
    p = argparse.ArgumentParser()
    p.add_argument("shot")
    p.add_argument("out")
    p.add_argument("--top", type=int, required=True)
    p.add_argument("--rail", type=int, required=True)
    p.add_argument("--status", type=int, required=True)
    p.add_argument("--name", default="")
    a = p.parse_args()
    img = Image.open(a.shot).convert("RGB")
    os.makedirs(a.out, exist_ok=True)
    for part, box in crop_boxes(*img.size, a.top, a.rail, a.status).items():
        name = f"{part}_{a.name}.png" if a.name else f"{part}.png"
        img.crop(box).save(os.path.join(a.out, name), optimize=True)
        print(name, box[2] - box[0], "x", box[3] - box[1])


if __name__ == "__main__":
    if len(sys.argv) == 1:
        b = crop_boxes(1600, 900, 178, 25, 22)
        assert b["rail"] == (0, 178, 25, 878) and b["status"] == (0, 878, 1600, 900)
        try:
            crop_boxes(1600, 900, 950, 25, 22)
            raise AssertionError("bad crop accepted")
        except ValueError:
            print("slice_chrome self-check passed")
    else:
        main()
