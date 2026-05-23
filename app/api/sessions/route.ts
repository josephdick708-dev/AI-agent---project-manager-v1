import { NextRequest, NextResponse } from "next/server";
import { rejectIfBodyTooLarge } from "@/src/lib/apiGuards";
import {
  titleFromTurns,
  turnsFromClientMessages,
  validateChatTurnsForSave,
} from "@/src/lib/chatTranscript";
import { MAX_TITLE_CHARS } from "@/src/lib/limits";
import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }
  const { userId } = authResult;

  try {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
      take: 20,
    });

    const sessions = projects.map((project) => {
      const assistants = project.messages.filter((m) => m.role === "assistant");
      const summary =
        assistants[assistants.length - 1]?.content || project.description || "";

      return {
        id: project.id,
        title: project.title,
        idea: project.description || "",
        summary,
        updatedAt: project.updatedAt,
      };
    });

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ sessions: [] });
  }
}

export async function POST(request: NextRequest) {
  const tooLarge = rejectIfBodyTooLarge(request);
  if (tooLarge) {
    return tooLarge;
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }
  const { userId } = authResult;

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
        return NextResponse.json(
          { error: "Aucun message à sauvegarder dans cette conversation." },
          { status: 400 },
        );
      }

      const turnCheck = validateChatTurnsForSave(turns);
      if (!turnCheck.ok) {
        return NextResponse.json({ error: turnCheck.error }, { status: 400 });
      }

      const title =
        body.title?.trim().slice(0, MAX_TITLE_CHARS) || titleFromTurns(turns);
      const description = turns.find((t) => t.role === "user")?.content.slice(0, 2000) || "";
      const lastAssistant = [...turns].reverse().find((t) => t.role === "assistant")?.content || "";

      const created = await prisma.project.create({
        data: {
          userId,
          title,
          description,
          messages: {
            create: turns.map((t) => ({
              role: t.role,
              content: t.content,
            })),
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          updatedAt: true,
        },
      });

      return NextResponse.json({
        session: {
          id: created.id,
          title: created.title,
          idea: created.description || "",
          summary: lastAssistant,
          updatedAt: created.updatedAt,
        },
      });
    }

    const title = body.title?.trim() || "Projet sans titre";
    const idea = body.idea?.trim() || "";
    const questions = body.questions || [];
    const answers = body.answers || [];
    const summary = body.summary?.trim() || "";

    if (!idea || questions.length !== 5 || answers.length !== 5 || !summary) {
      return NextResponse.json(
        { error: "Session incomplète. Vérifie idée, questions, réponses et bilan." },
        { status: 400 },
      );
    }

    const qaBlock = questions
      .map((q, i) => `Q${i + 1}: ${q}\nR${i + 1}: ${answers[i] || "Non fournie"}`)
      .join("\n\n");

    const created = await prisma.project.create({
      data: {
        userId,
        title,
        description: idea,
        messages: {
          create: [
            { role: "user", content: qaBlock },
            { role: "assistant", content: summary },
          ],
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      session: {
        id: created.id,
        title: created.title,
        idea: created.description || "",
        summary,
        updatedAt: created.updatedAt,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Sauvegarde impossible en base pour le moment." },
      { status: 500 },
    );
  }
}
