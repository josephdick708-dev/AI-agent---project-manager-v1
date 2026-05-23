import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireUser } from "@/src/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }
  const { userId } = authResult;
  const { id } = await context.params;

  try {
    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Session introuvable." }, { status: 404 });
    }

    const chatMessages = project.messages.map((m) => ({
      id: m.id,
      role: m.role === "assistant" ? "assistant" : "user",
      parts: [{ type: "text" as const, text: m.content, state: "done" as const }],
    }));

    return NextResponse.json({
      id: project.id,
      title: project.title,
      description: project.description,
      messages: chatMessages,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
