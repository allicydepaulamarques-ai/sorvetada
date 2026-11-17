"""Recorta personagens/vilões em sprites 64x64 transparentes.
Execute: python prepare_assets.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent
ASSETS = ROOT / "assets"
OUT = ASSETS / "sprites"
OUT.mkdir(parents=True, exist_ok=True)

def split(source_name, prefix, cols, rows, backgrounds):
    source = ASSETS / source_name
    if not source.exists():
        print(f"Aviso: {source.name} não encontrado; use o jogo com os desenhos de fallback.")
        return
    image = Image.open(source).convert("RGBA")
    tile_w, tile_h = image.width // cols, image.height // rows
    for y in range(rows):
        for x in range(cols):
            box = (x * tile_w, y * tile_h, (x + 1) * tile_w, (y + 1) * tile_h)
            sprite = image.crop(box).resize((64, 64), Image.Resampling.NEAREST)
            pixels = sprite.load()
            for py in range(sprite.height):
                for px in range(sprite.width):
                    r, g, b, a = pixels[px, py]
                    if any(abs(r-bg[0])+abs(g-bg[1])+abs(b-bg[2]) < 25 for bg in backgrounds):
                        pixels[px, py] = (0, 0, 0, 0)
            index = y * cols + x
            sprite.save(OUT / f"{prefix}_{index}.png")

split("personagens.png", "player", 5, 2, [(255,255,255)])
split("viloes.png", "enemy", 6, 1, [(20,40,80),(20,35,75)])
print("Sprites preparados em assets/sprites/")
