#!/usr/bin/env python3
"""Sync relevant Serbian news into the Serbia Latina WordPress backend.

The importer is idempotent:
- one WordPress post per source article URL
- post slug: <source-prefix>-<source-slug>
- existing posts are skipped (no re-processing)

Articles are filtered for relevance to the Latin American community in Serbia
using keyword matching on titles and excerpts (Serbian + Spanish terms).

Usage:
  python3 scripts/sync_serbian_news.py --dry-run --limit 10
  python3 scripts/sync_serbian_news.py --limit 30
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import html as html_mod
import json
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable

USER_AGENT = "SerbiaLatina2-NewsSync/1.0 (+https://serbialatina.com)"
DEFAULT_CATEGORY_SLUG = "noticias"
DEFAULT_CATEGORY_NAME = "Noticias"
PROCESSED_FILE = Path(__file__).resolve().parent / ".processed_news_urls.json"

# ── RSS Sources ──────────────────────────────────────────────────────────────
RSS_FEEDS: list[dict] = [
    {
        "name": "N1",
        "url": "https://n1info.rs/feed/",
        "prefix": "n1",
        "item_tag": "item",
        "title_tag": "title",
        "link_tag": "link",
        "desc_tag": "description",
        "date_tag": "pubDate",
        "image_from": "media_content",  # media:content url attr
    },
    {
        "name": "Danas",
        "url": "https://www.danas.rs/feed/",
        "prefix": "danas",
        "item_tag": "item",
        "title_tag": "title",
        "link_tag": "link",
        "desc_tag": "description",
        "date_tag": "pubDate",
        "image_from": "description_img",  # extract first <img> from description
    },
    {
        "name": "Nova",
        "url": "https://nova.rs/feed/",
        "prefix": "nova",
        "item_tag": "item",
        "title_tag": "title",
        "link_tag": "link",
        "desc_tag": "description",
        "date_tag": "pubDate",
        "image_from": "media_content",
    },
    {
        "name": "Kurir",
        "url": "https://www.kurir.rs/rss",
        "prefix": "kurir",
        "item_tag": "item",
        "title_tag": "title",
        "link_tag": "link",
        "desc_tag": "description",
        "date_tag": "pubDate",
        "image_from": "enclosure",
    },
    {
        "name": "Blic",
        "url": "https://www.blic.rs/rss/feed",
        "prefix": "blic",
        "item_tag": "item",
        "title_tag": "title",
        "link_tag": "link",
        "desc_tag": "description",
        "date_tag": "pubDate",
        "image_from": "content_encoded_img",
    },
    {
        "name": "MojNoviSad",
        "url": "https://www.mojnovisad.com/sve-vesti/",
        "prefix": "mojnovisad",
        "type": "html_listing",  # scrape listing page, no RSS
        "detail_selector": "div.single-blog__content",
        "image_selector": "div.single-blog__featured img",
    },
]

# ── Relevance keywords ──────────────────────────────────────────────────────
# Serbian/Latin-script terms indicating relevance to the Latin American
# community in Serbia. Article title + excerpt are scanned case-insensitively.
RELEVANCE_KEYWORDS: list[str] = [
    # Latinoamérica / comunidad latina
    "latinoamerik", "latinoamerič", "latinska amerika", "latinos",
    "latino zajednic", "hispano",
    # Países latinoamericanos
    "kub", "kuba", "kuban", "havana",
    "venecuel", "karakas",
    "kolumbij", "bogota",
    "meksik", "meksikan", "meksiko siti",
    "brazil", "brazilsk", "brazilij",
    "argentin", "buenos ajres",
    "peru", "peruan", "lima",
    "čile", "čilean", "santjago",
    "ekvador", "kito",
    "bolivij", "la paz",
    "urugvaj", "montevideo",
    "paragvaj", "asunsion",
    "dominikansk", "portorik",
    "kostarik", "panam",
    "gvatemal", "honduras", "salvador", "nikaragv",
    # Migración / extranjería
    "migrant", "migracij", "migracion", "izbeglic",
    "azil", "azilant",
    "stranc", "stranim", "stranog",
    "boravišn", "boravak", "boravka",
    "viza", "vize", "vizni", "viznog",
    "dozvola", "odobrenje",
    "državljanstv", "pasoš",
    "ambasad", "konzulat",
    # Idioma / cultura
    "španski jezik", "španskog jezika", "španski", "španskog",
    "španska kultura", "latino muzik", "salsa", "regaton",
    # Comunidad específica en Serbia
    "latinos u srbiji", "latinosi srbija",
    "kubanci u srbiji", "kubanci srbija",
    "latinoamerikanci u srbiji",
    # Eventos culturales latinos
    "latino fest", "latino žurk", "latino več",
    "hispano dan", "dan hispano",
    # Protestas / seguridad (interés para la comunidad extranjera)
    "protest", "demonstracij", "manifestacij",
    "štrajk", "blokad", "okup",
    # Policía / orden público (solo cuando hay incidentes serios)
    "policij", "policijsk", "mup",
    "interventn", "žandarmerij",
    "vanredno stanje", "vanredna situacij",
    "incident",
    # Cambios legales / leyes que afectan a extranjeros
    "izmena zakona", "predlog zakona", "novi zakon",
    "usvojen zakon", "zakon o", "zakonski",
    "propis", "uredb", "pravilnik",
    "strani državljan", "stranih državljan",
    "boravišna dozvol", "radna dozvol", "radnu dozvol",
    "privremeni boravak", "stalni boravak",
    "državljanstvo", "naturalizacij",
]


# ── Negative patterns (known false positives to exclude) ────────────────────
# If any of these match the article text, it is discarded even if a positive
# keyword matched. Cleaned (ASCII-fied) text is used for matching.
NEGATIVE_PATTERNS: list[str] = [
    "salvador dali",       # Salvador Dalí, not El Salvador
    "salvadora dali",      # genitive form
    "limač",               # "Liman" neighborhood in Novi Sad, not Lima Peru
    "limanc",              # plural/declined: Limanci, Limanaca
    "novosadski liman",    # explicit Liman reference
    # Traffic/speeding incidents (not community-relevant)
    "divljao",             # "drove wildly" — speeding/traffic
    "preticao preko pune", # overtaking across solid line
    "km na sat",           # km/h — speeding context
]


@dataclass
class NewsItem:
    source_name: str
    source_prefix: str
    title: str
    link: str
    description: str
    pub_date: str
    image_url: str
    source_slug: str = ""
    guid: str = ""

    def __post_init__(self):
        if not self.source_slug:
            self.source_slug = source_slug_from_url(self.link)
        if not self.guid:
            self.guid = self.link


@dataclass
class TranslatedItem(NewsItem):
    title_es: str = ""
    excerpt_es: str = ""
    relevance_score: int = 0
    matched_keywords: list[str] = field(default_factory=list)
    full_body_es: str = ""
    instagram_urls: list[str] = field(default_factory=list)
    youtube_urls: list[str] = field(default_factory=list)


# ── XML / RSS helpers ───────────────────────────────────────────────────────


def _ns_strip(tag: str) -> str:
    """Remove namespace from XML tag, e.g. {http://...}title -> title."""
    return tag.split("}", 1)[-1] if "}" in tag else tag


def _text(el: ET.Element | None) -> str:
    if el is None:
        return ""
    return (el.text or "").strip()


def _cdata_text(el: ET.Element | None) -> str:
    """Get text from an element, handling CDATA."""
    if el is None:
        return ""
    text = el.text or ""
    # Some feed generators put CDATA in .text directly
    return text.strip()


def _find_img_in_html(html_text: str) -> str:
    """Extract first img src from an HTML snippet."""
    m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html_text, re.I)
    return m.group(1) if m else ""


