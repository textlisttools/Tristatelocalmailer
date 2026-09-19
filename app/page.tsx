import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { SiteHeader } from "@/components/SiteHeader";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <section className="hero">
        <div className="hero__inner">
          <span className="hero__badge">Now signing up local advertisers</span>
          <h1>Every scan is a lead. Every lead is instant.</h1>
          <p>
            QR-code tracking, opt-in lead capture, and real-time push alerts for the
            businesses on our postcard mailing routes — set up once, no changes to
            your own website required.
          </p>
          <div className="hero__actions">
            <SignedOut>
              <SignInButton mode="modal">
                <button>Advertiser sign in</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <button>Go to dashboard</button>
              </Link>
            </SignedIn>
            <Link href="/privacy">Privacy policy</Link>
          </div>
        </div>
      </section>
    </>
  );
}
