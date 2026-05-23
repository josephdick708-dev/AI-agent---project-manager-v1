import { NextRequest, NextResponse } from "next/server";
import { rejectIfBodyTooLarge } from "@/src/lib/apiGuards";
import { turnsFromClientMessages, validateChatTurnsForSave } from "@/src/lib/chatTranscript";
import { buildChatDocx, buildProjectDocx } from "@/src/lib/docx";
import { MAX_TITLE_CHARS } from "@/src/lib/limits";
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
    const body = (await request.json()) as {
      mode?: string;
      title?: string;
      idea?: string;
      questions?: string[];
      answers?: string[];
      summary?: string;
      messages?: unknown;
    };

    if (body.mode === "chat" && body.messages != null) {
      const turns = turnsFromClientMessages(body.messages);
      if (turns.length === 0) {
        return NextResponse.json({ error: "Conversation vide." }, { status: 400 });
      }
      const turnCheck = validateChatTurnsForSave(turns);
      if (!turnCheck.ok) {
        return NextResponse.json({ error: turnCheck.error }, { status: 400 });
      }
      const title = body.title?.trim().slice(0, MAX_TITLE_CHARS) || "PEAK-A";
      const buffer = await buildChatDocx({ title, turns });
      const safeTitle = title.replace(/[^\w\-]+/g, "_").slice(0, 40) || "projet";

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${safeTitle}_chat.docx"`,
        },
      });
    }

    const title = body.title?.trim() || "Projet PEAK-A";
    const idea = body.idea?.trim() || "";
    const questions = body.questions || [];
    const answers = body.answers || [];
    const summary = body.summary?.trim() || "";

    if (!idea || questions.length !== 5 || answers.length !== 5 || !summary) {
      return NextResponse.json(
        { error: "Le document requiert idée, 5 questions, 5 réponses et un bilan." },
        { status: 400 },
      );
    }

    const buffer = await buildProjectDocx({ title, idea, questions, answers, summary });
    const safeTitle = title.replace(/[^\w\-]+/g, "_").slice(0, 40) || "projet";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${safeTitle}_cadrage.docx"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de générer le document Word pour le moment." },
      { status: 500 },
    );
  }
}
