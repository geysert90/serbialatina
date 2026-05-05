#!/usr/bin/env python3
"""Sync upcoming Moj Novi Sad events into the Serbia Latina WordPress backend.

The importer is intentionally idempotent:
- one WordPress post per Moj Novi Sad /navigator/... URL
- post slug: mojnovisad-<source-slug>
- existing posts are updated instead of duplicated

Usage:
  python3 scripts/sync_mojnovisad_events.py --dry-run --limit 5
  python3 scripts/sync_mojnovisad_events.py --publish --limit 20
"""

from __future__ import annotations

import argparse
import base64
import html
import json
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable

SOURCE_LIST_URL = "https://www.mojnovisad.com/desavanja/"
SOURCE_BASE = "https://www.mojnovisad.com"
USER_AGENT = "SerbiaLatina2-EventsSync/1.0 (+https://serbialatina.com)"
DEFAULT_CATEGORY_SLUG = "eventos"
DEFAULT_CATEGORY_NAME = "Eventos"


class Node:
    def __init__(self, tag: str, attrs: dict[str, str] | None = None, parent: "Node | None" = None):
        self.tag = tag
        self.attrs = attrs or {}
        self.parent = parent
        self.children: list[Node | str] = []

    def classes(self) -> set[str]:
        return set((self.attrs.get("class") or "").split())


class TreeBuilder(HTMLParser):
    VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.root = Node("document")
        self.stack = [self.root]

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]):
        node = Node(tag.lower(), {k.lower(): v or "" for k, v in attrs}, self.stack[-1])
        self.stack[-1].children.append(node)
        if tag.lower() not in self.VOID_TAGS:
            self.stack.append(node)

    def handle_endtag(self, tag: str):
        tag = tag.lower()
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag:
                del self.stack[i:]
                break

    def handle_data(self, data: str):
        self.stack[-1].children.append(data)

    def handle_entityref(self, name: str):
        self.stack[-1].children.append(f"&{name};")

    def handle_charref(self, name: str):
        self.stack[-1].children.append(f"&#{name};")


def parse_html(markup: str) -> Node:
    parser = TreeBuilder()
    parser.feed(markup)
    return parser.root


def walk(node: Node) -> Iterable[Node]:
    yield node
    for child in node.children:
        if isinstance(child, Node):
            yield from walk(child)


def has_class(node: Node, class_name: str) -> bool:
    return class_name in node.classes()


def find_all(node: Node, tag: str | None = None, class_name: str | None = None) -> list[Node]:
    out = []
    for item in walk(node):
        if tag and item.tag != tag:
            continue
        if class_name and not has_class(item, class_name):
            continue
        out.append(item)
    return out


def first(node: Node, tag: str | None = None, class_name: str | None = None) -> Node | None:
    matches = find_all(node, tag, class_name)
    return matches[0] if matches else None


def text_content(node: Node | None) -> str:
    if not node:
        return ""
    parts: list[str] = []

    def collect(item: Node | str):
        if isinstance(item, str):
            parts.append(html.unescape(item))
            return
        if item.tag in {"script", "style", "noscript"}:
            return
        for child in item.children:
            collect(child)

    collect(node)
    return re.sub(r"\s+", " ", "".join(parts)).strip()


ALLOWED_TAGS = {"p", "br", "strong", "b", "em", "i", "a", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "div", "span"}
ALLOWED_ATTRS = {"a": {"href", "target", "rel"}}


def sanitized_inner_html(node: Node | None) -> str:
    if not node:
        return ""

    def serialize(item: Node | str) -> str:
        if isinstance(item, str):
            return item
        if item.tag in {"script", "style", "iframe", "form", "input", "button"}:
            return ""
        body = "".join(serialize(child) for child in item.children)
        if item.tag not in ALLOWED_TAGS:
            return body
        attrs = []
        for key, value in item.attrs.items():
            if key in ALLOWED_ATTRS.get(item.tag, set()):
                if key == "href" and not value.startswith(("http://", "https://", "mailto:", "tel:")):
                    continue
                attrs.append(f'{key}="{html.escape(value, quote=True)}"')
        if item.tag == "a":
            if "target" not in item.attrs:
                attrs.append('target="_blank"')
            attrs.append('rel="nofollow noopener noreferrer"')
        attr_text = f" {' '.join(attrs)}" if attrs else ""
        if item.tag == "br":
            return "<br />"
        return f"<{item.tag}{attr_text}>{body}</{item.tag}>"

    return "".join(serialize(child) for child in node.children).strip()


