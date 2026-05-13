export const USER_ROLES = [
  "subscriber",
  "contributor",
  "author",
  "editor",
  "administrator",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type RoleCapability =
  | "comment"
  | "ask_question"
  | "submit_event"
  | "publish_event"
  | "moderate_content"
  | "manage_users";

export const DEFAULT_USER_ROLE: UserRole = "subscriber";

const ROLE_LABELS: Record<UserRole, string> = {
  subscriber: "Suscriptor",
  contributor: "Colaborador",
  author: "Autor",
  editor: "Editor",
  administrator: "Administrador",
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  subscriber: "Puede comentar, hacer preguntas y proponer eventos para revisión.",
  contributor: "Puede enviar contenido y eventos para revisión editorial.",
  author: "Puede preparar y publicar su propio contenido aprobado.",
  editor: "Puede publicar eventos y moderar contenido de la comunidad.",
  administrator: "Tiene acceso completo a publicación, moderación y usuarios.",
};

const ROLE_CAPABILITIES: Record<UserRole, RoleCapability[]> = {
  subscriber: ["comment", "ask_question", "submit_event"],
  contributor: ["comment", "ask_question", "submit_event"],
  author: ["comment", "ask_question", "submit_event", "publish_event"],
  editor: [
    "comment",
    "ask_question",
    "submit_event",
    "publish_event",
    "moderate_content",
  ],
  administrator: [
    "comment",
    "ask_question",
    "submit_event",
    "publish_event",
    "moderate_content",
    "manage_users",
  ],
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function normalizeUserRole(value: unknown): UserRole {
  return isUserRole(value) ? value : DEFAULT_USER_ROLE;
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function getRoleDescription(role: UserRole): string {
  return ROLE_DESCRIPTIONS[role];
}

export function getRoleCapabilities(role: UserRole): RoleCapability[] {
  return ROLE_CAPABILITIES[role];
}

export function hasCapability(
  role: UserRole | undefined,
  capability: RoleCapability,
): boolean {
  return ROLE_CAPABILITIES[normalizeUserRole(role)].includes(capability);
}

export function canComment(role: UserRole | undefined): boolean {
  return hasCapability(role, "comment");
}

export function canAskQuestion(role: UserRole | undefined): boolean {
  return hasCapability(role, "ask_question");
}

export function canSubmitEvent(role: UserRole | undefined): boolean {
  return hasCapability(role, "submit_event");
}

export function canPublishEvent(role: UserRole | undefined): boolean {
  return hasCapability(role, "publish_event");
}

export function canModerateContent(role: UserRole | undefined): boolean {
  return hasCapability(role, "moderate_content");
}

export function canManageUsers(role: UserRole | undefined): boolean {
  return hasCapability(role, "manage_users");
}
