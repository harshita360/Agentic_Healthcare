import { createHmac, timingSafeEqual } from "node:crypto";
import type { ActivityEvent, CallStatus, LabInquiryResult, PharmacyInquiryResult } from "@/lib/types";
import { GnaniSpeechClient } from "./client";
import { createLabInquiryPlan, createPharmacyInquiryPlan, parseLabInquiryResult, parsePharmacyInquiryResult } from "./flow";

export type TrialCallInput = { useCase: "lab_inquiry"; testName: string } | { useCase: "pharmacy_inquiry"; medicineName: string };
type Result = LabInquiryResult | PharmacyInquiryResult;
type StoredCall = { id: string; input: TrialCallInput; status: CallStatus; promptAudio: Uint8Array; createdAt: number; activity: ActivityEvent[]; transcript?: string; result?: Result; twilioCallSid?: string };

const expiryMs = 15 * 60 * 1000;
const callStore = globalThis as typeof globalThis & { __careCircleTrialCalls?: Map<string, StoredCall> };
const calls = callStore.__careCircleTrialCalls ??= new Map<string, StoredCall>();
const now = () => new Date().toISOString();

function required(name: keyof NodeJS.ProcessEnv): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is missing. Add it to .env.local and restart the server.`);
  return value;
}

function baseUrl(): string {
  const value = required("PUBLIC_BASE_URL").replace(/\/$/, "");
  if (!value.startsWith("https://")) throw new Error("PUBLIC_BASE_URL must be the HTTPS URL from ngrok.");
  return value;
}

function escapeXml(value: string): string { return value.replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", "\"": "&quot;" })[char]!); }
function twiml(body: string): string { return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`; }
function prompt(input: TrialCallInput): string {
  const plan = input.useCase === "lab_inquiry" ? createLabInquiryPlan(input) : createPharmacyInquiryPlan(input);
  return plan.turns[0].text;
}

export function cleanupExpiredCalls(): void { for (const [id, call] of calls) if (Date.now() - call.createdAt > expiryMs) calls.delete(id); }
export function buildVoiceTwiml(callId: string, publicUrl: string): string {
  return twiml(`<Gather input="speech" action="${escapeXml(`${publicUrl}/api/twilio/gather?callId=${callId}`)}" method="POST" speechTimeout="auto" timeout="8" language="en-IN"><Play>${escapeXml(`${publicUrl}/api/twilio/audio/${callId}`)}</Play></Gather><Say>We did not receive a response. This call is now ending.</Say><Hangup/>`);
}
export function buildCompletionTwiml(): string { return twiml("<Say>Thank you. This demonstration call is complete.</Say><Hangup/>"); }

export function validateTwilioSignature(url: string, params: URLSearchParams, signature: string | null): boolean {
  if (!signature || !process.env.TWILIO_AUTH_TOKEN) return false;
  const payload = `${url}${[...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}${value}`).join("")}`;
  const expected = createHmac("sha1", process.env.TWILIO_AUTH_TOKEN).update(payload).digest("base64");
  return expected.length === signature.length && timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

function activity(call: StoredCall, message: string, type: string): void { call.activity.push({ id: crypto.randomUUID(), type, message, occurredAt: now() }); }
export function getTrialCall(id: string): Omit<StoredCall, "promptAudio"> | undefined {
  cleanupExpiredCalls(); const call = calls.get(id); if (!call) return undefined; const { promptAudio: _audio, ...safe } = call; return safe;
}
export function getPromptAudio(id: string): Uint8Array | undefined { cleanupExpiredCalls(); return calls.get(id)?.promptAudio; }

export async function startTwilioTrialCall(input: TrialCallInput): Promise<{ id: string; status: CallStatus }> {
  cleanupExpiredCalls();
  const accountSid = required("TWILIO_ACCOUNT_SID"); const authToken = required("TWILIO_AUTH_TOKEN"); const from = required("TWILIO_PHONE_NUMBER"); const recipient = required("TWILIO_DEMO_RECIPIENT"); const publicUrl = baseUrl(); const apiKey = required("GNANI_API_KEY");
  const audio = await new GnaniSpeechClient(apiKey).synthesizeSpeech(prompt(input));
  const call: StoredCall = { id: crypto.randomUUID(), input, status: "in_progress", promptAudio: Uint8Array.from(Buffer.from(audio.audioBase64, "base64")), createdAt: Date.now(), activity: [] };
  calls.set(call.id, call); activity(call, "Prepared Gnani audio and requested a Twilio Trial call to the verified demo operator.", "trial_call_started");
  const form = new URLSearchParams({ To: recipient, From: from, Url: `${publicUrl}/api/twilio/voice?callId=${call.id}`, StatusCallback: `${publicUrl}/api/twilio/status?callId=${call.id}`, StatusCallbackEvent: "initiated ringing answered completed", StatusCallbackMethod: "POST" });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, { method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form });
  if (!response.ok) { calls.delete(call.id); throw new Error(`Twilio could not start the trial call (${response.status}): ${(await response.text()).slice(0, 220)}`); }
  const payload = await response.json() as { sid?: string }; call.twilioCallSid = payload.sid; return { id: call.id, status: call.status };
}

export function handleGather(callId: string, transcript: string): StoredCall | undefined {
  const call = calls.get(callId); if (!call) return undefined;
  call.transcript = transcript; call.result = call.input.useCase === "lab_inquiry" ? parseLabInquiryResult(call.input.testName, transcript) : parsePharmacyInquiryResult(call.input.medicineName, transcript); call.status = "completed"; activity(call, "Captured a Twilio Trial speech response and extracted the inquiry result.", "trial_call_completed"); return call;
}
export function updateCallStatus(callId: string, status: string): void { const call = calls.get(callId); if (!call) return; if (["failed", "busy", "no-answer", "canceled"].includes(status)) call.status = "failed"; activity(call, `Twilio call status: ${status}.`, "twilio_status"); }
