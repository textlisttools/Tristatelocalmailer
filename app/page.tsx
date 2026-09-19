import Image from "next/image";
import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { SiteHeader } from "@/components/SiteHeader";

const steps = [
  {
    number: "01",
    title: "Reserve your spot",
    body: "Pick a slot on our next postcard route across Kentucky, Ohio, or West Virginia. Every household on that route gets it — guaranteed, no algorithm deciding who sees it.",
  },
  {
    number: "02",
    title: "We design & mail it",
    body: "Your ad goes out with a unique QR code. No design work or website changes required on your end.",
  },
  {
    number: "03",
    title: "Watch leads roll in",
    body: "Every scan and every opt-in shows up on your dashboard in real time, with a push notification the second it happens.",
  },
];

const valueProps = [
  {
    title: "Physical & unskippable",
    body: "A postcard on the counter can't be scrolled past, muted, or blocked the way a digital ad can.",
  },
  {
    title: "Provably working",
    body: "Every scan is logged automatically — no more guessing whether the ad \"did anything.\"",
  },
  {
    title: "Instant leads",
    body: "Visitors can share their name and email before continuing to your site — a warm lead, not just a click.",
  },
  {
    title: "Zero setup on your end",
    body: "No code, no plugin, no app to install. You just show up to your own website like normal.",
  },
];

const faqs = [
  {
    question: "Do I need to change anything on my website?",
    answer:
      "No. We host the lead-capture page that appears right after someone scans — you just receive the leads and keep the traffic. Your site stays exactly as it is.",
  },
  {
    question: "How do I see my results?",
    answer:
      "Sign in to your advertiser dashboard any time — scan counts and your lead list update in real time, no waiting for a report.",
  },
  {
    question: "Can I get notified the moment someone scans?",
    answer:
      "Yes. Enable push notifications from your dashboard and get an alert on your phone or computer the instant it happens.",
  },
  {
    question: "What's the coverage area?",
    answer:
      "We mail postcard routes across Kentucky, Ohio, and West Virginia — the KYOVA tri-state area.",
  },
  {
    question: "How much does a spot cost?",
    answer: "Pricing depends on the route and slot type — reach out below for current availability.",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <section className="hero">
        <div className="hero__inner">
          <span className="hero__badge">Now signing up advertisers across KYOVA</span>
          <Image
            src="/hero.png"
            alt="Real Mail. Real People. Real Results. Turn local mailboxes into local customers with trackable postcards."
            width={962}
            height={383}
            priority
            className="hero__image"
          />
          <div className="hero__actions">
            <a href="#how-it-works" className="hero__cta">
              See how it works
            </a>
            <SignedOut>
              <SignInButton mode="modal">
                <button>Already advertising? Sign in</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">Go to your dashboard</Link>
            </SignedIn>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section">
        <h2 className="section__title">How it works</h2>
        <div className="step-grid">
          {steps.map((step) => (
            <div className="step-card" key={step.number}>
              <span className="step-card__number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section section--panel">
        <h2 className="section__title">Why postcard + QR beats another social ad</h2>
        <div className="value-grid">
          {valueProps.map((item) => (
            <div className="value-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <div className="cta-banner__inner">
          <h2>Spots fill up fast on every route.</h2>
          <p>Reach out to check what's available for the next run — no obligation.</p>
          <div className="cta-banner__contact">
            <a href="mailto:postcard@kyovaspotlight.com">postcard@kyovaspotlight.com</a>
            <a href="tel:+13049623018">304-962-3018</a>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section__title">Questions advertisers ask</h2>
        <div className="faq-list">
          {faqs.map((item) => (
            <div className="faq-item" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__brand">
            <Image src="/icon-512.png" alt="" width={40} height={40} />
            <div>
              <strong>KYOVA Spotlight</strong>
              <p>Serving Kentucky, Ohio &amp; West Virginia</p>
              <p>
                <a href="mailto:postcard@kyovaspotlight.com">postcard@kyovaspotlight.com</a>
                {" · "}
                <a href="tel:+13049623018">304-962-3018</a>
              </p>
            </div>
          </div>
          <div className="site-footer__links">
            <Link href="/privacy">Privacy policy</Link>
            <SignedOut>
              <SignInButton mode="modal">
                <button>Advertiser sign in</button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">Advertiser dashboard</Link>
            </SignedIn>
          </div>
        </div>
      </footer>
    </>
  );
}