def _extract_image(item: ET.Element, feed_config: dict) -> str:
    """Extract image URL from an RSS item based on feed config."""
    strategy = feed_config.get("image_from", "")

    if strategy == "media_content":
        # Look for media:content element (namespace http://search.yahoo.com/mrss/)
        for child in item:
            tag = _ns_strip(child.tag)
            if tag == "content" and ("mrss" in child.tag.lower() or "media" in child.tag.lower()):
                url = child.attrib.get("url", "")
                if url:
                    return url
        return ""

    if strategy == "description_img":
        desc_el = _find_child(item, feed_config.get("desc_tag", "description"))
        return _find_img_in_html(_cdata_text(desc_el))

    if strategy == "enclosure":
        enc = _find_child(item, "enclosure")
        if enc is not None:
            return enc.attrib.get("url", "")
        return ""

    if strategy == "content_encoded_img":
        for child in item:
            if "encoded" in child.tag:
                return _find_img_in_html(_cdata_text(child))
        return ""

    return ""


def _find_child(parent: ET.Element, tag: str) -> ET.Element | None:
    """Find first child element matching tag (namespace-stripped)."""
    for child in parent:
        if _ns_strip(child.tag) == tag:
            return child
    return None


def _find_all_children(parent: ET.Element, tag: str) -> list[ET.Element]:
    """Find all child elements matching tag."""
    return [c for c in parent if _ns_strip(c.tag) == tag]


def source_slug_from_url(url: str) -> str:
    """Extract a stable short slug from a URL path."""
    path = urllib.parse.urlparse(url).path.strip("/")
    parts = [p for p in path.split("/") if p and len(p) > 1]
    # Take last meaningful segment, remove trailing slashes/dots
    slug = parts[-1] if parts else "article"
    # Remove common extensions
    slug = re.sub(r"\.(html?|php|aspx?)$", "", slug)
    # Truncate to reasonable length
    if len(slug) > 80:
        slug = slug[:80]
    return slug or hashlib.md5(url.encode()).hexdigest()[:12]


