import { NextRequest, NextResponse } from "next/server";
import { rejectIfBodyTooLarge } from "@/src/lib/apiGuards";
import { analyzeIdeaForCadrage } from "@/src/lib/gemini";
import { requireUser } from "@/src/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const tooLarge = rejectIfBodyTooLarge(request);
  if (tooLarge) {
    return tooLarge;
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  try {
    const body = (await request.json()) as { idea?: string };
    const idea = body.idea?.trim();

    if (!idea) {
      return NextResponse.json({ error: "L'idée est obligatoire." }, { status: 400 });
    }

    const result = await analyzeIdeaForCadrage(idea);

    if (!result.ok) {
      const status =
        result.code === "no_api_key" ? 503
        : result.code === "needs_clarification" ? 422
        : result.code === "upstream" ? 502
        : 500;

      return NextResponse.json(
        { error: result.message, code: result.code },
        { status },
      );
    }

    return NextResponse.json({
      understanding: result.understanding,
      suggestedTitle: result.workingTitle,
      questions: result.questions,
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de lancer l'analyse pour le moment." },
      { status: 500 },
    );
  }
}
