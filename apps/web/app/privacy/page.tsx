import type { Metadata } from 'next'
import { LegalLayout, type LegalSection } from '@/components/legal/legal-layout'

export const metadata: Metadata = {
  title: 'Privacy policy — CastFlow',
  description:
    'What data CastFlow collects, why we collect it, and the rights you have over it under UK GDPR. No tracking pixels, no resold data.',
}

const SECTIONS: LegalSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <>
        <p>
          This Privacy Policy explains what personal data CastFlow Ltd
          (&quot;CastFlow&quot;, &quot;we&quot;) collects, why we collect it,
          and what rights you have over it. We are the{' '}
          <strong>data controller</strong> for the information you provide on
          the platform.
        </p>
        <p>
          Two principles guide everything we do with your data:
        </p>
        <ul>
          <li>
            <strong>Minimum necessary.</strong> We only ask for what we need to
            run the platform safely.
          </li>
          <li>
            <strong>Never resold.</strong> We do not sell, rent, or share your
            data with advertisers, brokers, or any third party outside the
            limited service providers listed below.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: (
      <>
        <p>
          The data controller is <strong>CastFlow Ltd</strong>, a company
          registered in England &amp; Wales (Companies House{' '}
          <strong>14582910</strong>) with its registered office at 124 City
          Road, London EC1V 2NX.
        </p>
        <p>
          For any privacy enquiries — including data subject access requests
          — email{' '}
          <a href="mailto:privacy@castflow.co.uk">privacy@castflow.co.uk</a>.
          We aim to reply within one month, as required by UK GDPR.
        </p>
      </>
    ),
  },
  {
    id: 'data-we-collect',
    title: 'What data we collect',
    body: (
      <>
        <p>The categories of data we hold depend on your role:</p>
        <ul>
          <li>
            <strong>All accounts:</strong> name, email, password (hashed),
            sign-in timestamps, IP address at sign-in, browser type.
          </li>
          <li>
            <strong>Artists:</strong> date of birth (for 18+ verification),
            government-issued ID document (stored encrypted, accessed only by
            admin during approval), gender, pronouns, city, bio, model or
            actor stats, portfolio images, skills.
          </li>
          <li>
            <strong>Casters:</strong> company name, company type, contact
            name, phone, website, Stripe subscription billing details.
          </li>
          <li>
            <strong>Bookings:</strong> contract details (including the agreed
            rate), message threads, and file attachments.
          </li>
        </ul>
        <p>
          We <strong>do not</strong> use third-party advertising trackers, do
          not run Google Analytics or similar profiling pixels, and do not
          attempt to fingerprint your device beyond what your browser sends in
          standard requests.
        </p>
      </>
    ),
  },
  {
    id: 'lawful-basis',
    title: 'Lawful basis for processing',
    body: (
      <>
        <p>
          Under UK GDPR, every piece of processing needs a lawful basis. Ours
          are:
        </p>
        <ul>
          <li>
            <strong>Contract.</strong> We process most data because it&apos;s
            necessary to deliver the platform you signed up for (account,
            bookings, payments, contracts).
          </li>
          <li>
            <strong>Legal obligation.</strong> Some processing is required by
            UK law — record-keeping for tax, subscription billing checks via
            Stripe, complying with court orders.
          </li>
          <li>
            <strong>Legitimate interest.</strong> Fraud prevention, platform
            security, dispute resolution, and product analytics on aggregated
            (non-identifying) data.
          </li>
          <li>
            <strong>Consent.</strong> For optional emails like the new-jobs
            digest. You can withdraw consent any time in your settings.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'who-sees',
    title: 'Who sees your data',
    body: (
      <>
        <p>
          Within the platform, access is layered to match the booking lifecycle:
        </p>
        <ul>
          <li>
            <strong>Public profile (artists):</strong> first name, city,
            portfolio, ratings, skills, availability.
          </li>
          <li>
            <strong>After shortlisting:</strong> direct messaging unlocks
            between the caster and artist.
          </li>
          <li>
            <strong>After booking confirmed:</strong> full legal name, phone,
            and contract details become visible to both parties.
          </li>
          <li>
            <strong>Never visible to other users:</strong> date of birth, ID
            document, internal strike count, full Stripe IDs. These are
            admin-only.
          </li>
        </ul>
        <p>
          We share data with a small set of <strong>service providers</strong>{' '}
          to run the platform — they act as data processors under contract and
          only use the data for the purpose we instruct:
        </p>
        <ul>
          <li><strong>Stripe</strong> — caster subscription billing</li>
          <li><strong>Cloudflare R2</strong> — file storage</li>
          <li><strong>Resend</strong> — transactional email</li>
          <li><strong>Railway / Vercel</strong> — server hosting</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar tech',
    body: (
      <>
        <p>
          CastFlow uses cookies sparingly. The categories we set are:
        </p>
        <ul>
          <li>
            <strong>Strictly necessary:</strong> session cookie for sign-in,
            CSRF token. Always on — these are required for the site to work.
          </li>
          <li>
            <strong>Preferences:</strong> e.g. selected theme. First-party,
            stored locally.
          </li>
        </ul>
        <p>
          We do not set advertising cookies and have no third-party tracking
          pixels embedded in the site. Because we don&apos;t use
          non-essential cookies, no consent banner is needed.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep data',
    body: (
      <>
        <p>
          Retention periods depend on category:
        </p>
        <ul>
          <li>
            <strong>Account data:</strong> for the lifetime of your account.
            Delete the account and we delete this within 30 days.
          </li>
          <li>
            <strong>ID documents:</strong> kept for 12 months after approval
            for fraud / duplicate-check purposes, then automatically purged.
          </li>
          <li>
            <strong>Booking and contract records:</strong> retained for{' '}
            <strong>7 years</strong> after the booking date — required by UK
            tax and contract law.
          </li>
          <li>
            <strong>Message threads:</strong> kept for the booking lifecycle
            plus the 72-hour dispute window. Threads tied to a closed dispute
            are kept for 7 years.
          </li>
          <li>
            <strong>Server logs:</strong> 30 days, then automatically deleted.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    body: (
      <>
        <p>
          Under UK GDPR you have the right to:
        </p>
        <ul>
          <li>
            <strong>Access</strong> a copy of your data
          </li>
          <li>
            <strong>Rectify</strong> data that&apos;s wrong or incomplete
          </li>
          <li>
            <strong>Erase</strong> your data, subject to our legal retention
            obligations
          </li>
          <li>
            <strong>Restrict</strong> or <strong>object to</strong> certain
            processing
          </li>
          <li>
            <strong>Port</strong> your data to another service in a
            machine-readable format
          </li>
          <li>
            <strong>Withdraw consent</strong> where we relied on it
          </li>
        </ul>
        <p>
          Most rights are exercisable directly inside your account settings
          (download your data, edit your profile, close your account). For
          anything more involved, email{' '}
          <a href="mailto:privacy@castflow.co.uk">privacy@castflow.co.uk</a>.
        </p>
        <p>
          If you&apos;re unhappy with how we&apos;ve handled your data, you
          have the right to complain to the{' '}
          <strong>Information Commissioner&apos;s Office (ICO)</strong> at{' '}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">
            ico.org.uk
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: 'international',
    title: 'International transfers',
    body: (
      <>
        <p>
          Most data is processed in the UK and EU. Some of our service
          providers (e.g. Stripe, Cloudflare) operate globally and may process
          data outside the UK / EEA. When this happens we rely on the UK
          International Data Transfer Agreement or equivalent safeguards, as
          required by UK GDPR.
        </p>
      </>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    body: (
      <>
        <p>
          We follow industry-standard security practices: encrypted transport
          (TLS), encrypted file storage (R2 server-side encryption), hashed
          and salted passwords, scoped database access, audit logging for
          admin actions, and regular dependency patching.
        </p>
        <p>
          Despite this, no system is 100% secure. If we ever experience a
          breach affecting your data, we will notify you and the ICO within 72
          hours as required by UK GDPR.
        </p>
      </>
    ),
  },
  {
    id: 'updates',
    title: 'Updates to this policy',
    body: (
      <>
        <p>
          We&apos;ll update this Privacy Policy if our data practices change.
          When that happens, we&apos;ll update the &quot;Last updated&quot;
          stamp at the top of this page and, for material changes, email every
          active account.
        </p>
        <p>
          The latest version is always the one displayed on this page.
        </p>
      </>
    ),
  },
]

export default function PrivacyPage() {
  return (
    <LegalLayout
      eyebrow="Privacy policy"
      title="Your data,"
      titleAccent="not theirs."
      intro="What we collect, why we collect it, and the rights UK GDPR gives you over it. No advertising pixels, no resold data, no fine print buried at the bottom."
      lastUpdated="19 May 2026"
      sections={SECTIONS}
    />
  )
}