def fetch_html_listing(feed_config: dict, limit: int) -> list[NewsItem]:
    """Scrape Moj Novi Sad news listing page for article links."""
    listing_url = feed_config["url"]
    base = f"https://{urllib.parse.urlparse(listing_url).netloc}"

    # Fetch listing page
    req = urllib.request.Request(
        listing_url,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html"},
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        html_text = response.read().decode("utf-8", errors="replace")

    # Extract article links: Moj Novi Sad has direct article URLs like /some-slug/
    # Look for links to articles (not categories, not navigator, not admin)
    seen: set[str] = set()
    items: list[NewsItem] = []

    for m in re.finditer(
        r'<a[^>]+href="(https://www\.mojnovisad\.com/(?!category/|navigator|wp-content|wp-json|tag/|author/|feed|desavanja|megafon-cat|megafon/)[^"]+)"[^>]*>([^<]+)</a>',
        html_text,
        re.I,
    ):
        url = m.group(1)
        title = html_mod.unescape(m.group(2)).strip()
        # Skip short/non-article links and duplicates
        if len(title) < 15 or url in seen:
            continue
        # Skip pagination, homepage, etc.
        path = urllib.parse.urlparse(url).path.strip("/")
        if not path or path in ("sve-vesti", "novi-sad", "vesti"):
            continue
        seen.add(url)
        items.append(
            NewsItem(
                source_name=feed_config["name"],
                source_prefix=feed_config["prefix"],
                title=title,
                link=url,
                description="",
                pub_date="",
                image_url="",
                source_slug=source_slug_from_url(url),
            )
        )
        if len(items) >= limit:
            break

    # For each article, fetch detail for image + description
    for item in items:
        try:
            body, ig, yt = fetch_article_body(item.source_name, item.link)
            # Re-extract with more detail: get image and first paragraph
            detail_req = urllib.request.Request(
                item.link,
                headers={"User-Agent": USER_AGENT, "Accept": "text/html"},
            )
            with urllib.request.urlopen(detail_req, timeout=30) as resp:
                detail_html = resp.read().decode("utf-8", errors="replace")

            # Image from single-blog__featured
            img_m = re.search(
                r'<div[^>]+class="[^"]*single-blog__featured[^"]*"[^>]*>.*?<img[^>]+src="([^"]+)"',
                detail_html, re.I | re.DOTALL
            )
            if img_m:
                item.image_url = img_m.group(1)

            # Description from first paragraph in content
            content_m = re.search(
                r'<div[^>]+class="[^"]*single-blog__content[^"]*"[^>]*>(.*?)</div>\s*<div[^>]+class="[^"]*single-blog__tags',
                detail_html, re.I | re.DOTALL
            )
            if content_m:
                desc_html = content_m.group(1)
                desc_text = re.sub(r"<[^>]+>", " ", desc_html)
                desc_text = re.sub(r"\s+", " ", desc_text).strip()
                item.description = desc_text[:500]
        except Exception:
            pass

    return items


# ── RSS Fetching ────────────────────────────────────────────────────────────


def fetch_rss_feed(feed_config: dict) -> list[NewsItem]:
    """Fetch and parse an RSS feed, returning NewsItems."""
    url = feed_config["url"]
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/rss+xml, application/xml, text/xml, */*",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read()

    # Some feeds have encoding issues — try multiple approaches
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        try:
            text = raw.decode("latin-1")
        except UnicodeDecodeError:
            text = raw.decode("utf-8", errors="replace")

    # Clean common XML issues
    text = re.sub(r"&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)", "&amp;", text)

    try:
        root = ET.fromstring(text)
    except ET.ParseError as exc:
        print(
            json.dumps(
                {"source": feed_config["name"], "error": f"XML parse error: {exc}"},
                ensure_ascii=False,
            ),
            file=sys.stderr,
        )
        return []

    # Find channel items (handle both RSS 2.0 and Atom-like structures)
    items: list[NewsItem] = []
    channel = root.find("channel")
    if channel is None:
        # Maybe Atom or raw items
        item_elements = root.findall(f".//{feed_config['item_tag']}")
        if not item_elements:
            item_elements = root.findall(f".//item")
    else:
        item_elements = channel.findall(feed_config["item_tag"])
        if not item_elements:
            item_elements = channel.findall("item")

    for item_el in item_elements:
        title_el = _find_child(item_el, feed_config["title_tag"])
        link_el = _find_child(item_el, feed_config["link_tag"])
        desc_el = _find_child(item_el, feed_config["desc_tag"])
        date_el = _find_child(item_el, feed_config["date_tag"])

        title = _cdata_text(title_el)
        link = _cdata_text(link_el) or item_el.findtext("link", "")
        # If link is empty, check atom:link href
        if not link:
            for child in item_el:
                if "link" in child.tag.lower():
                    link = child.attrib.get("href", "")
                    if link:
                        break

        description = _cdata_text(desc_el)
        # Strip HTML from description for cleaner display
        desc_plain = re.sub(r"<[^>]+>", " ", description).strip()
        desc_plain = re.sub(r"\s+", " ", desc_plain)

        pub_date = _cdata_text(date_el)
        image_url = _extract_image(item_el, feed_config)

        if not title or not link:
            continue

        items.append(
            NewsItem(
                source_name=feed_config["name"],
                source_prefix=feed_config["prefix"],
                title=title.strip(),
                link=link.strip(),
                description=desc_plain[:500],
                pub_date=pub_date,
                image_url=image_url,
            )
        )

    return items


# ── Relevance scoring ───────────────────────────────────────────────────────


def is_relevant(item: NewsItem) -> tuple[bool, int, list[str]]:
    """Check if a news item is relevant to the Latin American community.
    
    Returns (is_relevant, score, matched_keywords).
    Uses word-boundary matching to avoid false positives from substrings.
    """
    text = (item.title + " " + item.description).lower()
    score = 0
    matched: list[str] = []

    # Clean text for matching: convert Serbian chars to ASCII
    text_clean = text.replace("č", "c").replace("ć", "c").replace("š", "s")
    text_clean = text_clean.replace("đ", "dj").replace("ž", "z")

    # Check negative patterns first — if any match, discard immediately
    for neg in NEGATIVE_PATTERNS:
        neg_clean = neg.lower().replace("č", "c").replace("ć", "c").replace("š", "s")
        neg_clean = neg_clean.replace("đ", "dj").replace("ž", "z")
        if neg_clean in text_clean:
            return False, 0, []

    for kw in RELEVANCE_KEYWORDS:
        kw_clean = kw.lower().replace("č", "c").replace("ć", "c").replace("š", "s")
        kw_clean = kw_clean.replace("đ", "dj").replace("ž", "z")

        # Use left word-boundary to avoid mid-word false positives
        # (e.g., "kito" inside "Nikitović") but allow Serbian suffixes
        # (e.g., "argentin" → "argentinski", "argentinske")
        # Right side is open so stems match declined/conjugated forms
        pattern = r"(?<![a-z])" + re.escape(kw_clean)
        if re.search(pattern, text_clean):
            weight = min(len(kw.split()), 3)  # max 3 points per keyword
            score += weight
            matched.append(kw)

    # Higher threshold for tabloid sources (more noise)
    threshold = 2 if item.source_name in ("Kurir", "Blic") else 1

    return score >= threshold, score, matched


# ── Full article scraping ────────────────────────────────────────────────────

# Content container selectors per source
CONTENT_SELECTORS: dict[str, str] = {
    "N1": "div.article-content-wrapper",
    "Danas": "div.post-content",
    "Nova": "div.article-content-wrapper",
    "Kurir": "div.article-content",
    "Blic": "div.article__content",
    "MojNoviSad": "div.single-blog__content",
}


# ── Known non-article sub-sections to skip inside content containers ─────
# When a <div> with any of these class substrings is encountered inside the
# article body, the entire subtree is discarded (avoiding related-news widgets,
# banners, tag blocks, comment CTAs, newsletter embeds, etc.)
_SKIP_CONTAINER_CLASSES: tuple[str, ...] = (
    "related-news",         # N1: related-news-block
    "related-posts",        # generic
    "related-articles",     # generic
    "related",              # Blic: article__related, other *related* patterns
    "slicne-vesti",         # Serbian: "similar news"
    "povezane-vesti",       # Serbian: "related news"
    "read-more",            # "read more" widgets
    "procitaj-jos",         # Serbian: "read more"
    "tags-article",         # N1: tags-article-block-wrapper
    "cta-comment",          # N1: cta-comment-wrapper
    "newsletter",           # newsletter signup
    "subscribe",            # subscription prompt
    "banner",               # ad banners
    "midas",                # Ringier ad platform (Blic, Nova, etc.)
    "reklama",              # Serbian: "advertisement"
    "oglas",                # Serbian: "ad"
    "advert",               # English: "advertisement"
    "promo",                # promotional content
    "widget",               # side widgets
    "sidebar",              # sidebars
    "sticky-ad",            # sticky ads
    "article-footer",       # page-turner / related at bottom
    "content-footer",       # footer within content area
    "author-box",           # author bio box
    "recommended",          # recommended articles
    "preporucujemo",        # Serbian: "we recommend"
    "najcitanije",          # Serbian: "most read"
    "najnovije",            # Serbian: "latest"
    "social-share",         # social share buttons
    "share-buttons",        # share buttons
    "article__footer",      # Blic-style footer
    "article_footer",       # alternate
    "community",            # Blic: article__community-groups-blic, article__community-button
    "direct-community",     # Blic: article_direct-community
    "audio-player",         # Blic: audio player widget
    "article__author-image",  # Blic: author photo (not article content)
    "article__author-name",   # Blic: author name line (not article content)
    "wrapperad",              # Blic: page-level adhesion ad (class="wrapperAd")
    "overlay",                # page-level overlay (not article content)
    "contentexchange",        # widget content exchange (nekretnine.rs, etc.)
    "pulsembed",              # Puls embed/widget (Ringier platform)
)


class ContentExtractor(HTMLParser):
    """Extract main article body and Instagram embeds from HTML."""

    def __init__(self, source_name: str):
        super().__init__(convert_charrefs=True)
        self.source_name = source_name
        self.selector = CONTENT_SELECTORS.get(source_name, "")
        self.tag_parts = self.selector.split(".")
        self.target_tag = self.tag_parts[0] if self.tag_parts else ""
        self.target_class = self.tag_parts[1] if len(self.tag_parts) > 1 else ""

        self.in_target = False
        self.target_depth = 0
        self.current_depth = 0
        self._skip_depth: int = -1  # depth at which we started skipping; -1 = not skipping
        self.content_parts: list[str] = []
        self.instagram_urls: list[str] = []
        self.youtube_urls: list[str] = []
        self._skip_tags: set[str] = {"script", "style", "noscript", "iframe"}
        self._in_skip_tag: bool = False  # True when inside a <script>/<style>/etc.
        self._found = False

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        attrs_dict = dict(attrs)
        classes = (attrs_dict.get("class", "") or "").split()

        # Detect Instagram embeds anywhere in the page
        if tag_lower == "blockquote" and "instagram-media" in classes:
            permalink = attrs_dict.get("data-instgrm-permalink", "")
            if permalink:
                self.instagram_urls.append(permalink)
        # Detect Instagram iframes
        if tag_lower == "iframe":
            src = attrs_dict.get("src", "")
            if "instagram.com" in src:
                self.instagram_urls.append(src)
            elif "youtube.com" in src or "youtu.be" in src:
                self.youtube_urls.append(src)
        # Detect YouTube embeds via data-src
        if "data-src" in attrs_dict:
            dsrc = attrs_dict["data-src"]
            if "youtube.com" in dsrc:
                self.youtube_urls.append(dsrc)

        # ── Skip-logic: if already inside a skipped sub-tree, keep counting depth ──
        if self._skip_depth >= 0:
            self.current_depth += 1
            return

        # ── Check if this tag opens a sub-section we should skip entirely ──
        if self.in_target and tag_lower in ("div", "section", "aside", "article"):
            class_str = " ".join(classes).lower()
            id_str = (attrs_dict.get("id", "") or "").lower()
            combined = f"{class_str} {id_str}"
            for skip_cls in _SKIP_CONTAINER_CLASSES:
                if skip_cls in combined:
                    self._skip_depth = self.current_depth
                    self.current_depth += 1
                    return

        # Check if entering target container (substring match on classes)
        if not self._found and tag_lower == self.target_tag:
            class_str = " ".join(classes)
            if self.target_class in class_str:
                self.in_target = True
                self.target_depth = self.current_depth
                self._found = True
                return

        if self.in_target:
            self.current_depth += 1
            if tag_lower in self._skip_tags:
                self._in_skip_tag = True
                return
            attrs_str = ""
            for k, v in attrs:
                v_escaped = html_mod.escape(v or "", quote=True)
                attrs_str += f' {k}="{v_escaped}"'
            if tag_lower in {"br", "img", "hr", "source", "use", "input", "link", "meta", "area", "base", "col", "embed", "track", "wbr"}:
                self.content_parts.append(f"<{tag_lower}{attrs_str} />")
            else:
                self.content_parts.append(f"<{tag_lower}{attrs_str}>")
        else:
            self.current_depth += 1

    def handle_endtag(self, tag):
        tag_lower = tag.lower()

        # ── Skip-logic: if inside a skipped sub-tree ──
        if self._skip_depth >= 0:
            self.current_depth -= 1
            if self.current_depth == self._skip_depth:
                self._skip_depth = -1  # exited the skipped sub-tree
            return

        if self.in_target:
            if self.current_depth == self.target_depth:
                self.in_target = False
                return
            if tag_lower in self._skip_tags:
                self._in_skip_tag = False
            if tag_lower not in self._skip_tags and tag_lower not in {"br", "img", "hr", "source", "use", "input", "link", "meta", "area", "base", "col", "embed", "track", "wbr"}:
                self.content_parts.append(f"</{tag_lower}>")
        self.current_depth -= 1

    def handle_data(self, data):
        if self._skip_depth >= 0:
            return
        if self._in_skip_tag:
            return
        if self.in_target:
            self.content_parts.append(data)

    def get_content(self) -> str:
        return "".join(self.content_parts).strip()


def fetch_article_body(source_name: str, url: str) -> tuple[str, list[str], list[str]]:
    """Fetch full article HTML body from a source URL.
    
    Returns (body_html, instagram_urls, youtube_urls).
    """
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        raw = response.read()

    try:
        html_text = raw.decode("utf-8")
    except UnicodeDecodeError:
        html_text = raw.decode("utf-8", errors="replace")

    extractor = ContentExtractor(source_name)
    try:
        extractor.feed(html_text)
    except Exception:
        pass

    body = extractor.get_content()
    return body, extractor.instagram_urls, extractor.youtube_urls



def _is_ad_image(img_tag: str) -> bool:
    """Return True if an <img> tag looks like an advertisement.
    
    Checks: class name, src domain, and known ad dimensions.
    """
    tag_lower = img_tag.lower()
    
    # ── 1. Check class for ad-related keywords ──
    class_match = re.search(r'class\s*=\s*"([^"]*)"', tag_lower)
    if class_match:
        classes = class_match.group(1).lower()
        ad_class_keywords = (
            "banner", "reklama", "oglas", "advert", "midas",
            "promo", "sponsored", "ad-", "-ad", "_ad", "ad_",
        )
        for kw in ad_class_keywords:
            if kw in classes:
                return True
    
    # ── 2. Check src for ad-serving domains ──
    src_match = re.search(r'src\s*=\s*"([^"]*)"', tag_lower)
    src = src_match.group(1) if src_match else ""
    data_src_match = re.search(r'data-src\s*=\s*"([^"]*)"', tag_lower)
    data_src = data_src_match.group(1) if data_src_match else ""
    combined_src = (src + " " + data_src).lower()
    
    ad_domains = (
        "doubleclick", "googlesyndication", "adnxs", "pubmatic",
        "openx", "rubiconproject", "criteo", "outbrain", "taboola",
        "addthis", "sharethis", "pixel.quantserve", "facebook.com/tr",
        "mc.yandex", "midas-network", "ringieraxelspringer",
    )
    for domain in ad_domains:
        if domain in combined_src:
            return True
    
    # ── 3. Check path in src for ad/banner indicators ──
    ad_path_keywords = ("/banner/", "/ads/", "/ad/", "/reklama/", "/oglas/",
                        "/promo/", "/widget/", "/sponsored/")
    for kw in ad_path_keywords:
        if kw in combined_src:
            return True
    
    # ── 4. Check dimensions for common ad banner sizes ──
    width_match = re.search(r'width\s*=\s*"(\d+)"', tag_lower)
    height_match = re.search(r'height\s*=\s*"(\d+)"', tag_lower)
    if width_match and height_match:
        w, h = int(width_match.group(1)), int(height_match.group(1))
        # Common ad banner sizes
        if (w, h) in (
            (728, 90), (970, 90), (970, 250),  # leaderboard
            (300, 250), (300, 600), (160, 600),  # medium rectangle / skyscraper
            (320, 50), (320, 100),  # mobile banner
            (468, 60),  # banner
            (336, 280),  # large rectangle
        ):
            return True
    
    # ── 5. Src is a known 1x1 tracking pixel ──
    if width_match and height_match:
        w, h = int(width_match.group(1)), int(height_match.group(1))
        if w <= 2 and h <= 2:
            return True
    # Also check style-based dimensions
    style_match = re.search(r'style\s*=\s*"([^"]*)"', tag_lower)
    if style_match:
        style = style_match.group(1).lower()
        if re.search(r'width\s*:\s*[01]px', style) or re.search(r'height\s*:\s*[01]px', style):
            return True
    
    return False


def _strip_html_for_translation(html_body: str) -> tuple[str, list[str], list[str]]:
    """Extract <img> and <a> tags, strip HTML, return clean text for translation.
    
    Returns (clean_text, img_tags, link_tags).
    The img_tags and link_tags are preserved as-is so they can be re-inserted
    after translation without being mangled by Google Translate.
    
    Advertising images are filtered out by class, src domain, and dimensions.
    """
    # Extract all <img> tags
    raw_img_tags: list[str] = re.findall(r'<img\b[^>]*/?>', html_body, re.I)
    # Filter out advertising images
    img_tags: list[str] = [t for t in raw_img_tags if not _is_ad_image(t)]
    # Extract <a> tags (preserve links)
    link_tags: list[str] = re.findall(r'<a\b[^>]*>.*?</a>', html_body, re.I | re.DOTALL)
    
    # Replace img and a tags with placeholders before stripping
    for i, tag in enumerate(img_tags):
        html_body = html_body.replace(tag, f" IMGPLACEHOLDER{i} ", 1)
    for i, tag in enumerate(link_tags):
        html_body = html_body.replace(tag, f" LINKPLACEHOLDER{i} ", 1)
    
    # Strip remaining HTML tags
    clean = re.sub(r'<[^>]+>', ' ', html_body)
    clean = re.sub(r'\s+', ' ', clean).strip()
    
    return clean, img_tags, link_tags


def _reinsert_media_after_translation(
    translated_text: str, img_tags: list[str], link_tags: list[str]
) -> str:
    """Re-insert preserved <img> and <a> tags into translated text.
    
    Placeholders that survived translation are replaced. Any that were dropped
    by the translator are re-inserted at natural break points.
    """
    # Try placeholder replacement first
    result = translated_text
    for i, tag in enumerate(img_tags):
        placeholder = f"IMGPLACEHOLDER{i}"
        if placeholder in result:
            result = result.replace(placeholder, tag)
    
    for i, tag in enumerate(link_tags):
        placeholder = f"LINKPLACEHOLDER{i}"
        if placeholder in result:
            result = result.replace(placeholder, tag)
    
    # Insert any remaining images that the translator dropped,
    # alternating with paragraph breaks
    leftover = [t for i, t in enumerate(img_tags) if f"IMGPLACEHOLDER{i}" not in translated_text]
    leftover_links = [t for i, t in enumerate(link_tags) if f"LINKPLACEHOLDER{i}" not in translated_text]
    
    # If translator dropped images, insert them every 2 paragraphs
    if leftover:
        paragraphs = [p.strip() for p in result.split('\n') if p.strip()]
        rebuilt_parts: list[str] = []
        img_idx = 0
        for pi, p in enumerate(paragraphs):
            rebuilt_parts.append(p)
            if img_idx < len(leftover) and pi > 0 and (pi + 1) % 2 == 0:
                rebuilt_parts.append(leftover[img_idx])
                img_idx += 1
        while img_idx < len(leftover):
            rebuilt_parts.append(leftover[img_idx])
            img_idx += 1
        result = '\n'.join(rebuilt_parts)
    
    # Append leftover links at the end
    if leftover_links:
        result = result.rstrip() + '\n\n' + '\n'.join(leftover_links)
    
    return result


def build_full_post_html(item: "TranslatedItem", full_body_es: str = "") -> str:
    """Build clean WordPress post HTML — title + body + source link."""
    escaped_link = html_mod.escape(item.link, quote=True)
    escaped_source = html_mod.escape(item.source_name)

    # Use full body if available, otherwise excerpt
    body_html = full_body_es if full_body_es else f"<p>{html_mod.escape(item.excerpt_es or item.description)}</p>"

    # Build embed blocks for Instagram/YouTube
    embed_blocks = ""
    for ig_url in item.instagram_urls[:3]:
        embed_blocks += f'\n<!-- wp:embed {{"url":"{html_mod.escape(ig_url, quote=True)}","type":"rich"}} -->\n<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">{html_mod.escape(ig_url)}</div></figure>\n<!-- /wp:embed -->'
    for yt_url in item.youtube_urls[:2]:
        embed_blocks += f'\n<!-- wp:embed {{"url":"{html_mod.escape(yt_url, quote=True)}","type":"video"}} -->\n<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">{html_mod.escape(yt_url)}</div></figure>\n<!-- /wp:embed -->'

    return f"""<!-- wp:html -->
{body_html}
<!-- /wp:html -->

{embed_blocks}

<!-- wp:paragraph -->
<p><em>Fuente: <a href="{escaped_link}" target="_blank" rel="nofollow noopener noreferrer">{escaped_source}</a></em></p>
<!-- /wp:paragraph -->""".strip()


# ── Translation ─────────────────────────────────────────────────────────────


def _read_google_translate_response(data) -> str:
    chunks = data[0] if isinstance(data, list) and data else []
    if not isinstance(chunks, list):
        return ""
    return "".join(
        chunk[0]
        for chunk in chunks
        if isinstance(chunk, list) and chunk and isinstance(chunk[0], str)
    ).replace("\u200b", "").strip()


def translate_text_to_spanish(value: str, max_chars: int = 1800) -> str:
    """Translate text to Spanish using Google Translate."""
    cleaned = re.sub(r"\s+", " ", html_mod.unescape(value or "")).strip()
    if not cleaned:
        return ""
    if len(cleaned) <= 2 or not re.search(r"[A-Za-zÀ-žА-Яа-я]", cleaned):
        return cleaned

    query = urllib.parse.urlencode(
        {
            "client": "gtx",
            "sl": "auto",
            "tl": "es",
            "dt": "t",
            "q": cleaned[:max_chars],
        }
    )
    url = f"https://translate.googleapis.com/translate_a/single?{query}"
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            translated = _read_google_translate_response(
                json.loads(response.read().decode("utf-8"))
            )
            return translated or cleaned
    except Exception:
        return cleaned


# ── Deduplication ───────────────────────────────────────────────────────────


def load_processed_urls() -> set[str]:
    """Load set of already-processed article URLs."""
    if PROCESSED_FILE.exists():
        try:
            data = json.loads(PROCESSED_FILE.read_text())
            return set(data.get("urls", []))
        except (json.JSONDecodeError, KeyError):
            return set()
    return set()


def save_processed_urls(urls: set[str]) -> None:
    """Save processed URLs set."""
    PROCESSED_FILE.parent.mkdir(parents=True, exist_ok=True)
    data = {"urls": sorted(urls), "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    PROCESSED_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2))


def prune_processed_urls(urls: set[str], max_size: int = 5000) -> set[str]:
    """Keep only the most recent entries to prevent unbounded growth."""
    if len(urls) <= max_size:
        return urls
    # Keep the last max_size entries (sorted alphabetically by URL is stable)
    return set(sorted(urls)[-max_size:])


# ── WordPress helpers ───────────────────────────────────────────────────────


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key.strip(), value)


def wp_config() -> tuple[str, str]:
    api = (
        os.environ.get("NEXT_PUBLIC_WORDPRESS_API_URL")
        or "https://admin.segun2idioma.com/wp-json"
    ).rstrip("/")
    username = (os.environ.get("WORDPRESS_API_USERNAME") or "").strip()
    password = re.sub(r"\s+", "", os.environ.get("WORDPRESS_API_PASSWORD") or "")
    if not username or not password:
        raise RuntimeError(
            "Faltan WORDPRESS_API_USERNAME/WORDPRESS_API_PASSWORD en .env.local"
        )
    auth = base64.b64encode(f"{username}:{password}".encode()).decode()
    return api, f"Basic {auth}"


def wp_headers(auth: str, content_type: str = "application/json") -> dict[str, str]:
    return {
        "Authorization": auth,
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Content-Type": content_type,
    }


def wp_get(api: str, auth: str, path: str):
    req = urllib.request.Request(
        f"{api}{path}", headers=wp_headers(auth), method="GET"
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def wp_post(api: str, auth: str, path: str, payload: dict):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{api}{path}", headers=wp_headers(auth), data=data, method="POST"
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def ensure_category(api: str, auth: str) -> int:
    found = wp_get(
        api, auth, f"/wp/v2/categories?slug={urllib.parse.quote(DEFAULT_CATEGORY_SLUG)}"
    )
    if found:
        return int(found[0]["id"])
    created = wp_post(
        api,
        auth,
        "/wp/v2/categories",
        {
            "name": DEFAULT_CATEGORY_NAME,
            "slug": DEFAULT_CATEGORY_SLUG,
            "description": "Noticias de Serbia relevantes para la comunidad latina, "
            "traducidas y resumidas desde fuentes locales.",
        },
    )
    return int(created["id"])


def find_post_by_slug(api: str, auth: str, slug: str) -> dict | None:
    posts = wp_get(
        api,
        auth,
        f"/wp/v2/posts?slug={urllib.parse.quote(slug)}&status=any&_fields=id,slug,status",
    )
    return posts[0] if posts else None


def download_binary(url: str) -> tuple[bytes, str]:
    """Download raw bytes and content type from a URL."""
    req = urllib.request.Request(
        url, headers={"User-Agent": USER_AGENT, "Accept": "image/*,*/*"}
    )
    with urllib.request.urlopen(req, timeout=45) as response:
        content_type = (
            response.headers.get_content_type()
            or mimetypes.guess_type(url)[0]
            or "application/octet-stream"
        )
        return response.read(), content_type


def _normalize_image_url(url: str) -> str:
    """Strip WordPress thumbnail suffixes to get full-size image."""
    # WordPress thumbnails: filename-300x169.jpg → filename.jpg
    # Also handles: filename-768x433.jpg, filename-150x150.png, etc.
    normalized = re.sub(r"-\d+x\d+(?=\.(jpg|jpeg|png|webp|gif))", "", url, flags=re.I)
    return normalized


def upload_media(
    api: str, auth: str, image_url: str, title: str
) -> int | None:
    """Upload an image to WordPress and return the media ID."""
    if not image_url:
        return None
    # Use full-size image URL
    image_url = _normalize_image_url(image_url)
    try:
        data, content_type = download_binary(image_url)
    except Exception as exc:
        print(
            json.dumps(
                {"action": "media_download_error", "url": image_url, "error": str(exc)},
                ensure_ascii=False,
            ),
            file=sys.stderr,
        )
        return None
    filename = Path(urllib.parse.urlparse(image_url).path).name or "serbian-news.jpg"
    headers = {
        "Authorization": auth,
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Content-Type": content_type,
        "Content-Disposition": f'attachment; filename="{filename}"',
    }
    try:
        media_data = json.dumps({}).encode("utf-8")  # placeholder, actual body is binary
        req = urllib.request.Request(
            f"{api}/wp/v2/media",
            headers=headers,
            data=data,
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=45) as response:
            media = json.loads(response.read().decode("utf-8"))
        media_id = int(media["id"])
        # Set title and alt text
        try:
            wp_post(api, auth, f"/wp/v2/media/{media_id}", {"title": title, "alt_text": title})
        except Exception:
            pass
        return media_id
    except Exception as exc:
        print(
            json.dumps(
                {"action": "media_upload_error", "url": image_url, "error": str(exc)},
                ensure_ascii=False,
            ),
            file=sys.stderr,
        )
        return None


def build_post_html(item: TranslatedItem) -> str:
    """Build WordPress post HTML for a news article."""
    escaped_title = html_mod.escape(item.title, quote=True)
    escaped_title_es = html_mod.escape(item.title_es, quote=True)
    escaped_link = html_mod.escape(item.link, quote=True)
    escaped_source = html_mod.escape(item.source_name)
    escaped_excerpt = html_mod.escape(item.excerpt_es)
    matched_str = ", ".join(item.matched_keywords[:5])

    return f"""
<!-- wp:paragraph -->
<p><strong>Noticia desde {escaped_source} — resumida y traducida al español para la comunidad latina en Serbia.</strong></p>
<!-- /wp:paragraph -->

<!-- wp:quote -->
<blockquote class="wp-block-quote">
<p>Título original: {escaped_title}</p>
<cite>— {escaped_source}, {html_mod.escape(item.pub_date)}</cite>
</blockquote>
<!-- /wp:quote -->

<!-- wp:heading {{"level":3}} -->
<h3>{escaped_title_es}</h3>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>{escaped_excerpt}</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><a href="{escaped_link}" target="_blank" rel="nofollow noopener noreferrer">
Leer artículo completo en {escaped_source} (serbio) →
</a></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p><small>Temas detectados: {matched_str}</small></p>
<!-- /wp:paragraph -->
""".strip()


# ── Main pipeline ───────────────────────────────────────────────────────────


def create_draft(
    api: str,
    auth: str,
    category_id: int,
    item: TranslatedItem,
    dry_run: bool,
) -> dict:
    """Create a WordPress draft for a news article."""
    slug = f"{item.source_prefix}-{item.source_slug}"
    existing = find_post_by_slug(api, auth, slug)
    if existing:
        return {
            "action": "skipped",
            "reason": "already_exists",
            "slug": slug,
            "existing_status": existing.get("status"),
            "title": item.title_es,
            "url": item.link,
        }

    if dry_run:
        return {
            "action": "would_create",
            "slug": slug,
            "title": item.title_es,
            "url": item.link,
            "matched_keywords": item.matched_keywords,
            "score": item.relevance_score,
        }

    payload = {
        "title": item.title_es or item.title,
        "slug": slug,
        "status": "draft",
        "content": build_full_post_html(item, item.full_body_es),
        "excerpt": item.excerpt_es[:280] if item.excerpt_es else item.description[:280],
        "categories": [category_id],
        "tags": [],
    }

    # Upload featured image if available
    media_id = upload_media(api, auth, item.image_url, item.title_es or item.title)
    if media_id:
        payload["featured_media"] = media_id

    post = wp_post(api, auth, "/wp/v2/posts", payload)
    return {
        "action": "created",
        "id": post["id"],
        "slug": post["slug"],
        "link": post.get("link"),
        "title": item.title_es,
        "source_url": item.link,
        "score": item.relevance_score,
        "media_id": media_id,
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Sync relevant Serbian news to WordPress drafts"
    )
    parser.add_argument("--limit", type=int, default=30, help="Max articles to fetch per feed")
    parser.add_argument("--dry-run", action="store_true", help="Preview only, no WordPress writes")
    parser.add_argument("--sleep", type=float, default=0.5, help="Delay between article processing")
    parser.add_argument("--feed-sleep", type=float, default=1.5, help="Delay between feed requests")
    parser.add_argument(
        "--feeds",
        nargs="*",
        default=None,
        help="Specific feed prefixes to process (default: all)",
    )
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[1]
    load_env_file(project_root / ".env.local")

    # Determine which feeds to process
    feeds_to_process = RSS_FEEDS
    if args.feeds:
        feeds_to_process = [f for f in RSS_FEEDS if f["prefix"] in args.feeds]
        if not feeds_to_process:
            print(
                json.dumps(
                    {"error": f"No feeds match prefixes: {args.feeds}"},
                    ensure_ascii=False,
                ),
                file=sys.stderr,
            )
            return 1

    print(
        json.dumps(
            {
                "phase": "start",
                "feeds": [f["name"] for f in feeds_to_process],
                "dry_run": args.dry_run,
                "limit_per_feed": args.limit,
            },
            ensure_ascii=False,
        )
    )

    # Load processed URLs
    processed = load_processed_urls()

    # Fetch all feeds
    all_items: list[NewsItem] = []
    for feed in feeds_to_process:
        try:
            if feed.get("type") == "html_listing":
                items = fetch_html_listing(feed, args.limit)
            else:
                items = fetch_rss_feed(feed)
            # Limit per feed
            items = items[: args.limit]
            print(
                json.dumps(
                    {
                        "source": feed["name"],
                        "fetched": len(items),
                    },
                    ensure_ascii=False,
                )
            )
            all_items.extend(items)
        except Exception as exc:
            print(
                json.dumps(
                    {"source": feed["name"], "error": str(exc)},
                    ensure_ascii=False,
                ),
                file=sys.stderr,
            )
        if feed != feeds_to_process[-1]:
            time.sleep(args.feed_sleep)

    print(
        json.dumps(
            {"phase": "fetched", "total_articles": len(all_items)},
            ensure_ascii=False,
        )
    )

    # Filter: remove already processed
    new_items = [item for item in all_items if item.link not in processed]
    skipped_count = len(all_items) - len(new_items)
    if skipped_count:
        print(
            json.dumps(
                {"phase": "dedup", "skipped_already_processed": skipped_count},
                ensure_ascii=False,
            )
        )

    # Filter: relevance
    relevant: list[TranslatedItem] = []
    for item in new_items:
        ok, score, matched = is_relevant(item)
        if ok:
            relevant.append(
                TranslatedItem(
                    source_name=item.source_name,
                    source_prefix=item.source_prefix,
                    title=item.title,
                    link=item.link,
                    description=item.description,
                    pub_date=item.pub_date,
                    image_url=item.image_url,
                    source_slug=item.source_slug,
                    guid=item.guid,
                    relevance_score=score,
                    matched_keywords=matched,
                )
            )

    print(
        json.dumps(
            {
                "phase": "filtered",
                "relevant": len(relevant),
                "discarded": len(new_items) - len(relevant),
            },
            ensure_ascii=False,
        )
    )

    if not relevant:
        print(
            json.dumps(
                {"phase": "done", "message": "No relevant articles found"},
                ensure_ascii=False,
            )
        )
        return 0

    # Translate relevant articles (and fetch full body for each)
    for item in relevant:
        try:
            item.title_es = translate_text_to_spanish(item.title, max_chars=300)
            item.excerpt_es = translate_text_to_spanish(item.description, max_chars=800)

            # Fetch full article body
            try:
                body_html, ig_urls, yt_urls = fetch_article_body(
                    item.source_name, item.link
                )
                item.instagram_urls = ig_urls
                item.youtube_urls = yt_urls
                if body_html:
                    # Strip HTML tags before translation, preserve <img> and <a>
                    clean_text, img_tags, link_tags = _strip_html_for_translation(body_html)
                    if clean_text:
                        translated_clean = translate_text_to_spanish(clean_text, max_chars=3500)
                        # Re-insert images and links, wrap in paragraphs
                        rebuilt = _reinsert_media_after_translation(
                            translated_clean, img_tags, link_tags
                        )
                        # Wrap non-tag lines in <p> for proper WordPress rendering
                        lines = rebuilt.split('\n')
                        wrapped: list[str] = []
                        for line in lines:
                            stripped = line.strip()
                            if not stripped:
                                continue
                            if re.match(r'^<[a-z]+\b', stripped):
                                wrapped.append(stripped)
                            else:
                                wrapped.append(f'<p>{stripped}</p>')
                        item.full_body_es = '\n'.join(wrapped)
                    else:
                        item.full_body_es = ''
                    body_len = len(body_html)
                else:
                    body_len = 0
            except Exception as exc:
                body_len = 0
                print(
                    json.dumps(
                        {
                            "source": item.source_name,
                            "title": item.title[:80],
                            "body_error": str(exc),
                        },
                        ensure_ascii=False,
                    ),
                    file=sys.stderr,
                )

            print(
                json.dumps(
                    {
                        "source": item.source_name,
                        "original": item.title[:100],
                        "translated": item.title_es[:100],
                        "score": item.relevance_score,
                        "keywords": item.matched_keywords[:3],
                        "body_chars": body_len,
                        "instagram": len(item.instagram_urls),
                        "youtube": len(item.youtube_urls),
                    },
                    ensure_ascii=False,
                )
            )
            time.sleep(args.sleep)
        except Exception as exc:
            print(
                json.dumps(
                    {
                        "source": item.source_name,
                        "title": item.title[:80],
                        "error": str(exc),
                    },
                    ensure_ascii=False,
                ),
                file=sys.stderr,
            )

    # Create WordPress drafts
    if args.dry_run:
        print(
            json.dumps(
                {
                    "phase": "dry_run_preview",
                    "would_create": len(relevant),
                    "articles": [
                        {
                            "source": item.source_name,
                            "title_es": item.title_es,
                            "url": item.link,
                            "score": item.relevance_score,
                            "keywords": item.matched_keywords[:5],
                        }
                        for item in relevant
                    ],
                },
                ensure_ascii=False,
            )
        )
    else:
        api, auth = wp_config()
        # Verify auth
        user = wp_get(api, auth, "/wp/v2/users/me?_fields=id,name,slug")
        print(
            json.dumps(
                {"phase": "auth", "user": user.get("name"), "id": user.get("id")},
                ensure_ascii=False,
            )
        )
        category_id = ensure_category(api, auth)

        created = 0
        skipped = 0
        errors = 0
        for item in relevant:
            try:
                result = create_draft(api, auth, category_id, item, dry_run=False)
                if result.get("action") == "created":
                    created += 1
                    processed.add(item.link)
                elif result.get("action") == "skipped":
                    skipped += 1
                    # Still add to processed so we don't keep checking it
                    processed.add(item.link)
                print(json.dumps(result, ensure_ascii=False))
            except Exception as exc:
                errors += 1
                print(
                    json.dumps(
                        {
                            "action": "error",
                            "source": item.source_name,
                            "title": item.title_es[:80],
                            "error": str(exc),
                        },
                        ensure_ascii=False,
                    ),
                    file=sys.stderr,
                )
            time.sleep(args.sleep)

        # Save processed URLs
        processed = prune_processed_urls(processed)
        save_processed_urls(processed)

        summary = {
            "phase": "done",
            "created": created,
            "skipped": skipped,
            "errors": errors,
            "processed_urls_total": len(processed),
        }
        print(json.dumps(summary, ensure_ascii=False))
        return 1 if errors > created else 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
