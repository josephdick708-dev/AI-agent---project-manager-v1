import { NextRequest, NextResponse } from "next/server";
import { rejectIfBodyTooLarge } from "@/src/lib/apiGuards";
import { generateSummaryFromConversation } from "@/src/lib/gemini";
import { requireUser } from "@/src/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
    const body = (await request.json()) as {
      idea?: string;
      understanding?: string;
      questions?: string[];
      answers?: string[];
    };

    const idea = body.idea?.trim() || "";
    const understanding = body.understanding?.trim();
    const questions = body.questions || [];
    const answers = body.answers || [];

    if (!idea || questions.length !== 5 || answers.length !== 5) {
      return NextResponse.json(
        { error: "Le corps doit contenir une idée, 5 questions et 5 réponses." },
        { status: 400 },
      );
    }

    const out = await generateSummaryFromConversation({
      idea,
      understanding,
      questions,
      answers,
    });

    if (!out.ok) {
      return NextResponse.json({ error: out.message }, { status: 502 });
    }

    return NextResponse.json({ summary: out.summary });
  } catch {
    return NextResponse.json(
      { error: "Impossible de générer le bilan pour le moment." },
      { status: 500 },
    );
  }
}
