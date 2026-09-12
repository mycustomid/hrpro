#!/usr/bin/env python3
import io
import json
import re
import shutil
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
IMAGE_EXT_RE = re.compile(r"\.(?:jpe?g|png|webp)(?:\?.*)?$", re.I)
IMAGE_BLACKLIST = ("logo", "banner", "icon", "whatsapp", "instagram", "youtube", "member-of", "cropped-")
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; HRProductionCatalogSync/1.2)"}
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

def safe_media_url(raw, base_url):
    raw = clean(str(raw or "").strip("'\"")).replace("\\/", "/")
    if not raw or raw.startswith("data:"):
        return None
    url = urljoin(base_url, raw)
    haystack = norm(url)
    if any(token in haystack for token in IMAGE_BLACKLIST):
        return None
    if not IMAGE_EXT_RE.search(url):
        return None
    return url

def inline_img_url(img):
    for key in ("data-src", "data-lazy-src", "src"):
        url = safe_media_url(img.get(key), SOURCE_URL)
        if url:
            return url
    srcset = img.get("srcset") or img.get("data-srcset")
    if srcset:
        candidates = [part.strip().split(" ")[0] for part in srcset.split(",") if part.strip()]
        for candidate in reversed(candidates):
            url = safe_media_url(candidate, SOURCE_URL)
            if url:
                return url
    return None

def build_elementor_css_map(session, soup):
    css_links = []
    for link in soup.find_all("link", href=True):
        rel = " ".join(link.get("rel") or [])
        href = link.get("href")
        if "stylesheet" not in rel.lower() or not href:
            continue
        absolute = urljoin(SOURCE_URL, href)
        if absolute not in css_links:
            css_links.append(absolute)

    log(f"stylesheet_count={len(css_links)}")
    mapping = {}
    fetched = 0
    blocks_with_media = 0

    for css_url in css_links:
        try:
            response = session.get(css_url, headers=HEADERS, timeout=25)
            if response.status_code != 200:
                continue
        except Exception:
            continue
        fetched += 1
        css = response.text
        for block in css.split("}"):
            if "elementor-element-" not in block or "url(" not in block:
                continue
            ids = re.findall(r"elementor-element-([a-zA-Z0-9]+)", block)
            raw_urls = re.findall(r"url\(([^)]+)\)", block, flags=re.I)
            urls = []
            for raw in raw_urls:
                url = safe_media_url(raw, css_url)
                if url and url not in urls:
                    urls.append(url)
            if not ids or not urls:
                continue
            blocks_with_media += 1
            for element_id in ids:
                bucket = mapping.setdefault(element_id, [])
                for url in urls:
                    if url not in bucket:
                        bucket.append(url)

    log(f"stylesheet_fetched={fetched}")
    log(f"css_blocks_with_media={blocks_with_media}")
    log(f"elementor_media_map={len(mapping)}")
    if mapping:
        sample = []
        for key, urls in list(mapping.items())[:12]:
            sample.append(f"{key}=>{urls[0]}")
        log("css_map_sample=" + " | ".join(sample))
    return mapping

def element_ids(node):
    ids = []
    for element in [node, *node.find_all(True)]:
        for cls in element.get("class") or []:
            match = re.fullmatch(r"elementor-element-([a-zA-Z0-9]+)", cls)
            if match:
                ids.append(match.group(1))
    return list(dict.fromkeys(ids))

def product_media_url(heading, css_map):
    # Product art on RR is mainly an Elementor background in a sibling/ancestor card.
    node = heading
    for _ in range(12):
        node = node.parent
        if not node:
            break
        headings = node.find_all("h4")
        if len(headings) == 1:
            for element_id in element_ids(node):
                urls = css_map.get(element_id)
                if urls:
                    return urls[0]
            for img in node.find_all("img"):
                url = inline_img_url(img)
                if url:
                    return url

    # If visual/text columns are separated, inspect sibling blocks of progressively wider ancestors.
    node = heading
    for _ in range(8):
        node = node.parent
        if not node:
            break
        siblings = [s for s in (node.previous_sibling, node.next_sibling) if getattr(s, "find_all", None)]
        for sibling in siblings:
            for element_id in element_ids(sibling):
                urls = css_map.get(element_id)
                if urls:
                    return urls[0]
            for img in sibling.find_all("img"):
                url = inline_img_url(img)
                if url:
                    return url

    # Last fallback: nearest previous/next Elementor element with media.
    for direction in ("previous", "next"):
        current = heading
        for _ in range(80):
            current = current.find_previous(True) if direction == "previous" else current.find_next(True)
            if current is None:
                break
            if current.name in ("h4", "h2") and current is not heading:
                break
            for cls in current.get("class") or []:
                match = re.fullmatch(r"elementor-element-([a-zA-Z0-9]+)", cls)
                if match and css_map.get(match.group(1)):
                    return css_map[match.group(1)][0]
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
    response = session.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    image = Image.open(io.BytesIO(response.content))
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA" if "transparency" in image.info else "RGB")
    image.thumbnail((1400, 1400), Image.Resampling.LANCZOS)
    image.save(dest, "WEBP", quality=84, method=6)

def main():
    session = requests.Session()
    response = session.get(SOURCE_URL, headers=HEADERS, timeout=35)
    log(f"catalog_http={response.status_code}")
    log(f"catalog_bytes={len(response.content)}")
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    log(f"h2_count={len(soup.find_all('h2'))}")
    log(f"h4_count={len(soup.find_all('h4'))}")
    log(f"img_count={len(soup.find_all('img'))}")

    css_map = build_elementor_css_map(session, soup)

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
        url = product_media_url(node, css_map)
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
    if raw:
        log("pair_sample=" + " | ".join(f"{row['name']}=>{row['sourceImage']}" for row in raw[:10]))

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
    log("status=success")
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
