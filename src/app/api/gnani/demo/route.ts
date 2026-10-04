import { NextResponse } from "next/server";
import { GnaniError, GnaniSpeechClient } from "@/rails/gnani/client";
import { runVoiceDemo, type VoiceDemoInput } from "@/rails/gnani/demo";

export const runtime = "nodejs";

function validInput(value: unknown): value is VoiceDemoInput {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return (body.useCase === "lab_inquiry" && typeof body.testName === "string") || (body.useCase === "pharmacy_inquiry" && typeof body.medicineName === "string");
}

export async function POST(request: Request) {
  const apiKey = process.env.GNANI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GNANI_API_KEY is missing. Add it to .env.local and restart the server." }, { status: 503 });
  const body: unknown = await request.json().catch(() => null);
  if (!validInput(body)) return NextResponse.json({ error: "Invalid voice inquiry request." }, { status: 400 });
  try {
    return NextResponse.json(await runVoiceDemo(body, new GnaniSpeechClient(apiKey)));
  } catch (error) {
    const message = error instanceof GnaniError ? error.message : "The voice inquiry could not be completed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
