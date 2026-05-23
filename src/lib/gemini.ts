import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { gateIdea } from "@/src/lib/ideaGate";

/** Surcharge via GEMINI_MODEL ou GOOGLE_GENERATIVE_AI_MODEL. */
const defaultModel = "gemini-2.5-flash";

export function getGeminiModelId(): string {
  return (
    process.env.GEMINI_MODEL?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() ||
    defaultModel
  );
}

/** Clé API : GEMINI_API_KEY ou GOOGLE_GENERATIVE_AI_API_KEY (standard AI SDK). */
export function resolveGeminiApiKey(): string | null {
  const key =
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (key && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = key;
  }
  return key ?? null;
}

export function hasGeminiApiKey(): boolean {
  return Boolean(resolveGeminiApiKey());
}

export type IdeaAnalysisResult =
  | {
      ok: true;
      understanding: string;
      workingTitle: string;
      questions: string[];
    }
  | {
      ok: false;
      code: "no_api_key" | "needs_clarification" | "bad_response" | "upstream";
      message: string;
    };

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1]!.trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("no_json_object");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

function isStringArray5(v: unknown): v is string[] {
  if (!Array.isArray(v) || v.length !== 5) {
    return false;
  }
  return v.every((x) => typeof x === "string" && x.trim().length >= 10);
}

/** Analyse l'idée et produit des questions contextualisées. */
export async function analyzeIdeaForCadrage(ideaRaw: string): Promise<IdeaAnalysisResult> {
  const idea = ideaRaw.trim();
  const lenCheck = gateIdea(idea);
  if (!lenCheck.ok) {
    return { ok: false, code: "needs_clarification", message: lenCheck.message };
  }

  if (!resolveGeminiApiKey()) {
    return {
      ok: false,
      code: "no_api_key",
      message:
        "Clé API manquante : ajoute GEMINI_API_KEY (ou GOOGLE_GENERATIVE_AI_API_KEY) dans .env et redémarre le serveur.",
    };
  }

  const system = `Tu es un mentor startup senior. Tu travailles en français.

RÈGLES STRICTES :
1) Lis le texte de l'utilisateur comme une VRAIE description de projet (même imparfaite).
2) Dans "understanding", résume en 2 à 4 phrases ce que tu comprénds : problème visé, qui est touché, proposition, incertitudes. Ton écriture doit montrer que tu as lu les détails (cite des éléments concrets du texte sans les copier mot pour mot).
3) Dans "working_title", propose un titre court de projet (4 à 10 mots) qui résume l'idée. Ne recopie PAS bêtement les premiers mots du message si ce n'est pas un titre (ex. "salut", "hey"). Si le texte est trop flou, mets un titre neutre du type "Projet à préciser" uniquement si tu actives needs_clarification.
4) "questions" : EXACTEMENT 5 strings. Chaque question DOIT :
   - s'appuyer sur un élément précis du texte (un mot-clé, un usage, une cible, un canal, une contrainte mentionnée)
   - creuser un angle différent (marché, valeur, revenus, risque, exécution, mesure…)
   - être inutilisable telle quelle pour un autre projet au hasard (interdit : listes de questions génériques boilerplate).
5) Si le texte est trop vague pour 5 bonnes questions, réponds avec needs_clarification true, understanding courte, working_title "À préciser", questions [] et clarification_message expliquant quoi ajouter.

FORMAT DE SORTIE : un seul objet JSON valide, sans texte avant ou après (pas de markdown).
Schéma :
{"needs_clarification":boolean,"clarification_message":string|null,"understanding":string,"working_title":string,"questions":string[]}`;

  const prompt = `Texte de l'utilisateur (idée / pitch) :\n---\n${idea}\n---\n\nRappel : JSON uniquement.`;

  try {
    const { text: raw } = await generateText({
      model: google(getGeminiModelId()),
      system,
      prompt,
      temperature: 0.35,
      maxOutputTokens: 1400,
    });

    let parsed: {
      needs_clarification?: boolean;
      clarification_message?: string | null;
      understanding?: string;
      working_title?: string;
      questions?: unknown;
    };

    try {
      parsed = extractJsonObject(raw) as typeof parsed;
    } catch {
      return {
        ok: false,
        code: "bad_response",
        message:
          "Le modèle n'a pas renvoyé un JSON exploitable. Réessaie, ou vérifie GEMINI_MODEL / la clé API.",
      };
    }

    if (parsed.needs_clarification) {
      const hint =
        parsed.clarification_message?.trim() ||
        "Précise le problème, pour qui, et ce que tu proposes comme solution ou MVP.";
      return { ok: false, code: "needs_clarification", message: hint };
    }

    const understanding = parsed.understanding?.trim() || "";
    const workingTitle = parsed.working_title?.trim() || "";
    const questions = parsed.questions;

    if (!understanding || !workingTitle || !isStringArray5(questions)) {
      return {
        ok: false,
        code: "bad_response",
        message: "Réponse IA incomplète. Réessaie dans quelques instants.",
      };
    }

    return {
      ok: true,
      understanding,
      workingTitle,
      questions: questions.map((q) => q.trim()),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return {
      ok: false,
      code: "upstream",
      message: `Appel au modèle impossible : ${msg}. Vérifie la clé API et le nom du modèle (GEMINI_MODEL).`,
    };
  }
}

export async function generateSummaryFromConversation(params: {
  idea: string;
  understanding?: string;
  questions: string[];
  answers: string[];
}): Promise<{ ok: true; summary: string } | { ok: false; message: string }> {
  const { idea, understanding, questions, answers } = params;

  if (!resolveGeminiApiKey()) {
    return {
      ok: false,
      message: "GEMINI_API_KEY manquante — impossible de générer le bilan avec le LLM.",
    };
  }

  const qaBlock = questions
    .map((question, index) => {
      const answer = answers[index] ?? "";
      return `Q${index + 1}: ${question}\nR${index + 1}: ${answer}`;
    })
    .join("\n\n");

  const pre =
    understanding?.trim() ?
      `Synthèse initiale de l'agent sur l'idée :\n${understanding.trim()}\n\n`
    : "";

  try {
    const { text } = await generateText({
      model: google(getGeminiModelId()),
      system:
        "Tu es un mentor startup senior. Rédige un cadrage en français, clair, actionnable, sans bullshit. Tu t'appuies sur les Q/R et sur la synthèse initiale si fournie.",
      prompt:
        `${pre}` +
        `Idée initiale :\n${idea}\n\n` +
        `Questions et réponses :\n${qaBlock}\n\n` +
        "Produis un rapport avec les sections : 1) Vision, 2) Proposition de valeur & différenciation, 3) Faisabilité & MVP, 4) Risques & mitigations, 5) Prochaines actions (30 jours, étapes numérotées). Termine par 3 métriques de succès concrètes.",
      temperature: 0.35,
      maxOutputTokens: 2500,
    });

    if (!text.trim()) {
      return { ok: false, message: "Le modèle a renvoyé un bilan vide." };
    }
    return { ok: true, summary: text.trim() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erreur inconnue";
    return { ok: false, message: `Bilan impossible : ${msg}` };
  }
}