def fetch_text(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"})
    with urllib.request.urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", "replace")


def fetch_json(url: str, headers: dict[str, str] | None = None, data: bytes | None = None, method: str | None = None):
    req = urllib.request.Request(url, headers=headers or {}, data=data, method=method)
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def read_google_translate_response(data) -> str:
    chunks = data[0] if isinstance(data, list) and data else []
    if not isinstance(chunks, list):
        return ""
    return "".join(
        chunk[0] for chunk in chunks if isinstance(chunk, list) and chunk and isinstance(chunk[0], str)
    ).replace("\u200b", "").strip()


def translate_text_to_spanish(value: str, max_chars: int = 1800) -> str:
    cleaned = re.sub(r"\s+", " ", html.unescape(value or "")).strip()
    if not cleaned:
        return ""
    if len(cleaned) <= 2 or not re.search(r"[A-Za-zÀ-žА-Яа-я]", cleaned):
        return cleaned

    query = urllib.parse.urlencode({
        "client": "gtx",
        "sl": "auto",
        "tl": "es",
        "dt": "t",
        "q": cleaned[:max_chars],
    })
    url = f"https://translate.googleapis.com/translate_a/single?{query}"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=20) as response:
            translated = read_google_translate_response(json.loads(response.read().decode("utf-8")))
            return translated or cleaned
    except Exception:
        return cleaned


def translate_html_fragment_to_spanish(fragment: str) -> str:
    if not fragment:
        return ""

    root = parse_html(fragment)

    def translate_children(node: Node) -> None:
        for index, child in enumerate(node.children):
            if isinstance(child, str):
                if not child.strip():
                    continue
                leading = re.match(r"^\s*", child).group(0)
                trailing = re.search(r"\s*$", child).group(0)
                translated = translate_text_to_spanish(child, max_chars=1600)
                node.children[index] = f"{leading}{html.escape(translated)}{trailing}"
                time.sleep(0.08)
            else:
                if child.tag in {"a"}:
                    continue
                translate_children(child)

    translate_children(root)
    return sanitized_inner_html(root)


@dataclass
class EventSummary:
    title: str
    url: str
    source_slug: str
    category: str
    date_label: str
    time_label: str
    location: str
    image_url: str


@dataclass
class EventDetail(EventSummary):
    content_html: str
    excerpt: str
    original_title: str = ""


def absolute_url(value: str) -> str:
    return urllib.parse.urljoin(SOURCE_BASE, value)


def source_slug_from_url(url: str) -> str:
    path = urllib.parse.urlparse(url).path.strip("/")
    return path.split("/")[-1]


def parse_event_list(limit: int) -> list[EventSummary]:
    markup = fetch_text(SOURCE_LIST_URL)
    root = parse_html(markup)
    cards = find_all(root, class_name="events-main__single-card")
    events: list[EventSummary] = []
    seen: set[str] = set()

    for card in cards:
        links = [a for a in find_all(card, "a") if "/navigator/" in a.attrs.get("href", "")]
        if not links:
            continue
        url = absolute_url(links[0].attrs["href"])
        if url in seen:
            continue
        seen.add(url)

        title = text_content(first(card, "h6"))
        if not title:
            continue
        badge = text_content(first(card, class_name="badge"))
        thumb = first(card, class_name="single-card__thumb")
        image_url = thumb.attrs.get("data-lazybg", "") if thumb else ""
        details_node = first(card, class_name="single-card__info-details")
        detail_values = [text_content(child) for child in details_node.children if isinstance(child, Node) and text_content(child)] if details_node else []
        date_label = detail_values[0] if len(detail_values) > 0 else ""
        time_label = detail_values[1] if len(detail_values) > 1 else ""
        location = detail_values[2] if len(detail_values) > 2 else ""

        events.append(EventSummary(
            title=title,
            url=url,
            source_slug=source_slug_from_url(url),
            category=badge,
            date_label=date_label,
            time_label=time_label,
            location=location,
            image_url=absolute_url(image_url) if image_url else "",
        ))
        if len(events) >= limit:
            break
    return events


