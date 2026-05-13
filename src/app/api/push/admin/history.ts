import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR = path.join(process.cwd(), ".data");
const HISTORY_FILE = path.join(DATA_DIR, "push-history.json");
const MAX_HISTORY = 50;

export type PushHistoryEntry = {
  title: string;
  body: string;
  url: string;
  tag: string;
  icon?: string;
  badge?: string;
  delivered: number;
  removed: number;
  sentAt: string;
  source?: "admin" | "scan";
};

async function readHistory(): Promise<PushHistoryEntry[]> {
  try {
    const raw = await readFile(HISTORY_FILE, "utf-8");
    return JSON.parse(raw) as PushHistoryEntry[];
  } catch {
    return [];
  }
}

async function writeHistory(entries: PushHistoryEntry[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const tmp = `${HISTORY_FILE}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(entries, null, 2) + "\n", "utf-8");
  await rename(tmp, HISTORY_FILE);
}

export async function appendPushHistory(entry: PushHistoryEntry): Promise<void> {
  const history = await readHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
  await writeHistory(history);
}

export async function getPushHistory(limit = 20): Promise<PushHistoryEntry[]> {
  const history = await readHistory();
  return history.slice(0, limit);
}
