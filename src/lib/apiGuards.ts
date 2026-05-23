import { NextResponse } from "next/server";
import { MAX_JSON_BODY_BYTES } from "@/src/lib/limits";

export function jsonBodyTooLarge(request: Request): boolean {
  const len = request.headers.get("content-length");
  if (!len) {
    return false;
  }
  const n = Number.parseInt(len, 10);
  return Number.isFinite(n) && n > MAX_JSON_BODY_BYTES;
}

export function rejectIfBodyTooLarge(request: Request) {
  if (jsonBodyTooLarge(request)) {
    return NextResponse.json({ error: "Corps de requête trop volumineux." }, { status: 413 });
  }
  return null;
}
