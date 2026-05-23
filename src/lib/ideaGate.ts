/** Seuil côté client et serveur : évite « hey » comme pitch et force un vrai contexte au LLM. */
export const MIN_IDEA_CHARS = 45;
export const MIN_IDEA_WORDS = 8;

export function gateIdea(ideaRaw: string): { ok: true } | { ok: false; message: string } {
  const idea = ideaRaw.trim();
  if (idea.length < MIN_IDEA_CHARS) {
    return {
      ok: false,
      message: `Décris ton projet en 2–4 phrases (problème, pour qui, solution envisagée) — minimum ${MIN_IDEA_CHARS} caractères pour que l'agent pose des questions sur ton idée, pas du générique.`,
    };
  }
  const words = idea.split(/\s+/).filter(Boolean).length;
  if (words < MIN_IDEA_WORDS) {
    return {
      ok: false,
      message:
        "Ajoute plus de mots et de contexte : objectif, public, contraintes. Sinon l'IA n'a pas assez de matière pour réfléchir à ton cas.",
    };
  }
  return { ok: true };
}
