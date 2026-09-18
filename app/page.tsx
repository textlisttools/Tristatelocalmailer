import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="home">
      <h1>Tri-State Local Mailer</h1>
      <p>QR scan tracking, lead capture, and instant alerts for local postcard advertisers.</p>
      <SignedOut>
        <SignInButton mode="modal">
          <button>Advertiser sign in</button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard">Go to dashboard</Link>
      </SignedIn>
      <p>
        <Link href="/privacy">Privacy policy</Link>
      </p>
    </main>
  );
}
