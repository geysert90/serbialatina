import { get as httpsGet } from "node:https";

import { cacheLife } from "next/cache";

export type JoobleJob = {
  id: string | number;
  title: string;
  location: string;
  snippet: string;
  salary?: string;
  source?: string;
  type?: string;
  link: string;
  company?: string;
  updated?: string;
  companyLogoUrl?: string;
};

export type JoobleSearchParams = {
  keywords?: string;
  location: string;
  page?: number;
  radius?: "0" | "4" | "8" | "16" | "26" | "40" | "80";
  resultOnPage?: number;
  cacheVersion?: string;
};

export type JoobleSearchResult = {
  jobs: JoobleJob[];
  totalCount: number;
  page: number;
  perPage: number;
  configured: boolean;
  error?: string;
};

type InfostudRssItem = {
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  guid?: string;
};

type JoobleApiJob = {
  id?: string | number;
  title?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  source?: string;
  type?: string;
  link?: string;
  company?: string;
  updated?: string;
  companyLogoUrl?: string;
  companyLogo?: string;
  logo?: string;
  image?: string;
};

type JoobleApiResponse = {
  totalCount?: number;
  jobs?: JoobleApiJob[];
};

const JOOBLE_API_KEY = process.env.JOOBLE_API_KEY?.trim();
const JOOBLE_API_BASE = "https://jooble.org/api";
const INFOSTUD_RSS_URL = "https://rss.infostud.com/poslovi/rss.php";
export const JOBS_SOURCE_CACHE_VERSION = "jooble-infostud-rss-php-v4";
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 50;

export const SERBIAN_JOB_CITIES = [
  { value: "Belgrade, Serbia", label: "Belgrado" },
  { value: "Novi Sad, Serbia", label: "Novi Sad" },
  { value: "Niš, Serbia", label: "Niš" },
  { value: "Kragujevac, Serbia", label: "Kragujevac" },
  { value: "Subotica, Serbia", label: "Subotica" },
  { value: "Zrenjanin, Serbia", label: "Zrenjanin" },
  { value: "Pančevo, Serbia", label: "Pančevo" },
  { value: "Čačak, Serbia", label: "Čačak" },
  { value: "Kraljevo, Serbia", label: "Kraljevo" },
  { value: "Novi Pazar, Serbia", label: "Novi Pazar" },
  { value: "Leskovac, Serbia", label: "Leskovac" },
  { value: "Valjevo, Serbia", label: "Valjevo" },
  { value: "Smederevo, Serbia", label: "Smederevo" },
  { value: "Kruševac, Serbia", label: "Kruševac" },
  { value: "Vranje, Serbia", label: "Vranje" },
] as const;

const DEFAULT_JOB_CITY = SERBIAN_JOB_CITIES[0].value;

function cleanText(value: string | undefined, fallback = ""): string {
  return value?.replace(/\s+/g, " ").trim() || fallback;
}

function stripJobHtml(value: string): string {
  return decodeXmlEntities(value)
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeXmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
    const named = namedEntities[code.toLowerCase()];

    if (named) {
      return named;
    }

    if (code.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }

    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }

    return entity;
  });
}

function readGoogleTranslateResponse(data: unknown): string {
  if (!Array.isArray(data)) {
    return "";
  }

  const chunks = data[0];

  if (!Array.isArray(chunks)) {
    return "";
  }

  return chunks
    .map((chunk) => (Array.isArray(chunk) && typeof chunk[0] === "string" ? chunk[0] : ""))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

async function translateViaGoogle(value: string): Promise<string> {
  if (!value) {
    return "";
  }

  try {
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", "es");
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", value.slice(0, 900));

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return value;
    }

    const translated = readGoogleTranslateResponse(await response.json());
    return translated || value;
  } catch {
    return value;
  }
}

async function translateSnippetToSpanish(value: string): Promise<string> {
  const cleaned = stripJobHtml(value);
  return translateViaGoogle(cleaned);
}

async function translateTitleToSpanish(value: string): Promise<string> {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return "";
  }

  // Only translate if the title contains non-Spanish characters or patterns
  // (avoids double-translating already-Spanish titles)
  const spanishPattern = /[áéíóúñü¿¡]/i;
  if (spanishPattern.test(cleaned)) {
    return cleaned;
  }

  return translateViaGoogle(cleaned);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function firstValidUrl(...values: Array<string | undefined>): string | undefined {
  return values.map((value) => cleanText(value)).find((value) => value && isValidUrl(value));
}

function readRssTag(itemXml: string, tagName: string): string {
  const tagPattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = itemXml.match(tagPattern);

  return match ? stripJobHtml(match[1]) : "";
}

function parseInfostudRss(xml: string): InfostudRssItem[] {
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/gi))
    .map((match) => {
      const itemXml = match[1];

      return {
        title: readRssTag(itemXml, "title"),
        link: readRssTag(itemXml, "link"),
        description: readRssTag(itemXml, "description"),
        pubDate: readRssTag(itemXml, "pubDate"),
        guid: readRssTag(itemXml, "guid"),
      };
    })
    .filter((item) => item.title && item.link);
}

