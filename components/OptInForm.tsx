"use client";

import { FormEvent, useState } from "react";

type OptInFormProps = {
  adSlotId: string;
  headline?: string;
  submitLabel?: string;
};

// Drop this on an advertiser's own destination page. It reads `scan_id`
// off the query string (set by app/r/[code]/route.ts's redirect) so the
// lead it saves links back to the scan that produced it. `adSlotId`
// identifies which advertiser the lead belongs to — hardcode it per page.
export function OptInForm({
  adSlotId,
  headline = "Enter your email for 10% off",
  submitLabel = "Get my discount",
}: OptInFormProps) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");

    const form = new FormData(event.currentTarget);
    const scanId = new URLSearchParams(window.location.search).get("scan_id");

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
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p className="opt-in-form__success">Thanks — check your inbox!</p>;
  }

  return (
    <form className="opt-in-form" onSubmit={handleSubmit}>
      <h3>{headline}</h3>
      <input name="name" type="text" placeholder="Name (optional)" autoComplete="name" />
      <input name="email" type="email" placeholder="Email" autoComplete="email" />
      <input name="phone" type="tel" placeholder="Phone (optional)" autoComplete="tel" />
      <button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : submitLabel}
      </button>
      {status === "error" && (
        <p className="opt-in-form__error">Something went wrong — try again.</p>
      )}
    </form>
  );
}
