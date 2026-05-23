"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { suggestedTitleFromChat } from "@/src/lib/chatTranscript";

export type RestoreChatPayload = {
  key: number;
  title: string;
  messages: UIMessage[];
};

type PeakChatProps = {
  resetSignal: number;
  restore: RestoreChatPayload | null;
  onReloadSessions: () => void;
};

export function PeakChat({ resetSignal, restore, onReloadSessions }: PeakChatProps) {
  const [input, setInput] = useState("");
  const [chatTitle, setChatTitle] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
    }),
  });

  useEffect(() => {
    setMessages([]);
    setInput("");
    setChatTitle("");
    setActionError("");
  }, [resetSignal, setMessages]);

  useEffect(() => {
    if (!restore) {
      return;
    }
    setMessages(restore.messages);
    setChatTitle(restore.title);
    setActionError("");
  }, [restore, setMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";
  const autoTitle = suggestedTitleFromChat(messages);
  const effectiveTitle = chatTitle.trim() || autoTitle;

  async function handleSaveSession() {
    if (messages.length === 0) {
      setActionError("La conversation est vide.");
      return;
    }
    setSaving(true);
    setActionError("");
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          title: effectiveTitle,
          messages,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(data.error || "Sauvegarde échouée.");
        return;
      }
      onReloadSessions();
    } catch {
      setActionError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportWord() {
    if (messages.length === 0) {
      setActionError("Rien à exporter.");
      return;
    }
    setActionError("");
    try {
      const res = await fetch("/api/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "chat",
          title: effectiveTitle,
          messages,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setActionError(data.error || "Export impossible.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${effectiveTitle.replace(/[^\w\-]+/g, "_").slice(0, 40)}_chat.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setActionError("Export impossible.");
    }
  }

  function submitMessage() {
    const t = input.trim();
    if (!t || status !== "ready") {
      return;
    }
    sendMessage({ text: t });
    setInput("");
  }

  function onFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitMessage();
  }

  const showWelcome = messages.length === 0 && status === "ready";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-4 md:px-8">
        {showWelcome ? (
          <div className="mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-xl font-bold text-white shadow-lg">
              P
            </div>
            <h1 className="text-xl font-semibold text-sky-950 md:text-2xl">Discute avec PEAK-A</h1>
            <p className="mt-2 text-sm text-sky-900/75">
              Un mentor IA en direct : il réagit à tes mots, creuse ton idée et t&apos;aide à cadrer — comme
              un chat, pas un formulaire figé.
            </p>
            <p className="mt-4 text-xs text-sky-800/60">
              Astuce : décris problème, pour qui, et ce que tu veux construire. Les réponses arrivent en
              temps réel.
            </p>
          </div>
        ) : null}

        <div className="mx-auto max-w-3xl space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  m.role === "user"
                    ? "glass-panel max-w-[92%] rounded-2xl rounded-br-md px-4 py-3 text-sm text-sky-950 shadow-md md:max-w-[80%]"
                    : "glass-card max-w-[92%] rounded-2xl rounded-bl-md border-sky-200/50 px-4 py-3 text-sm leading-relaxed text-sky-950 md:max-w-[85%]"
                }
              >
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700/70">
                  {m.role === "user" ? "Toi" : "PEAK-A"}
                </p>
                {m.parts.map((part, i) => {
                  if (part.type === "text") {
                    return (
                      <div key={`${m.id}-${i}`} className="whitespace-pre-wrap">
                        {part.text}
                        {part.state === "streaming" ? (
                          <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-sky-500 align-middle" />
                        ) : null}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}

          {status === "submitted" && messages[messages.length - 1]?.role === "user" ? (
            <div className="flex justify-start">
              <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3 text-sm text-sky-800/80">
                PEAK-A réfléchit…
              </div>
            </div>
          ) : null}

          <div ref={bottomRef} />
        </div>

        {(error || actionError) ? (
          <p className="mx-auto mt-4 max-w-3xl text-center text-sm text-red-700">
            {actionError || error?.message || "Erreur"}
          </p>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-white/30 bg-gradient-to-t from-sky-200/90 to-transparent px-4 pb-5 pt-3 backdrop-blur-md">
        <div className="mx-auto mb-2 flex max-w-3xl flex-wrap items-center gap-2">
          <input
            type="text"
            value={chatTitle}
            onChange={(e) => setChatTitle(e.target.value)}
            placeholder={`Titre : ${autoTitle}`}
            className="glass-input min-w-[160px] flex-1 rounded-xl px-3 py-2 text-xs text-sky-950 outline-none placeholder:text-sky-800/45"
          />
          <button
            type="button"
            onClick={() => void handleSaveSession()}
            disabled={saving || messages.length === 0}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {saving ? "…" : "Sauver"}
          </button>
          <button
            type="button"
            onClick={() => void handleExportWord()}
            disabled={messages.length === 0}
            className="rounded-xl border border-white/50 bg-white/25 px-3 py-2 text-xs font-medium text-sky-950 disabled:opacity-50"
          >
            Word
          </button>
          {busy ? (
            <button
              type="button"
              onClick={() => void stop()}
              className="rounded-xl border border-red-200/80 bg-white/30 px-3 py-2 text-xs text-red-800"
            >
              Stop
            </button>
          ) : null}
        </div>

        <form onSubmit={onFormSubmit} className="mx-auto max-w-3xl">
          <div className="glass-panel flex items-end gap-2 rounded-2xl p-2 pl-4 shadow-lg">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitMessage();
                }
              }}
              rows={2}
              disabled={status !== "ready"}
              placeholder="Écris ton message… (Entrée envoie, Maj+Entrée nouvelle ligne)"
              className="max-h-36 min-h-[48px] flex-1 resize-y bg-transparent py-2 text-sm text-sky-950 outline-none placeholder:text-sky-800/45 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status !== "ready" || !input.trim()}
              className="mb-1 flex h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 px-4 text-sm font-semibold text-white disabled:opacity-40"
            >
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