def parse_event_detail(summary: EventSummary) -> EventDetail:
    markup = fetch_text(summary.url)
    root = parse_html(markup)
    title = text_content(first(root, "h1", "single-blog__title")) or summary.title
    category_line = text_content(first(root, "p", "single-blog__category"))
    category = category_line.split("|")[-1].strip() if "|" in category_line else summary.category
    info = first(root, class_name="single-blog__info-details")
    info_values = [text_content(child) for child in info.children if isinstance(child, Node) and text_content(child)] if info else []
    date_label = info_values[0] if len(info_values) > 0 else summary.date_label
    time_label = info_values[1] if len(info_values) > 1 else summary.time_label
    location = info_values[2] if len(info_values) > 2 else summary.location
    featured = first(root, class_name="single-blog__featured")
    img = first(featured, "img") if featured else None
    image_url = absolute_url(img.attrs.get("src", "")) if img and img.attrs.get("src") else summary.image_url
    content_node = first(root, class_name="single-blog__content")
    original_title = title
    content_html = sanitized_inner_html(content_node)
    translated_content_html = translate_html_fragment_to_spanish(content_html)
    translated_title = translate_text_to_spanish(title, max_chars=220)
    translated_excerpt = translate_text_to_spanish(re.sub(r"\s+", " ", text_content(content_node))[:900])[:280]
    translated_category = translate_text_to_spanish(category, max_chars=120) if category else category
    return EventDetail(
        translated_title or title,
        summary.url,
        summary.source_slug,
        translated_category or category,
        date_label,
        time_label,
        location,
        image_url,
        translated_content_html or content_html,
        translated_excerpt,
        original_title,
    )


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
    api = (os.environ.get("NEXT_PUBLIC_WORDPRESS_API_URL") or "https://admin.segun2idioma.com/wp-json").rstrip("/")
    username = (os.environ.get("WORDPRESS_API_USERNAME") or "").strip()
    password = re.sub(r"\s+", "", os.environ.get("WORDPRESS_API_PASSWORD") or "")
    if not username or not password:
        raise RuntimeError("Faltan WORDPRESS_API_USERNAME/WORDPRESS_API_PASSWORD en .env.local")
    auth = base64.b64encode(f"{username}:{password}".encode()).decode()
    return api, f"Basic {auth}"


def wp_headers(auth: str, content_type: str = "application/json") -> dict[str, str]:
    return {"Authorization": auth, "User-Agent": USER_AGENT, "Accept": "application/json", "Content-Type": content_type}


def wp_get(api: str, auth: str, path: str):
    return fetch_json(f"{api}{path}", headers=wp_headers(auth), method="GET")


def wp_post(api: str, auth: str, path: str, payload: dict):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    return fetch_json(f"{api}{path}", headers=wp_headers(auth), data=data, method="POST")


def ensure_category(api: str, auth: str) -> int:
    found = wp_get(api, auth, f"/wp/v2/categories?slug={urllib.parse.quote(DEFAULT_CATEGORY_SLUG)}")
    if found:
        return int(found[0]["id"])
    created = wp_post(api, auth, "/wp/v2/categories", {
        "name": DEFAULT_CATEGORY_NAME,
        "slug": DEFAULT_CATEGORY_SLUG,
        "description": "Agenda de eventos en Novi Sad sincronizada desde fuentes locales con atribución.",
    })
    return int(created["id"])


def find_post_by_slug(api: str, auth: str, slug: str):
    posts = wp_get(api, auth, f"/wp/v2/posts?slug={urllib.parse.quote(slug)}&status=any&_fields=id,slug,status,featured_media")
    return posts[0] if posts else None


def download_binary(url: str) -> tuple[bytes, str]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "image/*,*/*"})
    with urllib.request.urlopen(req, timeout=45) as response:
        content_type = response.headers.get_content_type() or mimetypes.guess_type(url)[0] or "application/octet-stream"
        return response.read(), content_type


def upload_media(api: str, auth: str, image_url: str, title: str) -> int | None:
    if not image_url:
        return None
    data, content_type = download_binary(image_url)
    filename = Path(urllib.parse.urlparse(image_url).path).name or "mojnovisad-event.jpg"
    headers = {
        "Authorization": auth,
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Content-Type": content_type,
        "Content-Disposition": f'attachment; filename="{filename}"',
    }
    media = fetch_json(f"{api}/wp/v2/media", headers=headers, data=data, method="POST")
    media_id = int(media["id"])
    try:
        wp_post(api, auth, f"/wp/v2/media/{media_id}", {"title": title, "alt_text": title})
    except Exception:
        pass
    return media_id


