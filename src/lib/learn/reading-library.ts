export type ReadingKind = "revista" | "libro" | "video";

export type ReadingSource = {
  kind: ReadingKind;
  slug: string;
  title: string;
  subtitle: string;
  sourceName: string;
  sourceUrl?: string;
  topic: string;
  readingMinutes: number;
  tone: string;
  paragraphs: string[];
};

export type ReadingToken = {
  type: "word" | "space" | "punctuation";
  text: string;
  key?: string;
};

const READING_SOURCES: ReadingSource[] = [
  {
    kind: "revista",
    slug: "dorcol-matinal",
    title: "Jutro na Dorćolu",
    subtitle:
      "Una revista de lectura suave sobre las rutinas, el café y el ritmo tranquilo del centro de la ciudad.",
    sourceName: "Revista de muestra",
    topic: "vida urbana",
    readingMinutes: 3,
    tone: "from-sky-100 via-white to-amber-100",
    paragraphs: [
      "U jednom jutru na Dorćolu, Beograd izgleda kao grad koji tek otvara oči. Kafići podižu roletne, pekare iznose tople kroasane, a ljudi sa slušalicama u ušima hodaju sporo, kao da još uvek biraju ritam dana.",
      "Na uglu ulice, prodavac voća slaže mandarine u uredne redove, dok se kroz otvoren prozor čuje tiha muzika. U časopisu koji prati gradski život, ova scena bi verovatno dobila naslov o malim navikama koje čine kvart živim.",
      "Magazin koji beleži gradske običaje voli upravo takve trenutke: kratke razgovore, miris sveže kafe i osećaj da se poznato mesto može otkriti ispočetka. Zato Dorćol deluje kao mala scena na kojoj svako ima svoju ulogu.",
    ],
  },
  {
    kind: "revista",
    slug: "vecera-posle-posla",
    title: "Jednostavna večera posle posla",
    subtitle:
      "Lectura de cocina y hábitos cotidianos para practicar palabras frecuentes en contextos reales.",
    sourceName: "Revista de muestra",
    topic: "gastronomía",
    readingMinutes: 3,
    tone: "from-amber-100 via-white to-rose-100",
    paragraphs: [
      "U kuhinji, dobra večera često počinje tihim zvukom noža i mirisom luka. Šefica jednog magazina o hrani kaže da nije važno koliko je recept komplikovan, već koliko pažnje unosite u svaku sitnicu.",
      "Kada paprika omekša, a paradajz pusti sok, jelo dobija boju i karakter. Čitaoci vole recepte koji se spremaju brzo, ali ipak ostavljaju osećaj da je neko stvarno mislio na vas.",
      "U ovakvim tekstovima najlepši deo nije samo lista sastojaka, već i način na koji priča vodi čitaoca kroz mirise, teksture i strpljenje. Zato se jednostavne večere pamte kao mali luksuz posle napornog dana.",
    ],
  },
  {
    kind: "revista",
    slug: "planine-istocne-srbije",
    title: "Mala pauza za putovanje",
    subtitle:
      "Un texto tipo revista para viajar con vocabulario de naturaleza, pueblos y caminos tranquilos.",
    sourceName: "Revista de muestra",
    topic: "viajes",
    readingMinutes: 4,
    tone: "from-emerald-100 via-white to-cyan-100",
    paragraphs: [
      "Putopisni magazin ove nedelje vodi čitaoce u planine istočne Srbije, gde se vreme meri koracima, a ne satima. Staze su mirne, pogled širok, a vazduh dovoljno čist da čovek poželi da ostane duže.",
      "U selima kroz koja prolazite, domaćini nude sir, med i razgovor. Upravo takvi detalji pretvaraju obično putovanje u priču koju pamtite mnogo duže od jedne fotografije.",
      "Kada se dan završi, putnik ne pamti samo pejzaž, već i tišinu između dva sela, zvuk koraka po šljunku i osećaj da je neko mesto ostalo blago i otvoreno za povratak.",
    ],
  },
];

const READING_KIND_LABELS: Record<ReadingKind, string> = {
  revista: "Revistas",
  libro: "Libros",
  video: "Videos",
};

