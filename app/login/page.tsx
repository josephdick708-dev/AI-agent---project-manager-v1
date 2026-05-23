"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl") || "/";
  const callbackUrl =
    rawCallback.startsWith("/") && !rawCallback.startsWith("//") ? rawCallback : "/";
  const justRegistered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError("E-mail ou mot de passe incorrect.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <Link
        href="/register"
        className="mb-6 text-sm font-medium text-sky-900/70 underline decoration-sky-400/40 underline-offset-4 hover:text-sky-950"
      >
        Pas encore de compte ? S’inscrire
      </Link>
      <div className="glass-panel w-full max-w-md rounded-3xl p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-500 text-xl font-bold text-white shadow-lg">
            P
          </div>
          <h1 className="text-2xl font-semibold text-sky-950">Connexion</h1>
          <p className="mt-2 text-sm text-sky-900/70">Accède à ton espace PEAK-A.</p>
          {justRegistered ? (
            <p className="mt-3 rounded-xl bg-white/40 px-3 py-2 text-sm text-emerald-800">
              Compte créé. Tu peux te connecter.
            </p>
          ) : null}
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sky-900">Chargement…</div>}>
      <LoginForm />
    </Suspense>
  );
}
