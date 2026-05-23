import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rejectIfBodyTooLarge } from "@/src/lib/apiGuards";
import {
  MAX_EMAIL_CHARS,
  MAX_NAME_CHARS,
  MAX_PASSWORD_CHARS,
} from "@/src/lib/limits";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const tooLarge = rejectIfBodyTooLarge(request);
  if (tooLarge) {
    return tooLarge;
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      confirm?: string;
    };

    const name = body.name?.trim().slice(0, MAX_NAME_CHARS) || null;
    const email = body.email?.trim().toLowerCase().slice(0, MAX_EMAIL_CHARS);
    const password = body.password ?? "";
    const confirm = body.confirm ?? "";

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
    }

    if (password.length < 8 || password.length > MAX_PASSWORD_CHARS) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir entre 8 et 128 caractères." },
        { status: 400 },
      );
    }

    if (password !== confirm) {
      return NextResponse.json({ error: "Les mots de passe ne correspondent pas." }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) {
      return NextResponse.json({ error: "Cet e-mail est déjà utilisé." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        language: "fr",
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Inscription impossible pour le moment." }, { status: 500 });
  }
}
