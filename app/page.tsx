"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { PeakChat, type RestoreChatPayload } from "./components/PeakChat";

type SavedSession = {
  id: string;
  title: string;
  idea: string;
  summary: string;
  updatedAt: string;
};

export default function Home() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<SavedSession[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatReset, setChatReset] = useState(0);
  const [restore, setRestore] = useState<RestoreChatPayload | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      void loadSessions();
    }
  }, [session?.user?.id]);

  async function loadSessions() {
    try {
      const response = await fetch("/api/sessions");
      if (response.status === 401) {
        setSessions([]);
        return;
      }
      const json = (await response.json()) as { sessions?: SavedSession[] };
      const list = json.sessions || [];
      setSessions(
        [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
      );
    } catch {
      setSessions([]);
    }
  }

  function newChat() {
    setRestore(null);
    setChatReset((k) => k + 1);
  }

  async function openSession(sessionId: string) {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (!res.ok) {
        return;
      }
      const data = (await res.json()) as {
        title?: string;
        messages?: UIMessage[];
      };
      const messages = Array.isArray(data.messages) ? data.messages : [];
      setRestore({
        key: Date.now(),
        title: data.title || "Session",
        messages,
      });
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside
        className={`glass-sidebar flex shrink-0 flex-col transition-[width] duration-200 ${
          sidebarOpen ? "w-64" : "w-0 overflow-hidden border-0"
        }`}
      >
        <div className="flex h-full min-h-0 flex-col p-3">
          <div className="glass-card mb-4 flex items-center gap-3 rounded-2xl p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 text-sm font-bold text-white">
              {(session?.user?.name?.[0] || session?.user?.email?.[0] || "?").toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sky-950">
                {session?.user?.name || "Utilisateur"}
              </p>
              <p className="truncate text-xs text-sky-900/60">{session?.user?.email || ""}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={newChat}
            className="mb-4 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:brightness-105"
          >
            <IconPlus className="h-4 w-4" />
            Nouvelle conversation
          </button>

          <nav className="flex flex-1 flex-col gap-1 text-sm">
            <NavItem active icon={<IconChat />} label="Chat PEAK-A" />
            <NavItem icon={<IconBookmark />} label="Sessions" />
            <NavItem icon={<IconLayers />} label="Composer" />
            <NavItem icon={<IconClock />} label="Historique" />
            <NavItem icon={<IconHelp />} label="FAQ" />
          </nav>

          <div className="mt-auto space-y-1 border-t border-white/30 pt-3">
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-sky-950/80 transition hover:bg-white/20"
            >
              <IconUserPlus className="h-4 w-4" />
              Créer un compte
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sky-950/80 transition hover:bg-white/20"
            >
              <IconSettings className="h-4 w-4" />
              Paramètres
            </button>
            <button
              type="button"
              onClick={() => void signOut({ callbackUrl: "/login" })}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sky-950/80 transition hover:bg-white/20"
            >
              <IconLogout className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-2 border-b border-white/25 px-4 py-3 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className="rounded-lg p-2 text-sky-950/70 hover:bg-white/20"
            aria-label="Basculer le menu"
          >
            <IconMenu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-sky-950">PEAK-A</span>
        </header>

        <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
          <PeakChat resetSignal={chatReset} restore={restore} onReloadSessions={loadSessions} />

          {sidebarOpen && sessions.length > 0 ? (
            <aside className="hidden w-56 shrink-0 flex-col overflow-y-auto border-l border-white/25 bg-white/10 p-3 backdrop-blur-xl xl:flex">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-900/50">Récent</p>
              <div className="flex flex-col gap-2">
                {sessions.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => void openSession(s.id)}
                    className="glass-card rounded-xl p-2.5 text-left text-xs text-sky-950 transition hover:bg-white/30"
                  >
                    <span className="line-clamp-2 font-medium">{s.title}</span>
                  </button>
                ))}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition ${
        active ? "bg-white/25 font-medium text-sky-950" : "text-sky-950/75 hover:bg-white/15"
      }`}
    >
      <span className="text-sky-600">{icon}</span>
      {label}
    </button>
  );
}

function IconPlus(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function IconMenu(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function IconBookmark() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7l8-4 8 4M4 7v10l8 4 8-4V7M4 7l8 4 8-4" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconHelp() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconSettings({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconUserPlus({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a3 3 0 11-6 0 3 3 0 016 0zM6.31 15.117A7.5 7.5 0 0119.5 21" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={className ?? "h-4 w-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}
