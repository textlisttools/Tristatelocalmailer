"use client";

import { FormEvent, useState } from "react";

type OfferFormProps = {
  adSlotId: string;
  scanId: string | null;
  businessName: string;
  destinationUrl: string;
};

// The hosted opt-in page a visitor lands on after scanning. Name and email
// are required to continue on to the advertiser's own site — this is what
// lets an advertiser capture leads without adding anything to their page.
export function OfferForm({ adSlotId, scanId, businessName, destinationUrl }: OfferFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = new FormData(event.currentTarget);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_slot_id: adSlotId,
          scan_id: scanId,
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
        }),
      });

      if (!res.ok) {
        setStatus("error");
        return;
      }

      window.location.href = destinationUrl;
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="offer-page">
      <h1>{businessName}</h1>
      <p>Enter your name and email to continue on to their site and view the offer.</p>
      <form className="opt-in-form" onSubmit={handleSubmit}>
        <input name="name" type="text" placeholder="Name" autoComplete="name" required />
        <input name="email" type="email" placeholder="Email" autoComplete="email" required />
        <input name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel" />
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting…" : "Continue"}
        </button>
        {status === "error" && (
          <p className="opt-in-form__error">Something went wrong — try again.</p>
        )}
      </form>
    </main>
  );
}