function fetchInfostudRssText(): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = httpsGet(
      INFOSTUD_RSS_URL,
      {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml",
          "User-Agent": "SerbiaLatina/1.0 (+https://serbialatina.com)",
        },
        timeout: 15000,
      },
      (response) => {
        const statusCode = response.statusCode ?? 0;

        if (statusCode < 200 || statusCode >= 300) {
          response.resume();
          reject(new Error(`Infostud RSS respondió con estado ${statusCode}.`));
          return;
        }

        response.setEncoding("utf8");

        let data = "";
        response.on("data", (chunk: string) => {
          data += chunk;
        });
        response.on("end", () => resolve(data));
      },
    );

    request.on("timeout", () => {
      request.destroy(new Error("Infostud RSS tardó demasiado en responder."));
    });
    request.on("error", reject);
  });
}

function splitInfostudCompanyAndLocation(description: string): { company?: string; location: string } {
  const parts = cleanText(description).split(" - ");

  if (parts.length < 2) {
    return { company: cleanText(description), location: "Serbia" };
  }

  return {
    company: parts.slice(0, -1).join(" - ").trim(),
    location: parts.at(-1)?.trim() || "Serbia",
  };
}

function normalizeLocationSearchText(value: string): string {
  return cleanText(value)
    .toLocaleLowerCase("sr-RS")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getInfostudLocationTerms(location: string): string[] {
  const normalizedLocation = normalizeJoobleLocation(location);
  const selectedCity = SERBIAN_JOB_CITIES.find((city) => city.value === normalizedLocation);
  const rawCityName = normalizedLocation.split(",")[0]?.trim() || normalizedLocation;
  const cityName = selectedCity?.value.split(",")[0]?.trim() || rawCityName;
  const label = selectedCity?.label || cityName;
  const aliasesByCity: Record<string, string[]> = {
    Belgrade: ["Beograd", "Belgrade"],
    Niš: ["Niš", "Nis"],
    Čačak: ["Čačak", "Cacak"],
    Pančevo: ["Pančevo", "Pancevo"],
    Kruševac: ["Kruševac", "Krusevac"],
  };

  return Array.from(new Set([cityName, label, ...(aliasesByCity[cityName] ?? [])]))
    .map(normalizeLocationSearchText)
    .filter(Boolean);
}

function infostudItemMatchesLocation(item: InfostudRssItem, location: string): boolean {
  const terms = getInfostudLocationTerms(location);

  if (terms.length === 0) {
    return true;
  }

  const itemLocation = splitInfostudCompanyAndLocation(item.description).location;
  const haystack = normalizeLocationSearchText(`${itemLocation} ${item.description}`);

  return terms.some((term) => haystack.includes(term));
}

async function normalizeInfostudJob(item: InfostudRssItem, index: number): Promise<JoobleJob> {
  const companyLocation = splitInfostudCompanyAndLocation(item.description);

  return {
    id: item.guid || `infostud-${item.link}-${index}`,
    title: await translateTitleToSpanish(item.title),
    location: companyLocation.location,
    snippet: await translateSnippetToSpanish(item.description),
    source: "Infostud RSS",
    link: item.link.replace(/^http:/, "https:"),
    company: companyLocation.company,
    updated: item.pubDate,
  };
}

export function normalizeJoobleLocation(value: string | undefined): string {
  const cleaned = cleanText(value);
  const normalized = cleaned.toLocaleLowerCase("sr-RS");
  const match = SERBIAN_JOB_CITIES.find((city) => {
    const value = city.value.toLocaleLowerCase("sr-RS");
    const cityName = value.split(",")[0]?.trim();

    return (
      value === normalized ||
      cityName === normalized ||
      city.label.toLocaleLowerCase("sr-RS") === normalized
    );
  });

  return match?.value ?? DEFAULT_JOB_CITY;
}

export function getJoobleCityLabel(value: string | undefined): string {
  const normalized = normalizeJoobleLocation(value);
  return SERBIAN_JOB_CITIES.find((city) => city.value === normalized)?.label ?? normalized;
}

function normalizePage(page: number | undefined): number {
  if (!page || Number.isNaN(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function normalizePerPage(resultOnPage: number | undefined): number {
  if (!resultOnPage || Number.isNaN(resultOnPage)) {
    return DEFAULT_PER_PAGE;
  }

  return Math.min(Math.max(Math.floor(resultOnPage), 1), MAX_PER_PAGE);
}

async function normalizeJob(job: JoobleApiJob, index: number): Promise<JoobleJob | null> {
  const title = cleanText(job.title);
  const link = cleanText(job.link);

  if (!title || !link) {
    return null;
  }

  return {
    id: job.id ?? `${title}-${index}`,
    title: await translateTitleToSpanish(title),
    location: cleanText(job.location, "Ubicación no especificada"),
    snippet: await translateSnippetToSpanish(cleanText(job.snippet)),
    salary: cleanText(job.salary),
    source: cleanText(job.source),
    type: cleanText(job.type),
    link,
    company: cleanText(job.company),
    updated: cleanText(job.updated),
    companyLogoUrl: firstValidUrl(job.companyLogoUrl, job.companyLogo, job.logo, job.image),
  };
}

function compareJobsByUpdatedDesc(a: JoobleJob, b: JoobleJob): number {
  const timeA = a.updated ? new Date(a.updated).getTime() : 0;
  const timeB = b.updated ? new Date(b.updated).getTime() : 0;
  const safeTimeA = Number.isNaN(timeA) ? 0 : timeA;
  const safeTimeB = Number.isNaN(timeB) ? 0 : timeB;

  return safeTimeB - safeTimeA;
}

export function sortJoobleJobsByLatest(jobs: JoobleJob[]): JoobleJob[] {
  return [...jobs].sort(compareJobsByUpdatedDesc);
}

export async function searchJoobleJobs({
  keywords,
  location,
  page,
  radius = "80",
  resultOnPage,
}: JoobleSearchParams): Promise<JoobleSearchResult> {
  "use cache";

  cacheLife("hours");

  const normalizedPage = normalizePage(page);
  const perPage = normalizePerPage(resultOnPage);

  if (!JOOBLE_API_KEY) {
    return {
      jobs: [],
      totalCount: 0,
      page: normalizedPage,
      perPage,
      configured: false,
      error: "Falta configurar JOOBLE_API_KEY en el entorno del servidor.",
    };
  }

  const payload = {
    keywords: cleanText(keywords),
    location: normalizeJoobleLocation(location),
    radius,
    page: String(normalizedPage),
    ResultOnPage: perPage,
    companysearch: "false",
  };

  try {
    const response = await fetch(`${JOOBLE_API_BASE}/${JOOBLE_API_KEY}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        jobs: [],
        totalCount: 0,
        page: normalizedPage,
        perPage,
        configured: true,
        error: `Jooble respondió con estado ${response.status}.`,
      };
    }

    const data = (await response.json()) as JoobleApiResponse;
    const jobs = sortJoobleJobsByLatest(
      (await Promise.all((data.jobs ?? []).map((job, index) => normalizeJob(job, index))))
        .filter((job): job is JoobleJob => Boolean(job)),
    );

    return {
      jobs,
      totalCount: data.totalCount ?? jobs.length,
      page: normalizedPage,
      perPage,
      configured: true,
    };
  } catch (error) {
    return {
      jobs: [],
      totalCount: 0,
      page: normalizedPage,
      perPage,
      configured: true,
      error: error instanceof Error ? error.message : "No se pudo consultar Jooble.",
    };
  }
}

export async function searchInfostudJobs({
  location,
  page,
  resultOnPage,
}: JoobleSearchParams): Promise<JoobleSearchResult> {
  "use cache";

  cacheLife("hours");

  const normalizedPage = normalizePage(page);
  const perPage = normalizePerPage(resultOnPage);

  if (normalizedPage > 1) {
    return {
      jobs: [],
      totalCount: 0,
      page: normalizedPage,
      perPage,
      configured: true,
    };
  }

  try {
    const rssText = await fetchInfostudRssText();
    const items = parseInfostudRss(rssText).filter((item) => infostudItemMatchesLocation(item, location));
    const jobs = sortJoobleJobsByLatest(
      await Promise.all(items.slice(0, perPage).map((item, index) => normalizeInfostudJob(item, index))),
    );

    return {
      jobs,
      totalCount: items.length,
      page: normalizedPage,
      perPage,
      configured: true,
    };
  } catch (error) {
    return {
      jobs: [],
      totalCount: 0,
      page: normalizedPage,
      perPage,
      configured: true,
      error: error instanceof Error ? error.message : "No se pudo consultar Infostud RSS.",
    };
  }
}

export async function searchSerbiaJobs(params: JoobleSearchParams): Promise<JoobleSearchResult> {
  "use cache";

  cacheLife("hours");

  const versionedParams = { ...params, cacheVersion: params.cacheVersion ?? JOBS_SOURCE_CACHE_VERSION };
  const [joobleResult, infostudResult] = await Promise.all([
    searchJoobleJobs(versionedParams),
    searchInfostudJobs(versionedParams),
  ]);
  const jobs = sortJoobleJobsByLatest([...joobleResult.jobs, ...infostudResult.jobs]);
  const errors = [joobleResult.error, infostudResult.error].filter(Boolean);
  const showError = jobs.length === 0 ? errors.join(" ") : infostudResult.error;

  return {
    jobs,
    totalCount: joobleResult.totalCount + infostudResult.totalCount,
    page: joobleResult.page,
    perPage: joobleResult.perPage,
    configured: joobleResult.configured || infostudResult.configured,
    error: showError || undefined,
  };
}

export function getJoobleDefaults(): { keywords: string; location: string } {
  return {
    keywords: "",
    location: DEFAULT_JOB_CITY,
  };
}
