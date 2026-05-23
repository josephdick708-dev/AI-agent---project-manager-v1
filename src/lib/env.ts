/**
 * Variables d'environnement — validation au runtime (surtout en production / Vercel).
 */

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (secret) {
    return secret;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET (ou NEXTAUTH_SECRET) est obligatoire en production.");
  }
  return "dev-only-insecure-secret";
}

export function getAppUrl(): string {
  const explicit = process.env.AUTH_URL?.trim() || process.env.NEXTAUTH_URL?.trim();
  if (explicit) {
    return explicit;
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    return `https://${vercel}`;
  }
  return "http://localhost:3000";
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
