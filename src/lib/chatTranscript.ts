import type { UIMessage } from "ai";
import {
  MAX_CHAT_MESSAGES,
  MAX_CHAT_TURNS_SAVE,
  MAX_MESSAGE_TEXT_CHARS,
} from "@/src/lib/limits";

/** Extrait le dialogue depuis le JSON envoyé par le client (useChat). */
export function turnsFromClientMessages(raw: unknown): { role: string; content: string }[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(
      (m): m is { role: string; parts: unknown[] } =>
        typeof m === "object" && m !== null && "role" in m && "parts" in m,
    )
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => {
      const parts = Array.isArray(m.parts) ? m.parts : [];
      const text = parts
        .filter(
          (p): p is { type: string; text: string } =>
            typeof p === "object" &&
            p !== null &&
            "type" in p &&
            (p as { type: string }).type === "text" &&
            typeof (p as { text?: unknown }).text === "string",
        )
        .map((p) => p.text)
        .join("");
      return { role: m.role, content: text };
    })
    .filter((t) => t.content.trim().length > 0);
}

export function validateChatMessagesPayload(raw: unknown): { ok: true } | { ok: false; error: string } {
  if (!Array.isArray(raw)) {
    return { ok: false, error: "Format de messages invalide." };
  }
  if (raw.length === 0) {
    return { ok: false, error: "Aucun message." };
  }
  if (raw.length > MAX_CHAT_MESSAGES) {
    return { ok: false, error: `Trop de messages (max ${MAX_CHAT_MESSAGES}).` };
  }
  for (const m of raw) {
    if (typeof m !== "object" || m === null || !("parts" in m)) {
      continue;
    }
    const parts = (m as { parts: unknown }).parts;
    if (!Array.isArray(parts)) {
      continue;
    }
    for (const p of parts) {
      if (
        typeof p === "object" &&
        p !== null &&
        "type" in p &&
        (p as { type: string }).type === "text" &&
        typeof (p as { text?: unknown }).text === "string" &&
        (p as { text: string }).text.length > MAX_MESSAGE_TEXT_CHARS
      ) {
        return {
          ok: false,
          error: `Un message dépasse ${MAX_MESSAGE_TEXT_CHARS} caractères.`,
        };
      }
    }
  }
  return { ok: true };
}

export function validateChatTurnsForSave(turns: { role: string; content: string }[]) {
  if (turns.length > MAX_CHAT_TURNS_SAVE) {
    return { ok: false as const, error: `Conversation trop longue (max ${MAX_CHAT_TURNS_SAVE} messages).` };
  }
  const total = turns.reduce((n, t) => n + t.content.length, 0);
  if (total > MAX_MESSAGE_TEXT_CHARS * MAX_CHAT_TURNS_SAVE) {
    return { ok: false as const, error: "Conversation trop volumineuse pour être sauvegardée." };
  }
  return { ok: true as const };
}

export function titleFromTurns(turns: { role: string; content: string }[]): string {
  const first = turns.find((t) => t.role === "user");
  if (!first) {
    return "Conversation PEAK-A";
  }
  const raw = first.content.trim().replace(/\s+/g, " ");
  const line = raw.split(/[.!?\n]/)[0]?.trim() || raw;
  return line.length > 70 ? `${line.slice(0, 67)}…` : line;
}

export function textFromUIMessage(m: UIMessage): string {
  return m.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function suggestedTitleFromChat(messages: UIMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) {
    return "Conversation PEAK-A";
  }
  const raw = textFromUIMessage(firstUser).trim().replace(/\s+/g, " ");
  if (raw.length < 3) {
    return "Nouvelle idée";
  }
  const line = raw.split(/[.!?\n]/)[0]?.trim() || raw;
  return line.length > 70 ? `${line.slice(0, 67)}…` : line;
}

export function lastAssistantPreview(messages: UIMessage[], maxLen = 160): string {
  const assistants = messages.filter((m) => m.role === "assistant");
  const last = assistants[assistants.length - 1];
  if (!last) {
    return "";
  }
  const t = textFromUIMessage(last).trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
}
