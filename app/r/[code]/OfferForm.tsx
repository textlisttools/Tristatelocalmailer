"use client";

import { FormEvent, useState } from "react";

type OfferFormProps = {
  adSlotId: string;
  scanId: string | null;
  businessName: string;
  destinationUrl: string;
};

// The hosted opt-in page a visitor lands on after scanning. Name and email
// are optional — a visitor can skip straight to the advertiser's site — but
// submitting captures a lead without the advertiser having to add anything
// to their own page.
export function OfferForm({ adSlotId, scanId, businessName, destinationUrl }: OfferFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = new FormData(event.currentTarget);
    const email = form.get("email");
    const phone = form.get("phone");

    // Nothing entered — same as clicking the skip link, just via Enter/the
    // button. /api/leads requires at least one of email/phone, so calling
    // it here would just 400.
    if (!email && !phone) {
      window.location.href = destinationUrl;
      return;
    }

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ad_slot_id: adSlotId,
          scan_id: scanId,
          name: form.get("name"),
          email,
          phone,
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
      <p>Enter your name and email for the offer, or skip straight to their site.</p>
      <form className="opt-in-form" onSubmit={handleSubmit}>
        <input name="name" type="text" placeholder="Name" autoComplete="name" />
        <input name="email" type="email" placeholder="Email" autoComplete="email" />
        <input name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel" />
        <button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting…" : "Continue"}
        </button>
        {status === "error" && (
          <p className="opt-in-form__error">Something went wrong — try again.</p>
        )}
      </form>
      <a className="offer-page__skip" href={destinationUrl}>
        No thanks, just take me to their site
      </a>
    </main>
  );
}
