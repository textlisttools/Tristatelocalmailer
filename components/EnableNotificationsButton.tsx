"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

// Registers public/sw.js and subscribes the browser to push, then hands
// the subscription to /api/push/subscribe so notifyAdvertiser()
// (lib/push.ts) can reach this device on future scans/leads.
export function EnableNotificationsButton() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "on" | "unsupported" | "error"
  >("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker
      .getRegistration("/sw.js")
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "on" : "idle"))
      .catch(() => {});
  }, []);

  async function enable() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("error");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });

      setStatus(res.ok ? "on" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "unsupported") {
    return <p>Push notifications aren&apos;t supported in this browser.</p>;
  }
  if (status === "on") {
    return <p>Notifications are on for this device.</p>;
  }

  return (
    <button onClick={enable} disabled={status === "loading"}>
      {status === "loading" ? "Enabling…" : "Enable scan & lead notifications"}
    </button>
  );
}
