import { PrismaClient } from "@prisma/client";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

const key = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";

console.log("gemini_key:", key ? "présente" : "manquante");
console.log("gemini_model:", model);
console.log("auth_secret:", process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET ? "présent" : "manquant");

if (key) {
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = key;
  try {
    const { text } = await generateText({
      model: google(model),
      prompt: "Réponds uniquement le mot OK.",
    });
    console.log("gemini_api:", "OK —", text.trim().slice(0, 40));
  } catch (e) {
    console.log("gemini_api:", "ERREUR —", e instanceof Error ? e.message.slice(0, 120) : e);
  }
}

const prisma = new PrismaClient();
try {
  await prisma.$queryRaw`SELECT 1 as ok`;
  console.log("database:", "OK");
} catch (e) {
  console.log("database:", "ERREUR —", e instanceof Error ? e.message.slice(0, 120) : e);
} finally {
  await prisma.$disconnect();
}
