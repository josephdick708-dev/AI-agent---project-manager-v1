import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Santé légère pour Vercel / monitoring (sans exposer de secrets). */
export async function GET() {
  const hasDb = Boolean(process.env.DATABASE_URL?.trim());
  const hasAuth = Boolean(
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim(),
  );
  const hasLlm = Boolean(
    process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim(),
  );

  return NextResponse.json({
    ok: hasDb && hasAuth,
    checks: {
      database: hasDb,
      auth: hasAuth,
      gemini: hasLlm,
    },
  });
}
