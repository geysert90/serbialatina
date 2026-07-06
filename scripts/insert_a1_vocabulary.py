#!/usr/bin/env python3
"""Insert ONLY new A1 Serbian vocabulary entries (no duplicates).
Also update existing entries to enrich them with examples, gender, pronunciation."""
import json, os, sys, time, urllib.parse, urllib.request

DIRECTUS_URL = "http://localhost:8055"
TOKEN = os.environ.get("DIRECTUS_TOKEN", "")

# Only entries NOT already in Directus
NEW_ONLY = [
    # ── Unit 1: Survival additions ──
    {"unit":1,"sort":13,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Kako ste?","serbian_cyrillic":"Како сте?",
     "spanish_translation":"¿Cómo está? (formal)",
     "pronunciation_hint":"KA-ko ste",
     "example_latin":"Dobar dan, kako ste?","example_cyrillic":"Добар дан, како сте?",
     "example_spanish":"Buenos días, ¿cómo está?",
     "usage_notes":"Formal (Vi). Usar con desconocidos, mayores, contexto profesional.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":14,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Dobro sam, hvala.","serbian_cyrillic":"Добро сам, хвала.",
     "spanish_translation":"Estoy bien, gracias.",
     "pronunciation_hint":"DO-bro sam HVA-la",
     "example_latin":"Kako si? — Dobro sam, hvala.","example_cyrillic":"Како си? — Добро сам, хвала.",
     "example_spanish":"¿Cómo estás? — Estoy bien, gracias.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":15,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Zovem se...","serbian_cyrillic":"Зовем се...",
     "spanish_translation":"Me llamo...",
     "pronunciation_hint":"ZO-vem se",
     "example_latin":"Zovem se Ana.","example_cyrillic":"Зовем се Ана.",
     "example_spanish":"Me llamo Ana.",
     "usage_notes":"Lit. 'me llamo'. Zvati se = llamarse.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":16,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Drago mi je.","serbian_cyrillic":"Драго ми је.",
     "spanish_translation":"Encantado/a. / Mucho gusto.",
     "pronunciation_hint":"DRA-go mi ye",
     "example_latin":"Zovem se Marko. — Drago mi je.","example_cyrillic":"Зовем се Марко. — Драго ми је.",
     "example_spanish":"Me llamo Marko. — Encantado.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":17,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Odakle ste?","serbian_cyrillic":"Одакле сте?",
     "spanish_translation":"¿De dónde es? (formal)",
     "pronunciation_hint":"O-da-kle ste",
     "example_latin":"Odakle ste? — Iz Španije.","example_cyrillic":"Одакле сте? — Из Шпаније.",
     "example_spanish":"¿De dónde es? — De España.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":18,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Ja sam iz...","serbian_cyrillic":"Ја сам из...",
     "spanish_translation":"Soy de...",
     "pronunciation_hint":"ya sam iz",
     "example_latin":"Ja sam iz Meksika.","example_cyrillic":"Ја сам из Мексика.",
     "example_spanish":"Soy de México.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":19,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Govorite li engleski?","serbian_cyrillic":"Говорите ли енглески?",
     "spanish_translation":"¿Habla inglés?",
     "pronunciation_hint":"go-VO-ri-te li en-GLES-ki",
     "example_latin":"Izvinite, govorite li engleski?","example_cyrillic":"Извините, говорите ли енглески?",
     "example_spanish":"Disculpe, ¿habla inglés?",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":20,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Ne govorim srpski.","serbian_cyrillic":"Не говорим српски.",
     "spanish_translation":"No hablo serbio.",
     "pronunciation_hint":"ne go-VO-rim SRP-ski",
     "example_latin":"Izvinite, ne govorim srpski.","example_cyrillic":"Извините, не говорим српски.",
     "example_spanish":"Disculpe, no hablo serbio.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":21,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Govorim malo srpski.","serbian_cyrillic":"Говорим мало српски.",
     "spanish_translation":"Hablo un poco de serbio.",
     "pronunciation_hint":"go-VO-rim MA-lo SRP-ski",
     "example_latin":"Govorim malo srpski, učim.","example_cyrillic":"Говорим мало српски, учим.",
     "example_spanish":"Hablo un poco de serbio, estoy aprendiendo.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":22,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Živim u...","serbian_cyrillic":"Живим у...",
     "spanish_translation":"Vivo en...",
     "pronunciation_hint":"ZHI-vim u",
     "example_latin":"Živim u Novom Sadu.","example_cyrillic":"Живим у Новом Саду.",
     "example_spanish":"Vivo en Novi Sad.",
     "usage_notes":"'u' + locativo. Ciudades: u Beogradu, u Novom Sadu.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":23,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Prijatno!","serbian_cyrillic":"Пријатно!",
     "spanish_translation":"¡Buen provecho!",
     "pronunciation_hint":"pri-YAT-no",
     "example_latin":"Evo hrane. — Hvala, prijatno!","example_cyrillic":"Ево хране. — Хвала, пријатно!",
     "example_spanish":"Aquí está la comida. — Gracias, ¡buen provecho!",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":24,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Srećan put!","serbian_cyrillic":"Срећан пут!",
     "spanish_translation":"¡Buen viaje!",
     "pronunciation_hint":"SRE-chan put",
     "example_latin":"Idem na aerodrom. — Srećan put!","example_cyrillic":"Идем на аеродром. — Срећан пут!",
     "example_spanish":"Voy al aeropuerto. — ¡Buen viaje!",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":25,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"U redu.","serbian_cyrillic":"У реду.",
     "spanish_translation":"De acuerdo. / Está bien.",
     "pronunciation_hint":"u RE-du",
     "example_latin":"Možemo u 5? — U redu.","example_cyrillic":"Можемо у 5? — У реду.",
     "example_spanish":"¿Podemos a las 5? — De acuerdo.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
    {"unit":1,"sort":26,"entry_type":"expression","part_of_speech":"fixed_expression",
     "serbian_latin":"Izvolite.","serbian_cyrillic":"Изволите.",
     "spanish_translation":"Aquí tiene. / Adelante.",
     "pronunciation_hint":"iz-VO-li-te",
     "example_latin":"Meni sa piletinom, molim. — Izvolite.","example_cyrillic":"Мени са пилетином, молим. — Изволите.",
     "example_spanish":"Para mí con pollo, por favor. — Aquí tiene.",
     "usage_notes":"Multiuso: al dar algo, ceder paso, atender cliente.",
     "is_core":1,"is_flashcard_enabled":1,"source_label":"SerbiaLatina A1 curated"},
]

# ══════════════════════════════════════════════════════
# UPDATES: enrich existing entries with examples + gender
# ══════════════════════════════════════════════════════

UPDATES = {
    # Unit 4 — basic words missing examples
    1: {"example_latin":"Zdravo, kako si?","example_cyrillic":"Здраво, како си?","example_spanish":"Hola, ¿cómo estás?","pronunciation_hint":"ZDRA-vo"},
    2: {"pronunciation_hint":"DO-bro YU-tro"},
    3: {"example_latin":"Hvala vam puno!","example_cyrillic":"Хвала вам пуно!","example_spanish":"¡Muchas gracias!","pronunciation_hint":"HVA-la"},
    4: {"example_latin":"Molim vas, gde je stanica?","example_cyrillic":"Молим вас, где је станица?","example_spanish":"Por favor, ¿dónde está la estación?","pronunciation_hint":"MO-lim"},
    5: {"pronunciation_hint":"iz-VI-ni-te"},
    6: {"pronunciation_hint":"ne RA-zu-mem"},
    # Colors (Unit 10) - add examples and gender
    305: {"example_latin":"crvena jabuka","example_cyrillic":"црвена јабука","example_spanish":"manzana roja","grammatical_gender":"feminine","usage_notes":"Forma femenina de crven."},
    304: {"example_latin":"plavo more","example_cyrillic":"плаво море","example_spanish":"mar azul","grammatical_gender":"feminine","usage_notes":"Forma femenina de plav."},
    303: {"example_latin":"zelena trava","example_cyrillic":"зелена трава","example_spanish":"hierba verde","grammatical_gender":"feminine","usage_notes":"Forma femenina de zelen."},
    309: {"example_latin":"žuta bananu","example_cyrillic":"жута банана","example_spanish":"plátano amarillo","grammatical_gender":"feminine","usage_notes":"Forma femenina de žut."},
    300: {"example_latin":"bela košulja","example_cyrillic":"бела кошуља","example_spanish":"camisa blanca","grammatical_gender":"feminine","usage_notes":"Forma femenina de beli."},
    301: {"example_latin":"crna kafa","example_cyrillic":"црна кафа","example_spanish":"café negro","grammatical_gender":"feminine","usage_notes":"Forma femenina de crn."},
    310: {"example_latin":"braon cipele","example_cyrillic":"браон ципеле","example_spanish":"zapatos marrones","usage_notes":"Invariable. No cambia."},
    302: {"example_latin":"siva mačka","example_cyrillic":"сива мачка","example_spanish":"gato gris","grammatical_gender":"feminine","usage_notes":"Forma femenina de siv."},
    308: {"example_latin":"narandžasta boja","example_cyrillic":"наранџаста боја","example_spanish":"color naranja","grammatical_gender":"feminine"},
    # Unit 5 — phrases
    123: {"pronunciation_hint":"KA-ko se ZO-vesh","usage_notes":"Informal (ti). Formal: Kako se zovete?"},
    117: {"example_latin":"Hvala vam puno!","example_cyrillic":"Хвала вам пуно!","example_spanish":"¡Muchas gracias!","pronunciation_hint":"HVA-la vam"},
    126: {"pronunciation_hint":"VI-di-mo se"},
    127: {"pronunciation_hint":"ZHI-ve-li","usage_notes":"Brindis universal en Serbia. Lit. '¡que vivan!'."},
    131: {"pronunciation_hint":"KA-ko si"},
    # Unit 7 — Family
    192: {"example_latin":"Moja supruga je doktorka.","example_cyrillic":"Моја супруга је докторка.","example_spanish":"Mi esposa es doctora."},
    193: {"example_latin":"Moj suprug je inženjer.","example_cyrillic":"Мој супруг је инжењер.","example_spanish":"Mi marido es ingeniero."},
    194: {"example_latin":"Moja majka živi u Beogradu.","example_cyrillic":"Моја мајка живи у Београду.","example_spanish":"Mi madre vive en Belgrado."},
    195: {"example_latin":"Moj otac radi u banci.","example_cyrillic":"Мој отац ради у банци.","example_spanish":"Mi padre trabaja en un banco."},
}

def directus_req(path, method="GET", body=None):
    url = f"{DIRECTUS_URL}{path}"
    headers = {"Authorization":f"Bearer {TOKEN}","User-Agent":"SerbiaLatina-Vocab/1.0","Accept":"application/json"}
    data = None
    if body is not None:
        headers["Content-Type"] = "application/json"
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(url, headers=headers, data=data, method=method)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def main():
    if not TOKEN:
        print("ERROR: Set DIRECTUS_TOKEN", file=sys.stderr); return 1

    # ── Phase 1: Insert NEW entries ──
    print(f"📝 Insertando {len(NEW_ONLY)} nuevas entradas...")
    ok = err = 0
    for i, e in enumerate(NEW_ONLY):
        # Ensure required fields
        e.setdefault("difficulty", "starter")
        e.setdefault("status", "published")
        if "slug" not in e:
            e["slug"] = e["serbian_latin"].lower().replace(" ", "-").replace(".", "").replace("?", "").replace("!", "")[:80]
        text = e["serbian_latin"]
        spanish = e["spanish_translation"]
        print(f"  [{i+1}/{len(NEW_ONLY)}] {text} → {spanish}")
        try:
            result = directus_req("/items/learning_entries", "POST", e)
            print(f"    ✅ ID={result['data']['id']}")
            ok += 1
        except Exception as exc:
            print(f"    ❌ {exc}", file=sys.stderr)
            err += 1
        time.sleep(0.1)

    print(f"\n📝 Nuevas: {ok} insertadas, {err} errores")

    # ── Phase 2: UPDATE existing entries ──
    print(f"\n🔄 Enriqueciendo {len(UPDATES)} entradas existentes...")
    ok2 = err2 = 0
    for entry_id, fields in UPDATES.items():
        print(f"  ID={entry_id}: {list(fields.keys())}")
        try:
            directus_req(f"/items/learning_entries/{entry_id}", "PATCH", fields)
            ok2 += 1
        except Exception as exc:
            print(f"    ❌ {exc}", file=sys.stderr)
            err2 += 1
        time.sleep(0.08)

    print(f"\n🔄 Actualizadas: {ok2}, Errores: {err2}")
    print(f"\n🏁 Total: {ok} nuevas + {ok2} enriquecidas")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
