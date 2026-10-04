"use client";

import { useEffect, useState } from "react";
import type { CareAddress, LabRecommendation } from "@/lib/types";

const storageKey = "care-circle-confirmed-address";
const emptyLabs = ["", "", ""];

export function LocationIntelligence() {
  const [tab, setTab] = useState<"address" | "labs">("address");
  const [raw, setRaw] = useState("Papa stays near Hanuman Mandir, second lane after the SBI ATM");
  const [labAddresses, setLabAddresses] = useState(emptyLabs);
  const [draft, setDraft] = useState<CareAddress | null>(null);
  const [confirmed, setConfirmed] = useState<CareAddress | null>(null);
  const [recommendation, setRecommendation] = useState<LabRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setConfirmed(JSON.parse(saved) as CareAddress);
  }, []);

  async function analyze() {
    setBusy(true); setError(null); setDraft(null);
    try {
      const response = await fetch("/api/delhivery/address", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: raw }) });
      const payload = await response.json() as CareAddress & { error?: string };
      if (!response.ok) throw new Error(payload.error);
      setDraft(payload);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to analyze address."); } finally { setBusy(false); }
  }

  function confirm() {
    if (!draft || draft.validation.quality !== "ok") return;
    const value = { ...draft, confirmedAt: new Date().toISOString() };
    window.localStorage.setItem(storageKey, JSON.stringify(value));
    setConfirmed(value);
    window.location.assign("/address-book");
  }

  async function verifyLabs() {
    if (!confirmed) return;
    setBusy(true); setError(null); setRecommendation(null);
    try {
      const response = await fetch("/api/delhivery/labs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ address: confirmed, labAddresses }) });
      const payload = await response.json() as LabRecommendation & { error?: string };
      if (!response.ok) throw new Error(payload.error);
      setRecommendation(payload);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to verify supplied lab addresses."); } finally { setBusy(false); }
  }

  function updateLab(index: number, value: string) {
    setLabAddresses((current) => current.map((address, currentIndex) => currentIndex === index ? value : address));
  }

  return <div className="location-demo">
    <section className="voice-card voice-intro"><p className="eyebrow">Delhivery location intelligence</p><h1>Turn household locations into care-ready addresses</h1><p>Delhivery validates and geocodes locations. It does not discover providers or make clinical decisions.</p></section>
    <div className="choice-row">
      <button className={tab === "address" ? "choice active" : "choice"} onClick={() => setTab("address")}>Add a new address to your address book</button>
      <button className={tab === "labs" ? "choice active" : "choice"} onClick={() => setTab("labs")}>Fetch verified labs</button>
    </div>
    {error && <section className="voice-card voice-error" role="alert">{error}</section>}
    {tab === "address" ? <section className="voice-card location-form">
      <h2>Add a care address</h2><p className="helper">The address is stored in this browser only after you confirm it.</p>
      <label>Informal household address<textarea value={raw} onChange={(event) => setRaw(event.target.value)} maxLength={500} /></label>
      <button className="run-call" disabled={busy || !raw.trim()} onClick={analyze}>{busy ? "Checking address…" : "Standardize address"}</button>
      {draft && <AddressCard address={draft} confirm={confirm} />}
    </section> : <section className="voice-card location-form">
      <h2>Fetch verified labs</h2>
      {!confirmed ? <p>First add and confirm a complete care address in your address book.</p> : <>
        <p className="helper">Your confirmed care address: {confirmed.formattedAddress}</p>
        <p className="helper">For this prototype, paste three lab addresses manually. A future agent can supply these candidates.</p>
        {labAddresses.map((address, index) => <label key={index}>Lab {index + 1} address<textarea value={address} onChange={(event) => updateLab(index, event.target.value)} maxLength={500} placeholder="Building / street, locality, city, pincode" /></label>)}
        <button className="run-call" disabled={busy || labAddresses.some((address) => !address.trim())} onClick={verifyLabs}>{busy ? "Verifying lab addresses…" : "Fetch verified labs"}</button>
      </>}
      {recommendation && <LabCard recommendation={recommendation} />}
    </section>}
  </div>;
}

function AddressCard({ address, confirm }: { address: CareAddress; confirm: () => void }) {
  return <div className="address-result"><h2>Suggested address <small>{address.source === "demo" ? "Demo Maps" : "Delhivery Maps"}</small></h2><p>{address.formattedAddress}</p><dl><div><dt>Quality</dt><dd>{address.validation.quality}</dd></div><div><dt>Confidence</dt><dd>{address.validation.confidence}</dd></div>{address.location && <div><dt>Coordinates</dt><dd>{address.location.lat.toFixed(4)}, {address.location.lng.toFixed(4)}</dd></div>}</dl>{address.validation.missingFields.length > 0 ? <p className="confirmation">Please add: {address.validation.missingFields.join(", ")}.</p> : <button className="trial-call" onClick={confirm}>Add to address book</button>}</div>;
}

function LabCard({ recommendation }: { recommendation: LabRecommendation }) {
  const label = recommendation.source === "demo" ? "Demo Maps" : "Delhivery Maps";
  const candidates = [...recommendation.ranked, ...recommendation.unverified];
  return <div className="lab-result">
    <p className="helper">Source: {label}. These are address-validation results only; they do not confirm a lab’s availability, services, or clinical suitability.</p>
    <h3>Lab address validation</h3>
    {candidates.map((lab) => {
      const validation = lab.address.validation;
      const valid = validation.quality === "ok";
      const missing = validation.missingFields.length > 0 ? `Add: ${validation.missingFields.join(", ")}.` : "No individual missing fields were returned by the address service.";
      return <article className="lab-row" key={lab.id}>
        <strong>{lab.name} — {valid ? "address accepted" : "needs more detail"}</strong>
        <span>{lab.address.formattedAddress || lab.address.rawAddress}</span>
        <span>Validation: {validation.quality} · confidence: {validation.confidence}{validation.granularity ? ` · granularity: ${validation.granularity}` : ""}</span>
        <span>{valid ? validation.reason : missing}</span>
      </article>;
    })}
  </div>;
}
