#!/usr/bin/env python3
"""Generate TTS audio for Directus learning entries missing audio files.

Usage:
  python3 scripts/generate_learning_audio.py --dry-run
  python3 scripts/generate_learning_audio.py --limit 10
  python3 scripts/generate_learning_audio.py
"""

import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request

DIRECTUS_URL = "http://localhost:8055"
TTS_URL = "http://localhost:5050/v1/audio/speech"
USER_AGENT = "SerbiaLatina-AudioGen/1.0"

# Voice selection
SR_VOICES = [
    "sr-RS-SophieNeural",    # Serbian female
    "sr-RS-NicholasNeural",  # Serbian male
]
ES_VOICES = [
    "es-MX-JorgeNeural",     # Spanish Mexican male
    "es-CO-SalomeNeural",    # Spanish Colombian female
]

# ── Helpers ──────────────────────────────────────────────────────────────────

def directus_req(path: str, method: str = "GET", body: dict = None) -> dict:
    """Make a Directus API request."""
    token = os.environ.get("DIRECTUS_TOKEN", "")
    url = f"{DIRECTUS_URL}{path}"
    headers = {
        "Authorization": f"Bearer {token}",
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
    }
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, headers=headers, data=data, method=method)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def generate_audio(text: str, voice: str) -> bytes:
    """Generate TTS audio via edge-tts."""
    body = json.dumps({
        "model": "tts-1",
        "input": text,
        "voice": voice,
        "response_format": "mp3",
    }).encode("utf-8")

    req = urllib.request.Request(
        TTS_URL,
        headers={
            "Authorization": "Bearer gacasteca",
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json",
        },
        data=body,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def upload_file_to_directus(filename: str, data: bytes, title: str) -> str:
    """Upload a file to Directus and return the file ID."""
    # Directus files API
    boundary = "----SerbiaLatinaUpload"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="title"\r\n\r\n'
        f"{title}\r\n"
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: audio/mpeg\r\n\r\n"
    ).encode("utf-8")
    body += data
    body += f"\r\n--{boundary}--\r\n".encode("utf-8")

    token = os.environ.get("DIRECTUS_TOKEN", "")
    req = urllib.request.Request(
        f"{DIRECTUS_URL}/files",
        headers={
            "Authorization": f"Bearer {token}",
            "User-Agent": USER_AGENT,
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        data=body,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        result = json.loads(resp.read().decode("utf-8"))
        return result["data"]["id"]


def get_entries_without_audio(limit: int = None, offset: int = 0, force: bool = False) -> list[dict]:
    """Fetch learning entries. With force=True, fetches all (even those with audio)."""
    params = {
        "filter[status][_eq]": "published",
        "sort": "id",
        "limit": limit or 100,
        "offset": offset,
    }
    if not force:
        params["filter[audio_file][_null]"] = "true"
    qs = urllib.parse.urlencode(params, doseq=True)
    result = directus_req(f"/items/learning_entries?{qs}")
    return result.get("data", [])


def update_entry_audio(entry_id: int, file_id: str) -> dict:
    """Update a learning entry with the audio file ID."""
    return directus_req(
        f"/items/learning_entries/{entry_id}",
        method="PATCH",
        body={"audio_file": file_id},
    )


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate TTS audio for learning entries")
    parser.add_argument("--dry-run", action="store_true", help="Preview only")
    parser.add_argument("--limit", type=int, default=None, help="Max entries to process")
    parser.add_argument("--force", action="store_true", help="Regenerate audio even for entries that already have it")
    parser.add_argument("--sleep", type=float, default=0.3, help="Delay between entries")
    parser.add_argument("--voice", default=None, help=f"Override Serbian voice (default: alternate {SR_VOICES})")
    args = parser.parse_args()

    token = os.environ.get("DIRECTUS_TOKEN")
    if not token:
        print("ERROR: Set DIRECTUS_TOKEN environment variable", file=sys.stderr)
        return 1

    # Count total
    params = {
        "aggregate[count]": "id",
        "filter[status][_eq]": "published",
    }
    if not args.force:
        params["filter[audio_file][_null]"] = "true"
    qs = urllib.parse.urlencode(params, doseq=True)
    count_result = directus_req(f"/items/learning_entries?{qs}")
    total = count_result["data"][0]["count"]["id"] if count_result.get("data") else 0
    label = "a regenerar" if args.force else "sin audio"
    print(f"📊 Entradas {label}: {total}")

    if total == 0:
        print("✅ Todas las entradas tienen audio.")
        return 0

    # Process in batches
    offset = 0
    processed = 0
    errors = 0
    batch_size = 50

    while offset < total:
        if args.limit and processed >= args.limit:
            break

        entries = get_entries_without_audio(limit=batch_size, offset=offset, force=args.force)
        if not entries:
            break

        for entry in entries:
            if args.limit and processed >= args.limit:
                break

            eid = entry["id"]
            text = entry.get("serbian_cyrillic", "").strip()
            # Fallback to latin if cyrillic is missing
            if not text:
                text = entry.get("serbian_latin", "").strip()
            spanish = entry.get("spanish_translation", "").strip()

            if not text:
                print(f"⚠️  Entry {eid}: sin texto serbio, saltando")
                offset += 1
                continue

            safe_name = text[:60].replace("/", "-").replace(" ", "_")
            filename = f"sr-{eid}-{safe_name}.mp3"

            # Alternate between Serbian voices (or use --voice override)
            voice = args.voice if args.voice else SR_VOICES[processed % len(SR_VOICES)]

            print(f"🎤 [{processed+1}/{min(total, args.limit or total)}] {text} → {spanish} ({voice})")

            if args.dry_run:
                print(f"   [DRY-RUN] Generaría audio con voz {voice}")
                processed += 1
                offset += 1
                continue

            try:
                # Generate audio
                audio = generate_audio(text, voice)

                # Upload to Directus
                file_id = upload_file_to_directus(filename, audio, f"TTS: {text}")

                # Update entry
                update_entry_audio(eid, file_id)

                processed += 1
                print(f"   ✅ Subido (file_id={file_id})")

            except Exception as exc:
                errors += 1
                print(f"   ❌ Error: {exc}", file=sys.stderr)

            offset += 1
            time.sleep(args.sleep)

        # Fetch next batch fresh (avoid stale offset issues)
        offset = processed + errors  # approximate

    print(f"\n🏁 Completado: {processed} generados, {errors} errores")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
