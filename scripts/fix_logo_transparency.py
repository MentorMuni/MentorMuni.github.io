#!/usr/bin/env python3
"""
Create a truly transparent logo PNG from one with baked-in checkerboard.
Removes only checkerboard colors (sampled from corners), crops tightly.
"""
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Need Pillow: pip install Pillow")
    sys.exit(1)

def get_checkerboard_colors(img, corner_size=20):
    """Sample corners to find the two checkerboard grey values."""
    w, h = img.size
    colors = set()
    for cx, cy in [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]:
        for dx in range(min(corner_size, w//4)):
            for dy in range(min(corner_size, h//4)):
                x = min(max(cx + dx, 0), w-1)
                y = min(max(cy + dy, 0), h-1)
                p = img.getpixel((x, y))
                if len(p) == 4:
                    p = p[:3]
                # Grey: R≈G≈B
                if max(p) - min(p) < 30:
                    colors.add(p)
    return list(colors)

def color_distance(c1, c2):
    return sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])) ** 0.5

def is_checkerboard_color(pixel, checker_colors, max_dist=40):
    """True if pixel matches one of the checkerboard greys."""
    if len(pixel) == 3:
        p = pixel
    else:
        p = pixel[:3]
    for cc in checker_colors:
        if color_distance(p, cc) <= max_dist:
            return True
    return False

def make_transparent(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    
    # Get checkerboard colors from corners (only grey pixels)
    checker_colors = get_checkerboard_colors(img)
    
    # If we didn't find clear checkerboard, fall back to common greys
    if not checker_colors:
        checker_colors = [(192,192,192), (128,128,128), (224,224,224), (204,204,204)]
    
    data = img.getdata()
    new_data = []
    for pixel in data:
        if is_checkerboard_color(pixel, checker_colors):
            new_data.append((0, 0, 0, 0))
        else:
            r, g, b = pixel[:3]
            a = pixel[3] if len(pixel) == 4 else 255
            new_data.append((r, g, b, a))
    
    img.putdata(new_data)
    
    # Crop to non-transparent content
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    
    img.save(output_path, "PNG", optimize=True)
    print(f"Saved: {output_path}")

if __name__ == "__main__":
    base = Path(__file__).parent.parent
    src = base / "assets" / "logo.png"
    if not src.exists():
        print(f"Not found: {src}")
        sys.exit(1)
    make_transparent(src, base / "assets" / "logo.png")
