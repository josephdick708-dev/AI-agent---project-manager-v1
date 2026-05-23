"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email: email.trim(),
          password,
          confirm,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };

      if (!res.ok) {
        setError(data.error || "Impossible de créer le compte.");
        return;
      }

      router.push("/login?registered=1");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessaie plus tard.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Link
        href="/login"
        className="mb-6 text-sm font-medium text-sky-900/70 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-950"
      >
        ← Déjà un compte ? Connexion
      </Link>
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-xl font-bold text-white shadow-lg">
            P
          </div>
          <h1 className="text-2xl font-semibold text-sky-950">Créer un compte</h1>
          <p className="mt-2 text-sm text-sky-900/70">Rejoins PEAK-A pour cadrer tes idées avec l’IA.</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-sky-950">
              Nom
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full rounded-xl px-4 py-3 text-sky-950 outline-none ring-sky-400/50 placeholder:text-sky-800/40 focus:ring-2"
              placeholder="Ton nom"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-sky-950">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input w-full rounded-xl px-4 py-3 text-sky-950 outline-none ring-sky-400/50 placeholder:text-sky-800/40 focus:ring-2"
              placeholder="toi@exemple.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-sky-950">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="glass-input w-full rounded-xl px-4 py-3 text-sky-950 outline-none ring-sky-400/50 placeholder:text-sky-800/40 focus:ring-2"
              placeholder="Au moins 8 caractères"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="mb-1.5 block text-sm font-medium text-sky-950">
              Confirmer le mot de passe
            </label>
            <input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="glass-input w-full rounded-xl px-4 py-3 text-sky-950 outline-none ring-sky-400/50 placeholder:text-sky-800/40 focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:brightness-105 disabled:opacity-60"
          >
            {loading ? "Création…" : "S’inscrire"}
          </button>
        </form>
      </div>
    </div>
  );
}
