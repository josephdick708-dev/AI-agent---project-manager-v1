/** Limites anti-abus pour les routes API (serverless). */

export const MAX_CHAT_MESSAGES = 80;
export const MAX_MESSAGE_TEXT_CHARS = 12_000;
export const MAX_CHAT_TURNS_SAVE = 200;
export const MAX_TITLE_CHARS = 200;
export const MAX_EMAIL_CHARS = 254;
export const MAX_PASSWORD_CHARS = 128;
export const MAX_NAME_CHARS = 120;
export const MAX_JSON_BODY_BYTES = 2 * 1024 * 1024;
