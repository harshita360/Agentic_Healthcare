import { NextResponse } from "next/server";
import { startTwilioTrialCall, type TrialCallInput } from "@/rails/gnani/twilio";
export const runtime = "nodejs";
function valid(value: unknown): value is TrialCallInput { const body = value as Record<string, unknown> | null; return !!body && ((body.useCase === "lab_inquiry" && typeof body.testName === "string") || (body.useCase === "pharmacy_inquiry" && typeof body.medicineName === "string")); }
export async function POST(request: Request) { const body: unknown = await request.json().catch(() => null); if (!valid(body)) return NextResponse.json({ error: "Invalid trial call request." }, { status: 400 }); try { return NextResponse.json(await startTwilioTrialCall(body)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start a trial call." }, { status: 503 }); } }
