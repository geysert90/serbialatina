// ── Learning entry from Directus ──────────────────────────────────────────

export type EntryType =
  | "word"
  | "phrase"
  | "expression"
  | "sentence"
  | "question";

export type Difficulty = "starter" | "basic" | "intermediate";

export type LearningEntry = {
  id: number;
  status: "published" | "draft";
  sort: number;
  unit: number;
  slug: string;
  entry_type: EntryType;
  difficulty: Difficulty;
  part_of_speech: string;

  serbian_latin: string;
  serbian_cyrillic: string;
  spanish_translation: string;

  pronunciation_hint?: string | null;
  literal_translation?: string | null;
  grammatical_gender?: string | null;

  example_latin?: string | null;
  example_cyrillic?: string | null;
  example_spanish?: string | null;

  usage_notes?: string | null;

  /** Directus file UUID — transform to full URL via getEntryAudioUrl() */
  audio_file?: string | null;
};

// ── Unit info ─────────────────────────────────────────────────────────────

export type UnitInfo = {
  id: number;
  count: number;
  label: string;
};

// ── User progress ─────────────────────────────────────────────────────────

export type UserProgress = {
  completedEntries: number[];
  completedUnits: number[];
  streak: {
    count: number;
    lastDate: string | null; // "YYYY-MM-DD"
  };
  xp: number;
};

export type UnitProgress = {
  unitId: number;
  completed: number;
  total: number;
  percentage: number;
};

// ── Lesson exercise types ─────────────────────────────────────────────────

export type ChoiceExercise = {
  type: "choice";
  entry: LearningEntry;
  options: LearningEntry[]; // 4 options including the correct one
  correctId: number;
};

export type TypeExercise = {
  type: "type";
  entry: LearningEntry;
};

export type FlashcardExercise = {
  type: "flashcard";
  entry: LearningEntry;
};

export type LessonStep = FlashcardExercise | ChoiceExercise | TypeExercise;
