"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { CareAddress } from "@/lib/types";

const storageKey = "care-circle-confirmed-address";

export function AddressBook() {
  const [address, setAddress] = useState<CareAddress | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setAddress(JSON.parse(saved) as CareAddress);
  }, []);

  function removeAddress() {
    window.localStorage.removeItem(storageKey);
    setAddress(null);
  }

  return <div className="location-demo">
    <section className="voice-card voice-intro"><p className="eyebrow">Family address book</p><h1>Saved care addresses</h1><p>Addresses are stored in this browser only after you explicitly confirm them.</p></section>
    {!address ? <section className="voice-card"><h2>No saved care address yet</h2><p>Start by adding and confirming an address through Location intelligence.</p><Link className="trial-call" href="/location">Add a care address</Link></section> : <section className="voice-card address-book-card">
      <div><p className="eyebrow">Primary care address</p><h2>{address.formattedAddress}</h2></div>
      <dl><div><dt>Validation</dt><dd>{address.validation.quality}</dd></div><div><dt>Confidence</dt><dd>{address.validation.confidence}</dd></div><div><dt>Source</dt><dd>{address.source === "demo" ? "Demo Maps" : "Delhivery Maps"}</dd></div>{address.confirmedAt && <div><dt>Saved</dt><dd>{new Date(address.confirmedAt).toLocaleString()}</dd></div>}</dl>
      <div className="call-actions"><Link className="trial-call" href="/location">Add or replace address</Link><button className="choice" onClick={removeAddress}>Remove address</button></div>
    </section>}
  </div>;
}
