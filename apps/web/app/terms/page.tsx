import type { Metadata } from 'next'
import { LegalLayout, type LegalSection } from '@/components/legal/legal-layout'

export const metadata: Metadata = {
  title: 'Terms of Service — CastFlow',
  description:
    'The agreement between you and CastFlow Ltd. Account rules, payments, contracts, and dispute resolution — written in plain English.',
}

const SECTIONS: LegalSection[] = [
  {
    id: 'agreement',
    title: 'The agreement',
    body: (
      <>
        <p>
          These Terms of Service form a binding agreement between you and{' '}
          <strong>CastFlow Ltd</strong>, a company registered in England &amp;
          Wales (Companies House <strong>14582910</strong>) with its registered
          office at 124 City Road, London EC1V 2NX. By creating a CastFlow
          account or using the platform, you agree to these Terms.
        </p>
        <p>
          We may update these Terms from time to time. When we do, we&apos;ll
          email every active account and update the &quot;Last updated&quot;
          stamp at the top of this page. Continued use of CastFlow after a
          change means you accept the new version.
        </p>
      </>
    ),
  },
  {
    id: 'who-can-use',
    title: 'Who can use CastFlow',
    body: (
      <>
        <p>
          CastFlow is a UK casting marketplace. To use it you must:
        </p>
        <ul>
          <li>
            be <strong>at least 18 years old</strong> — we hard-block under-18
            sign-ups and there are no exceptions
          </li>
          <li>be legally able to enter a binding contract</li>
          <li>
            provide accurate information, including a valid government-issued
            ID if you sign up as an artist
          </li>
          <li>
            comply with all applicable laws — including UK GDPR, the Equality
            Act 2010, and immigration / right-to-work rules
          </li>
        </ul>
        <p>
          We may refuse, suspend, or terminate any account that breaches these
          Terms, with or without notice depending on the severity of the issue.
        </p>
      </>
    ),
  },
  {
    id: 'accounts',
    title: 'Accounts and verification',
    body: (
      <>
        <p>
          CastFlow has three account types: <strong>artist</strong>,{' '}
          <strong>caster</strong>, and <strong>admin</strong>. Artists must
          submit ID for human review before bidding on any shoot. Casters can
          browse and post immediately after verifying their email.
        </p>
        <p>
          You are responsible for everything that happens on your account. Keep
          your credentials private. Notify us immediately at{' '}
          <a href="mailto:safety@castflow.co.uk">safety@castflow.co.uk</a> if
          you suspect unauthorised access.
        </p>
        <p>
          One person, one account. Duplicate accounts are flagged at the ID
          verification stage and removed.
        </p>
      </>
    ),
  },
  {
    id: 'bookings',
    title: 'Bookings, bids, and contracts',
    body: (
      <>
        <p>
          Casters post shoots; artists submit bids; bookings are confirmed when
          a caster accepts a bid and contract terms are agreed. Each booking
          generates an <strong>e-signed contract</strong> that records both
          parties&apos; legal names, agreed rate, usage rights, exclusivity,
          and any NDA clauses. Signed contracts are enforceable under the UK{' '}
          <strong>Electronic Communications Act 2000</strong>.
        </p>
        <p>
          Once both parties sign, the booking is binding. Cancellation terms
          are set out in the contract and the cancellation table below.
        </p>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Subscription and job fees',
    body: (
      <>
        <p>
          CastFlow charges <strong>casters a recurring subscription</strong> to
          access and use the platform. This subscription is the only money
          CastFlow collects. The current plans and prices are set out on our{' '}
          <a href="/pricing">Pricing page</a>. <strong>Artists pay nothing</strong>{' '}
          — there is no artist subscription, listing fee, or platform charge of
          any kind.
        </p>
        <p>
          <strong>Job fees are arranged and paid directly between the caster
          and the artist, off-platform</strong>, on whatever terms the two
          parties agree (before, at, or after the shoot). CastFlow does{' '}
          <strong>not</strong> process, hold, escrow, or take any commission or
          percentage of job fees, and is not a paying agent, payment processor,
          or escrow holder for those fees.
        </p>
        <p>
          The agreed rate is recorded on the booking contract so both parties
          have a clear written record of what was agreed. Responsibility for
          actually paying the agreed fee rests entirely with the caster and
          artist.
        </p>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Cancellations and disputes',
    body: (
      <>
        <p>
          Cancellation terms are advisory terms in the booking contract that
          the two parties agree to and settle directly between themselves.
          CastFlow records them but does not move money. They depend on how
          close to the shoot date the cancellation happens:
        </p>
        <ul>
          <li>
            <strong>More than 48 hours before shoot:</strong> no cancellation
            fee.
          </li>
          <li>
            <strong>Within 48 hours of shoot:</strong> the cancelling party
            owes <strong>50% of the agreed rate</strong> to the other party,
            payable directly off-platform.
          </li>
          <li>
            Artists cancelling under 48 hours additionally receive a{' '}
            <strong>strike</strong> on their account.
          </li>
        </ul>
        <p>
          Either party can raise a dispute within{' '}
          <strong>72 hours of the shoot date</strong>. A human admin reviews
          both submissions, the contract, and the message thread, then records
          an outcome. Outcomes are a record and an advisory recommendation —
          they can include finding for the artist, finding for the caster, an
          advised split, and/or a strike on the offending account. Any fee owed
          is settled <strong>directly between the parties, off-platform</strong>;
          CastFlow does not hold or transfer money.
        </p>
        <p>
          Three strikes triggers a full account review. Frivolous disputes
          (raising and losing three in a row) may also lead to suspension.
        </p>
      </>
    ),
  },
  {
    id: 'platform-rules',
    title: 'Platform rules',
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>
            arrange bookings off-platform to avoid a caster subscription, or
            otherwise circumvent the platform&apos;s fees — this is a hard ToS
            violation and accounts involved get flagged
          </li>
          <li>share or solicit contact details before a booking is confirmed</li>
          <li>impersonate anyone, falsify ID, or use someone else&apos;s likeness</li>
          <li>
            post or request content that is illegal, discriminatory, sexual
            in nature, or otherwise inappropriate
          </li>
          <li>
            scrape the platform, reverse-engineer our systems, or interfere
            with operation in any way
          </li>
        </ul>
        <p>
          Violations may lead to immediate suspension, removal of content, or
          legal action where appropriate.
        </p>
      </>
    ),
  },
  {
    id: 'content',
    title: 'Content and likeness rights',
    body: (
      <>
        <p>
          Artists retain the rights to their own image and portfolio. Uploading
          a photo to CastFlow grants us a limited, non-exclusive licence to
          display that photo on your profile and on platform features (e.g.
          search results) until you delete it or close your account.
        </p>
        <p>
          Usage rights for shoot deliverables are set out in each booking
          contract — they apply between the caster and artist directly, not
          between CastFlow and either party.
        </p>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Liability and indemnity',
    body: (
      <>
        <p>
          CastFlow provides the marketplace; we are not the employer of any
          artist or the agent of any caster. Bookings are direct contracts
          between the two users.
        </p>
        <p>
          To the maximum extent permitted by law, CastFlow&apos;s total
          liability to you for any claim arising out of these Terms is capped
          at the greater of (a) £100, or (b) the total subscription fees you
          paid us in the 12 months before the claim.
        </p>
        <p>
          Nothing in these Terms limits liability for death or personal injury
          caused by negligence, fraud, or any liability that cannot be limited
          under English law.
        </p>
      </>
    ),
  },
  {
    id: 'termination',
    title: 'Termination',
    body: (
      <>
        <p>
          You can delete your CastFlow account at any time from{' '}
          <strong>Settings → Account → Close account</strong>, unless you have
          active bookings. We may suspend or terminate any account that breaches
          these Terms.
        </p>
        <p>
          Closing your account does not cancel any in-flight contracts or
          remove your obligations under signed bookings — those run their
          natural course or get resolved via the dispute process.
        </p>
      </>
    ),
  },
  {
    id: 'law',
    title: 'Governing law',
    body: (
      <>
        <p>
          These Terms are governed by the laws of <strong>England and Wales</strong>.
          Any dispute will be subject to the exclusive jurisdiction of the
          courts of England and Wales.
        </p>
        <p>
          If you have any questions about these Terms, email us at{' '}
          <a href="mailto:legal@castflow.co.uk">legal@castflow.co.uk</a>.
        </p>
      </>
    ),
  },
]

export default function TermsPage() {
  return (
    <LegalLayout
      eyebrow="Terms of Service"
      title="The rules,"
      titleAccent="in plain English."
      intro="This is the agreement between you and CastFlow Ltd. It covers account rules, payments, contracts, cancellations, and dispute resolution. No fine-print buried at the bottom."
      lastUpdated="19 May 2026"
      sections={SECTIONS}
    />
  )
}
