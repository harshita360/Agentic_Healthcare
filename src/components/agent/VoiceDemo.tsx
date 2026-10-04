"use client";

import { useState } from "react";
import type { LabInquiryResult, PharmacyInquiryResult, TranscriptTurn } from "@/lib/types";

type DemoResponse = { turns: TranscriptTurn[]; result: LabInquiryResult | PharmacyInquiryResult; activity: Array<{ id: string; message: string }> };
type TrialCall = { id: string; status: string; transcript?: string; result?: LabInquiryResult | PharmacyInquiryResult; activity: Array<{ id: string; message: string }> };

export function VoiceDemo() {
  const [useCase, setUseCase] = useState<"lab_inquiry" | "pharmacy_inquiry">("lab_inquiry");
  const [item, setItem] = useState("Complete blood count");
  const [data, setData] = useState<DemoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [trialCall, setTrialCall] = useState<TrialCall | null>(null);

  const label = useCase === "lab_inquiry" ? "Test name" : "Medicine name";
  async function startCall() {
    setIsRunning(true); setError(null); setData(null);
    const body = useCase === "lab_inquiry" ? { useCase, testName: item } : { useCase, medicineName: item };
    try {
      const response = await fetch("/api/gnani/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json() as DemoResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to run the voice inquiry.");
      setData(payload);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to run the voice inquiry."); }
    finally { setIsRunning(false); }
  }

  async function startRealCall() {
    setIsRunning(true); setError(null); setTrialCall(null);
    const body = useCase === "lab_inquiry" ? { useCase, testName: item } : { useCase, medicineName: item };
    try {
      const response = await fetch("/api/twilio/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json() as { id?: string; error?: string };
      if (!response.ok || !payload.id) throw new Error(payload.error || "Unable to start the Twilio Trial call.");
      const poll = async () => {
        const status = await fetch(`/api/twilio/calls/${payload.id}`).then((result) => result.json()) as TrialCall;
        setTrialCall(status);
        if (status.status === "in_progress") window.setTimeout(poll, 2500);
      };
      await poll();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to start the trial call."); }
    finally { setIsRunning(false); }
  }

  return <div className="voice-demo">
    <section className="voice-card voice-intro">
      <p className="eyebrow">Gnani voice rail</p>
      <h1>Run a simulated voice inquiry</h1>
      <p>The agent uses a disclosed catalog voice. The lab or pharmacy reply is scripted audio and passes through Gnani speech-to-text before structured details are shown.</p>
    </section>
    <section className="voice-card voice-form" aria-label="Voice inquiry setup">
      <div className="choice-row">
        <button className={useCase === "lab_inquiry" ? "choice active" : "choice"} onClick={() => { setUseCase("lab_inquiry"); setItem("Complete blood count"); }}>Lab inquiry</button>
        <button className={useCase === "pharmacy_inquiry" ? "choice active" : "choice"} onClick={() => { setUseCase("pharmacy_inquiry"); setItem("Metformin 500 mg"); }}>Pharmacy inquiry</button>
      </div>
      <label>{label}<input value={item} onChange={(event) => setItem(event.target.value)} maxLength={80} /></label>
      <div className="call-actions"><button className="run-call" disabled={isRunning || !item.trim()} onClick={startCall}>{isRunning ? "Working…" : "Start in-app simulation"}</button><button className="trial-call" disabled={isRunning || !item.trim()} onClick={startRealCall}>Call verified demo operator</button></div>
      <p className="helper">The trial call reaches only `TWILIO_DEMO_RECIPIENT` (a verified teammate). Gnani provides the prompt audio; Twilio Trial transcribes the reply. No real institution is contacted.</p>
    </section>
    {error && <section className="voice-card voice-error" role="alert"><strong>Call needs attention</strong><p>{error}</p></section>}
    {data && <div className="voice-results">
      <section className="voice-card"><h2>Call transcript</h2>{data.turns.map((turn) => <article className={`turn ${turn.speaker}`} key={turn.id}><span>{turn.speaker === "assistant" ? "Care Circle" : "Lab / pharmacy"}</span><p>{turn.text}</p>{turn.audioDataUri && <audio controls src={turn.audioDataUri}>Audio playback is unavailable.</audio>}</article>)}</section>
      <section className="voice-card"><h2>Structured result</h2><dl>{Object.entries(data.result).filter(([key]) => key !== "needsConfirmation").map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{value === undefined ? "Not captured" : String(value)}</dd></div>)}</dl>{data.result.needsConfirmation.length > 0 && <p className="confirmation">Needs confirmation: {data.result.needsConfirmation.join(", ")}</p>}</section>
      <section className="voice-card"><h2>Activity</h2>{data.activity.map((event) => <p className="activity-item" key={event.id}>{event.message}</p>)}</section>
    </div>}
    {trialCall && <div className="voice-results"><section className="voice-card"><p className="eyebrow">Twilio Trial call</p><h2>Status: {trialCall.status.replace(/_/g, " ")}</h2>{trialCall.transcript && <><h3>Twilio Trial speech reply</h3><p>{trialCall.transcript}</p></>}{trialCall.result && <dl>{Object.entries(trialCall.result).filter(([key]) => key !== "needsConfirmation").map(([key, value]) => <div key={key}><dt>{key.replace(/([A-Z])/g, " $1")}</dt><dd>{value === undefined ? "Not captured" : String(value)}</dd></div>)}</dl>}</section><section className="voice-card"><h2>Activity</h2>{trialCall.activity.map((event) => <p className="activity-item" key={event.id}>{event.message}</p>)}</section></div>}
  </div>;
}