export function getReadingSources(kind?: ReadingKind): ReadingSource[] {
  return kind ? READING_SOURCES.filter((source) => source.kind === kind) : READING_SOURCES;
}

export function getReadingSourceBySlug(slug: string): ReadingSource | undefined {
  return READING_SOURCES.find((source) => source.slug === slug);
}

export function getReadingKindLabel(kind: ReadingKind): string {
  return READING_KIND_LABELS[kind];
}

export function getReadingKindCounts(): Record<ReadingKind, number> {
  return {
    revista: READING_SOURCES.filter((source) => source.kind === "revista").length,
    libro: READING_SOURCES.filter((source) => source.kind === "libro").length,
    video: READING_SOURCES.filter((source) => source.kind === "video").length,
  };
}

export function countWords(text: string): number {
  return text.match(/\p{L}+/gu)?.length ?? 0;
}

export function estimateReadingMinutes(text: string): number {
  return Math.max(1, Math.round(countWords(text) / 180));
}

export function normalizeReadingKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[“”„"'`´().,!?;:\[\]{}<>/\|\-–—]/g, "")
    .replace(/\s+/g, " ");
}

export function tokenizeReadingText(text: string): ReadingToken[] {
  const parts = text.match(/\s+|\p{L}[\p{L}\p{M}'’\-]*|\d+|[^\p{L}\d\s]+/gu) ?? [];

  return parts.map((part) => {
    if (/^\s+$/.test(part)) {
      return { type: "space", text: part } as ReadingToken;
    }

    if (/^\p{L}[\p{L}\p{M}'’\-]*$/u.test(part)) {
      return {
        type: "word",
        text: part,
        key: normalizeReadingKey(part),
      } as ReadingToken;
    }

    return { type: "punctuation", text: part } as ReadingToken;
  });
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/u)
    .filter(Boolean);
}

export function findSentenceForWord(paragraphs: string[], word: string): string {
  const target = normalizeReadingKey(word);

  for (const paragraph of paragraphs) {
    for (const sentence of splitSentences(paragraph)) {
      const tokens = tokenizeReadingText(sentence).filter((token) => token.type === "word");
      if (tokens.some((token) => token.key === target)) {
        return sentence;
      }
    }
  }

  return paragraphs[0] ?? word;
}

export function toSerbianCyrillic(text: string): string {
  const map: Record<string, string> = {
    a: "а",
    b: "б",
    c: "ц",
    č: "ч",
    ć: "ћ",
    d: "д",
    dž: "џ",
    đ: "ђ",
    e: "е",
    f: "ф",
    g: "г",
    h: "х",
    i: "и",
    j: "ј",
    k: "к",
    l: "л",
    lj: "љ",
    m: "м",
    n: "н",
    nj: "њ",
    o: "о",
    p: "п",
    r: "р",
    s: "с",
    š: "ш",
    t: "т",
    u: "у",
    v: "в",
    z: "з",
    ž: "ж",
  };

  const upperMap: Record<string, string> = {
    A: "А",
    B: "Б",
    C: "Ц",
    Č: "Ч",
    Ć: "Ћ",
    D: "Д",
    DŽ: "Џ",
    Đ: "Ђ",
    E: "Е",
    F: "Ф",
    G: "Г",
    H: "Х",
    I: "И",
    J: "Ј",
    K: "К",
    L: "Л",
    LJ: "Љ",
    M: "М",
    N: "Н",
    NJ: "Њ",
    O: "О",
    P: "П",
    R: "Р",
    S: "С",
    Š: "Ш",
    T: "Т",
    U: "У",
    V: "В",
    Z: "З",
    Ž: "Ж",
  };

  let output = "";

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    const next2 = text[i + 2];

    const pair = `${char}${next ?? ""}`;
    const triple = `${char}${next ?? ""}${next2 ?? ""}`;

    if (upperMap[triple]) {
      output += upperMap[triple];
      i += 2;
      continue;
    }

    if (map[pair]) {
      output += map[pair];
      i += 1;
      continue;
    }

    if (upperMap[char]) {
      output += upperMap[char];
      continue;
    }

    if (map[char]) {
      output += map[char];
      continue;
    }

    output += char;
  }

  return output;
}
