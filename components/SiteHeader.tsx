"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="site-header__brand">
          <span className="site-header__brand-accent">Tri-State</span> Local Mailer
        </Link>
        <nav className="site-header__nav">
          <SignedIn>
            <Link href="/dashboard">Dashboard</Link>
          </SignedIn>
          <Link href="/privacy">Privacy</Link>
          <SignedOut>
            <SignInButton mode="modal">
              <button>Advertiser sign in</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
}
