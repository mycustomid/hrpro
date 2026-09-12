#!/usr/bin/env python3
import io
import json
import re
import shutil
import unicodedata
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup
from PIL import Image

SOURCE_URL = "https://www.rr-production.com/katalog/"
ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "images" / "products"
DATA_FILE = ROOT / "src" / "data" / "catalog.json"

CATEGORY_MAP = {
    "SOFA VIP": "Sofa",
    "MEJA": "Meja",
    "KURSI": "Kursi",
    "PERLENGKAPAN": "Perlengkapan",
}
IMAGE_BLACKLIST = ("logo", "banner", "icon", "whatsapp", "instagram", "youtube", "member-of", "cropped-")
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; HRProductionCatalogSync/1.0)"}

def clean(value):
    return re.sub(r"\s+", " ", value or "").strip()

def norm(value):
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

def slugify(value):
    return norm(value).replace(" ", "-") or "produk"

def image_url(img):
    for key in ("data-src", "data-lazy-src", "src"):
        value = img.get(key)
        if value and not value.startswith("data:"):
            return urljoin(SOURCE_URL, value)
    srcset = img.get("srcset") or img.get("data-srcset")
    if srcset:
        candidates = [part.strip().split(" ")[0] for part in srcset.split(",") if part.strip()]
        if candidates:
            return urljoin(SOURCE_URL, candidates[-1])
    return None

def valid_img(img):
    url = image_url(img)
    if not url:
        return False
    haystack = norm(" ".join([img.get("alt", ""), img.get("title", ""), url]))
    return not any(token in haystack for token in IMAGE_BLACKLIST)

def product_image(heading):
    # Prefer a local Elementor/card ancestor containing exactly this one product heading.
    node = heading
    for _ in range(8):
        node = node.parent
        if not node:
            break
        headings = node.find_all("h4")
        imgs = [img for img in node.find_all("img") if valid_img(img)]
        if len(headings) == 1 and imgs:
            return imgs[0]

    # Fallback: nearest image before/after the heading, bounded by another product/category heading.
    prev = heading.previous_element
    for _ in range(120):
        if prev is None:
            break
        if getattr(prev, "name", None) in ("h4", "h2"):
            break
        if getattr(prev, "name", None) == "img" and valid_img(prev):
            return prev
        prev = prev.previous_element

    nxt = heading.next_element
    for _ in range(160):
        if nxt is None:
            break
        if getattr(nxt, "name", None) in ("h4", "h2"):
            break
        if getattr(nxt, "name", None) == "img" and valid_img(nxt):
            return nxt
        nxt = nxt.next_element
    return None

def product_description(heading):
    parts = []
    node = heading.find_next()
    while node:
        if getattr(node, "name", None) in ("h4", "h2"):
            break
        if getattr(node, "name", None) in ("h5", "h6", "p"):
            text = clean(node.get_text(" ", strip=True))
            if text and text not in parts and len(text) < 600:
                parts.append(text)
        node = node.find_next()
    # Keep specifications concise; do not copy sales CTA/contact text.
    blocked = ("sewa ", "hubungi", "whatsapp", "admin ")
    safe = [p for p in parts if not any(b in p.lower() for b in blocked)]
    return " · ".join(safe[:8])[:900]

def tags_for(category, name):
    text = norm(name)
    tags = []
    if category == "Sofa":
        tags += ["VIP", "Wedding", "Gala Dinner"]
    elif category == "Meja":
        tags += ["Konferensi", "Wedding"]
    elif category == "Kursi":
        tags += ["Konferensi", "Wedding"]
    else:
        tags += ["Konferensi"]
    if any(x in text for x in ("vip", "podium", "gong", "rope stand", "garuda")):
        tags.append("VIP")
        tags.append("BUMN")
    if any(x in text for x in ("tenda", "misty", "parasol", "traffic", "cone", "outdoor")):
        tags.append("Outdoor")
    return list(dict.fromkeys(tags))

def download_webp(session, url, dest):
    response = session.get(url, headers=HEADERS, timeout=45)
    response.raise_for_status()
    image = Image.open(io.BytesIO(response.content))
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "transparency" in image.info else "RGB")
    image.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
    if image.mode == "RGBA":
        bg = Image.new("RGBA", image.size, (255, 255, 255, 0))
        bg.alpha_composite(image)
        image = bg
    image.save(dest, "WEBP", quality=84, method=6)

def main():
    session = requests.Session()
    response = session.get(SOURCE_URL, headers=HEADERS, timeout=45)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")

    raw = []
    active_category = None
    for node in soup.find_all(["h2", "h4"]):
        if node.name == "h2":
            active_category = CATEGORY_MAP.get(clean(node.get_text(" ", strip=True)).upper())
            continue
        if not active_category:
            continue
        name = clean(node.get_text(" ", strip=True))
        if not name or len(name) > 100:
            continue
        img = product_image(node)
        if not img:
            print(f"SKIP no image: {active_category} / {name}")
            continue
        url = image_url(img)
        if not url:
            continue
        raw.append({
            "name": name,
            "category": active_category,
            "description": product_description(node),
            "sourceImage": url,
        })

    if len(raw) < 50:
        raise SystemExit(f"Refusing sync: only {len(raw)} product/image pairs found")

    # Rebuild from scratch. No old product assets survive.
    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    used = {}
    products = []
    for row in raw:
        base = slugify(row["name"])
        used[base] = used.get(base, 0) + 1
        suffix = "" if used[base] == 1 else f"-{used[base]}"
        slug = f"{base}{suffix}"
        dest = OUT_DIR / f"{slug}.webp"
        try:
            download_webp(session, row["sourceImage"], dest)
        except Exception as exc:
            print(f"SKIP image download: {row['name']} -> {exc}")
            continue
        products.append({
            "name": row["name"],
            "description": row["description"],
            "price": None,
            "category": row["category"],
            "image": f"/images/products/{slug}.webp",
            "tags": tags_for(row["category"], row["name"]),
            "status": "Konfirmasi ketersediaan",
            "source": "RR Production",
            "sourcePage": SOURCE_URL,
        })

    if len(products) < 50:
        raise SystemExit(f"Refusing sync: only {len(products)} images downloaded")

    DATA_FILE.write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Synced {len(products)} RR Production products with local WebP assets.")

if __name__ == "__main__":
    main()
