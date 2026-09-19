import { SiteHeader } from "@/components/SiteHeader";

export default function CodeNotFoundPage() {
  return (
    <>
      <SiteHeader />
      <main className="status-page">
        <h1>Code not found</h1>
        <p>
          This QR code doesn&apos;t match an active ad slot. If you scanned this
          from a KYOVA Spotlight postcard, the offer may have expired —
          try again in a few days or contact the business directly.
        </p>
      </main>
    </>
  );
}
