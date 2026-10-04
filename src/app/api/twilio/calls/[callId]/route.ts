import { NextResponse } from "next/server";
import { getTrialCall } from "@/rails/gnani/twilio";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: Promise<{ callId: string }> }) { const { callId } = await params; const call = getTrialCall(callId); return call ? NextResponse.json(call) : NextResponse.json({ error: "Call not found or expired." }, { status: 404 }); }
