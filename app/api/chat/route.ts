import { google } from "@ai-sdk/google";
import { convertToModelMessages, streamText } from "ai";
import { auth } from "@/auth";
import { rejectIfBodyTooLarge } from "@/src/lib/apiGuards";
import { validateChatMessagesPayload } from "@/src/lib/chatTranscript";
import { getGeminiModelId, hasGeminiApiKey, resolveGeminiApiKey } from "@/src/lib/gemini";
import { PEAK_AGENT_SYSTEM } from "@/src/lib/peakAgentSystem";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  const tooLarge = rejectIfBodyTooLarge(req);
  if (tooLarge) {
    return tooLarge;
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Non authentifié." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!hasGeminiApiKey()) {
    return new Response(
      JSON.stringify({
        error:
          "GEMINI_API_KEY manquante. Configure-la (ou GOOGLE_GENERATIVE_AI_API_KEY) dans les variables Vercel.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
  resolveGeminiApiKey();

  try {
    const body = (await req.json()) as { messages?: unknown };
    const messages = body.messages;

    const validation = validateChatMessagesPayload(messages);
    if (!validation.ok) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const modelMessages = await convertToModelMessages(
      messages as Parameters<typeof convertToModelMessages>[0],
    );

    const result = streamText({
      model: google(getGeminiModelId()),
      system: PEAK_AGENT_SYSTEM,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
