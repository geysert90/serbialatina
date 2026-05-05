import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type UserProfile = {
  userId: string;
  whatsapp?: string;
  coverPhotoUrl?: string;
  updatedAt: string;
};

type ProfileStore = {
  profiles: UserProfile[];
};

const STORE_PATH = path.join(process.cwd(), ".data", "user-profiles.json");

function emptyStore(): ProfileStore {
  return { profiles: [] };
}

async function readStore(): Promise<ProfileStore> {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<ProfileStore>;

    if (!Array.isArray(parsed.profiles)) {
      return emptyStore();
    }

    return {
      profiles: parsed.profiles.filter(
        (profile): profile is UserProfile =>
          typeof profile.userId === "string" && typeof profile.updatedAt === "string",
      ),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return emptyStore();
    }

    throw error;
  }
}

async function writeStore(store: ProfileStore): Promise<void> {
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const store = await readStore();

  return store.profiles.find((profile) => profile.userId === userId) ?? null;
}

export async function updateUserProfile(input: {
  userId: string;
  whatsapp?: string;
  coverPhotoUrl?: string;
}): Promise<UserProfile> {
  const store = await readStore();
  const existingIndex = store.profiles.findIndex((profile) => profile.userId === input.userId);
  const existing = existingIndex >= 0 ? store.profiles[existingIndex] : undefined;
  const updated: UserProfile = {
    userId: input.userId,
    whatsapp: input.whatsapp?.trim() || undefined,
    coverPhotoUrl: input.coverPhotoUrl || existing?.coverPhotoUrl,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    store.profiles[existingIndex] = updated;
  } else {
    store.profiles.push(updated);
  }

  await writeStore(store);

  return updated;
}
