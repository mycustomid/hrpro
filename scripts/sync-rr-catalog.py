#!/usr/bin/env python3
import io
import json
import re
import shutil
import sys
import tempfile
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
REPORT_FILE = ROOT / "docs" / "rr-sync-report.txt"

CATEGORY_MAP = {
    "SOFA VIP": "Sofa",
    "MEJA": "Meja",
    "KURSI": "Kursi",
    "PERLENGKAPAN": "Perlengkapan",
}
IMAGE_BLACKLIST = ("logo", "banner", "icon", "whatsapp", "instagram", "youtube", "member-of", "cropped-")
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; HRProductionCatalogSync/1.0)"}
REPORT = []

def log(message):
    print(message)
    REPORT.append(str(message))

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
    node = heading
    for _ in range(10):
        node = node.parent
        if not node:
            break
        headings = node.find_all("h4")
        imgs = [img for img in node.find_all("img") if valid_img(img)]
        if len(headings) == 1 and imgs:
            return imgs[0]

    prev = heading.previous_element
    for _ in range(220):
        if prev is None:
            break
        if getattr(prev, "name", None) in ("h4", "h2"):
            break
        if getattr(prev, "name", None) == "img" and valid_img(prev):
            return prev
        prev = prev.previous_element

    nxt = heading.next_element
    for _ in range(220):
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
        tags += ["VIP", "BUMN"]
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
    image.save(dest, "WEBP", quality=84, method=6)

def main():
    session = requests.Session()
    response = session.get(SOURCE_URL, headers=HEADERS, timeout=45)
    log(f"catalog_http={response.status_code}")
    log(f"catalog_bytes={len(response.content)}")
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    log(f"h2_count={len(soup.find_all('h2'))}")
    log(f"h4_count={len(soup.find_all('h4'))}")
    log(f"img_count={len(soup.find_all('img'))}")

    raw = []
    active_category = None
    category_counts = {}
    missing_image = []
    for node in soup.find_all(["h2", "h4"]):
        if node.name == "h2":
            heading_text = clean(node.get_text(" ", strip=True)).upper()
            active_category = CATEGORY_MAP.get(heading_text)
            if active_category:
                log(f"category={heading_text}->{active_category}")
            continue
        if not active_category:
            continue
        name = clean(node.get_text(" ", strip=True))
        if not name or len(name) > 100:
            continue
        img = product_image(node)
        if not img:
            missing_image.append(f"{active_category}:{name}")
            continue
        url = image_url(img)
        if not url:
            missing_image.append(f"{active_category}:{name}")
            continue
        raw.append({
            "name": name,
            "category": active_category,
            "description": product_description(node),
            "sourceImage": url,
        })
        category_counts[active_category] = category_counts.get(active_category, 0) + 1

    log(f"paired_products={len(raw)}")
    log(f"category_counts={json.dumps(category_counts, ensure_ascii=False, sort_keys=True)}")
    log(f"missing_image_count={len(missing_image)}")
    if missing_image:
        log("missing_image_sample=" + " | ".join(missing_image[:20]))

    if len(raw) < 50:
        raise RuntimeError(f"only {len(raw)} product/image pairs found; refusing replacement")

    temp_root = Path(tempfile.mkdtemp(prefix="rr-catalog-"))
    temp_images = temp_root / "products"
    temp_images.mkdir(parents=True, exist_ok=True)

    used = {}
    products = []
    failures = []
    for row in raw:
        base = slugify(row["name"])
        used[base] = used.get(base, 0) + 1
        suffix = "" if used[base] == 1 else f"-{used[base]}"
        slug = f"{base}{suffix}"
        dest = temp_images / f"{slug}.webp"
        try:
            download_webp(session, row["sourceImage"], dest)
        except Exception as exc:
            failures.append(f"{row['name']}::{type(exc).__name__}:{exc}")
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

    log(f"downloaded_products={len(products)}")
    log(f"download_failures={len(failures)}")
    if failures:
        log("download_failure_sample=" + " | ".join(failures[:10]))

    if len(products) < 50:
        raise RuntimeError(f"only {len(products)} product images downloaded; refusing replacement")

    if OUT_DIR.exists():
        shutil.rmtree(OUT_DIR)
    shutil.copytree(temp_images, OUT_DIR)
    DATA_FILE.write_text(json.dumps(products, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    log(f"status=success")
    log(f"synced_products={len(products)}")
    shutil.rmtree(temp_root, ignore_errors=True)

if __name__ == "__main__":
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        main()
    except Exception as exc:
        log("status=failure")
        log(f"error_type={type(exc).__name__}")
        log(f"error={exc}")
        REPORT_FILE.write_text("\n".join(REPORT) + "\n", encoding="utf-8")
        raise
    else:
        REPORT_FILE.write_text("\n".join(REPORT) + "\n", encoding="utf-8")