def build_post_html(event: EventDetail) -> str:
    facts = "".join([
        f"<li><strong>Fecha:</strong> {html.escape(event.date_label or 'Por confirmar')}</li>",
        f"<li><strong>Hora:</strong> {html.escape(event.time_label or 'Por confirmar')}</li>",
        f"<li><strong>Lugar:</strong> {html.escape(event.location or 'Por confirmar')}</li>",
        f"<li><strong>Categoría original:</strong> {html.escape(event.category or 'Evento')}</li>",
    ])
    source = html.escape(event.url, quote=True)
    source_link = f'<p><em>Fuente original: <a href="{source}" target="_blank" rel="nofollow noopener noreferrer">Moj Novi Sad</a>. Revisa la fuente antes de asistir por si hay cambios de última hora.</em></p>'
    original_title = html.escape(event.original_title or event.title)
    original_title_note = f"<p><em>Título original en serbio: {original_title}</em></p>" if event.original_title and event.original_title != event.title else ""
    original = event.content_html or f"<p>{html.escape(event.excerpt)}</p>"
    return f"""
<!-- wp:paragraph -->
<p><strong>Evento en Novi Sad traducido automáticamente al español desde Moj Novi Sad.</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
{original_title_note}
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul>{facts}</ul>
<!-- /wp:list -->

<!-- wp:separator --><hr class="wp-block-separator has-alpha-channel-opacity" /><!-- /wp:separator -->

<!-- wp:html -->
{original}
<!-- /wp:html -->

<!-- wp:paragraph -->
{source_link}
<!-- /wp:paragraph -->
""".strip()


def upsert_event(api: str, auth: str, category_id: int, event: EventDetail, status: str, dry_run: bool) -> dict:
    slug = f"mojnovisad-{event.source_slug}"
    existing = find_post_by_slug(api, auth, slug)
    payload = {
        "title": event.title,
        "slug": slug,
        "status": status,
        "content": build_post_html(event),
        "excerpt": event.excerpt,
        "categories": [category_id],
        "tags": [],
    }

    if dry_run:
        return {"action": "update" if existing else "create", "slug": slug, "title": event.title, "url": event.url}

    if existing:
        post = wp_post(api, auth, f"/wp/v2/posts/{existing['id']}", payload)
        return {"action": "updated", "id": post["id"], "slug": post["slug"], "link": post.get("link")}

    media_id = upload_media(api, auth, event.image_url, event.title)
    if media_id:
        payload["featured_media"] = media_id
    post = wp_post(api, auth, "/wp/v2/posts", payload)
    return {"action": "created", "id": post["id"], "slug": post["slug"], "link": post.get("link"), "media_id": media_id}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--publish", action="store_true", help="Publish posts. Without this, posts are created/updated as drafts.")
    parser.add_argument("--status", choices=["draft", "publish", "private"], default=None)
    parser.add_argument("--sleep", type=float, default=0.35, help="Delay between detail requests.")
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[1]
    load_env_file(project_root / ".env.local")

    status = args.status or ("publish" if args.publish else "draft")
    summaries = parse_event_list(args.limit)
    print(json.dumps({"source": SOURCE_LIST_URL, "found": len(summaries), "status": status, "dry_run": args.dry_run}, ensure_ascii=False))

    api = auth = None
    category_id = 0
    if not args.dry_run:
        api, auth = wp_config()
        wp_get(api, auth, "/wp/v2/users/me?_fields=id,name,slug")
        category_id = ensure_category(api, auth)

    results = []
    for summary in summaries:
        try:
            detail = parse_event_detail(summary)
            if args.dry_run:
                result = {"action": "preview", "title": detail.title, "date": detail.date_label, "time": detail.time_label, "location": detail.location, "url": detail.url, "image": bool(detail.image_url), "content_chars": len(re.sub('<[^<]+?>', '', detail.content_html))}
            else:
                assert api and auth
                result = upsert_event(api, auth, category_id, detail, status, dry_run=False)
            results.append(result)
            print(json.dumps(result, ensure_ascii=False))
        except Exception as exc:
            error = {"action": "error", "url": summary.url, "error": str(exc)}
            results.append(error)
            print(json.dumps(error, ensure_ascii=False), file=sys.stderr)
        time.sleep(args.sleep)

    summary = {"processed": len(results), "errors": sum(1 for r in results if r.get("action") == "error")}
    print(json.dumps(summary, ensure_ascii=False))
    return 1 if summary["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
