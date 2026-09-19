import { SiteHeader } from "@/components/SiteHeader";

// Mirrors docs/privacy-policy.md. Keep the two in sync when this changes —
// [DATE] and [CONTACT EMAIL] still need to be filled in before launch.
export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="privacy-policy">
      <h1>Privacy Policy — KYOVA Spotlight</h1>
      <p>
        <em>Last updated: [DATE]</em>
      </p>

      <p>
        KYOVA Spotlight (&quot;we,&quot; &quot;us&quot;) operates the postcard mailing
        program and the QR code tracking system used by our advertising partners
        (&quot;advertisers&quot;). This policy explains what we collect when you scan a code on
        one of our postcards, and how that information is used.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>When you scan a QR code:</strong> We automatically log the scan itself — the
        time, the general device type (phone, tablet, computer), and an approximate location
        based on your network connection (city/region level only, not a precise address). We
        do not collect your name, email, or phone number just from scanning.
      </p>
      <p>
        <strong>If you choose to enter your information:</strong> Scanning the code takes you to
        a page we host, showing the business&apos;s name and offer, with an optional form (name,
        email, phone). If you fill this out, we collect whatever you provide and share it with
        the specific advertiser whose code you scanned. You can also skip straight to that
        business&apos;s own website without entering anything.
      </p>

      <h2>How this information is used</h2>
      <ul>
        <li>
          <strong>The advertiser</strong> whose code you scanned can see scan counts, general
          performance trends for their ad, and the contact list of anyone who opted in. They may
          use that list to follow up with you directly (for example, sending a coupon or
          promotion) — how they use it is between you and that business.
        </li>
        <li>
          <strong>KYOVA Spotlight</strong>, as the platform operator, has technical
          access to this data in order to operate the service, troubleshoot issues, and report
          aggregate performance trends (e.g., &quot;this route averages 40 scans per run&quot;) back
          to advertisers and prospective advertisers. We do not use individual contact
          information for our own marketing, and we do not sell or share lead data between
          advertisers.
        </li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li>
          Submitting your contact information is always optional — scanning the code and
          viewing the offer does not require it, and you can skip straight to the
          advertiser&apos;s site.
        </li>
        <li>
          If you&apos;d like a business to remove your information from their list, contact that
          business directly, or reach out to us at [CONTACT EMAIL] and we&apos;ll help facilitate
          the request.
        </li>
      </ul>

      <h2>Data retention</h2>
      <p>
        We retain scan and lead data for as long as needed to provide reporting to advertisers,
        and will delete it on request where we&apos;re able to.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or a specific advertiser&apos;s use of your information:{" "}
        <strong>[CONTACT EMAIL / PHONE]</strong>
      </p>

      <hr />
      <p>
        <em>
          This is a starting template, not legal advice — worth a quick review by an attorney
          once you&apos;re capturing real customer data at volume, particularly if you expand
          outside West Virginia.
        </em>
      </p>
      </main>
    </>
  );
}
