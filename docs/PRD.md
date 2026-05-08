# CastFlow — Product Requirements Document

**Version:** 1.0 — MVP  
**Status:** Approved for Development  
**Market:** United Kingdom  
**Last Updated:** May 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem We're Solving](#2-the-problem-were-solving)
3. [What CastFlow Is](#3-what-castflow-is)
4. [Who Uses It — User Personas](#4-who-uses-it--user-personas)
5. [MVP Scope — What's In and What's Out](#5-mvp-scope--whats-in-and-whats-out)
6. [Admin Panel — Full Feature Spec](#6-admin-panel--full-feature-spec)
7. [Caster Panel — Full Feature Spec](#7-caster-panel--full-feature-spec)
8. [Artist Panel — Full Feature Spec](#8-artist-panel--full-feature-spec)
9. [How the Platform Works — End to End](#9-how-the-platform-works--end-to-end)
10. [Edge Cases & Business Rules](#10-edge-cases--business-rules)
11. [Payments & Money Flow](#11-payments--money-flow)
12. [Contracts & Legal](#12-contracts--legal)
13. [Trust & Safety](#13-trust--safety)
14. [Notifications](#14-notifications)
15. [Screen Inventory](#15-screen-inventory)
16. [Data & Privacy](#16-data--privacy)
17. [Tech Stack](#17-tech-stack)

---

## 1. Executive Summary

CastFlow is a UK-based online marketplace that connects brands, agencies, and production companies (called **Casters**) with professional models and actors (called **Artists**) for photo and video shoots.

The platform works like a job board with a bidding system — casters post shoot jobs, artists bid for them, and the platform handles the booking, contract, and payment end to end.

The business is operated by a marketing agency that uses CastFlow for its own shoots, while also opening the platform to other casters on a subscription basis. All revenue, contracts, and payments flow through the platform.

**The MVP goal is a working, end-to-end platform that can:**

- Get an artist discovered and booked for a job
- Handle the contract and secure payment
- Be trusted by both sides to be fair

---

## 2. The Problem We're Solving

Today, hiring models and actors for commercial shoots is broken in several ways:

- **It happens over WhatsApp and email** — no paper trail, no contracts, no accountability
- **Agencies act as gatekeepers** — expensive, slow, and not suited for smaller shoots
- **There's no reliable place for artists to find work** — especially newer talent
- **Payments are informal** — artists often chase invoices for weeks after a shoot
- **There's no reputation system** — casters don't know who's reliable, and artists don't know which casters are legitimate

CastFlow fixes all of this in one platform.

---

## 3. What CastFlow Is

CastFlow is a **dual-sided marketplace** — it serves two types of users who need each other.

On one side: **Casters** (brands, agencies, production companies) who need to find and book talent quickly and professionally.

On the other side: **Artists** (models and actors) who want to find paid work without going through a costly agency.

The platform sits in the middle and provides:

- A structured job posting and bidding system
- A verified directory of approved artists
- Automated contracts with e-signatures
- Secure escrow-based payments
- A review and reputation system
- A messaging system (all communication stays on-platform)

Think of it as **Upwork, but specifically built for the UK commercial photography and film production industry.**

---

## 4. Who Uses It — User Personas

### 4.1 The Admin

**Who they are:** The internal team running the platform (your agency staff).

**What they do:**

- Approve or reject artist applications
- Moderate the platform (remove bad jobs, flag abusive users)
- Oversee all payments and resolve disputes
- View platform analytics and health metrics
- Manage user accounts (suspend, ban)

**What they need:** A clear, fast back-office dashboard that lets them action things without getting in the way.

---

### 4.2 The Caster

**Who they are:** A brand marketing manager, a creative producer, a freelance art director, or an agency. They need to hire talent for a specific shoot.

**Their typical journey:**

> "I have a summer campaign shoot in two weeks. I need two female models, 20–28, London-based. I want to post the job, see who bids, pick the best fit, sort a contract and get them paid after the shoot."

**What they need:**

- Quick job posting (under 5 minutes)
- A searchable artist directory to find people proactively
- A clean way to manage bids and communicate with shortlisted artists
- Simple payment — pay once, it's held safely, released after the shoot
- Peace of mind that contracts and usage rights are covered

**Pain points today:** Sourcing talent is scattered across Instagram DMs, agency emails, and WhatsApp groups. No central record-keeping. No contracts. No accountability.

---

### 4.3 The Artist — Model

**Who they are:** A professional or aspiring model based in the UK looking for paid commercial work — campaigns, editorial, e-commerce, TVC.

**Their typical journey:**

> "I want to find casting calls that match my look without going through an agency. I want to bid on jobs, communicate with casters, and get paid properly with a contract."

**What they need:**

- A professional profile that shows their portfolio and stats
- A feed of relevant jobs they can bid on
- Status visibility — to know where their bids are at
- Reliable payment they don't have to chase
- A track record (reviews) they can build over time

---

### 4.4 The Artist — Actor

Same as the model persona, with different profile requirements — demo reel instead of portfolio photos, skills and accents rather than physical measurements.

---

## 5. MVP Scope — What's In and What's Out

### What's In (Must Have for Launch)

| Area                                              | Included |
| ------------------------------------------------- | -------- |
| Artist onboarding (model + actor, separate flows) | ✅       |
| Admin approval of artist applications             | ✅       |
| Caster registration (instant, no approval needed) | ✅       |
| Job posting (full detail)                         | ✅       |
| Public job feed with filters                      | ✅       |
| Artist bidding on jobs                            | ✅       |
| Bid management (shortlist, reject, accept)        | ✅       |
| Talent search & shortlisting                      | ✅       |
| Direct invite to apply                            | ✅       |
| In-platform messaging (unlocked on shortlist)     | ✅       |
| Booking confirmation flow                         | ✅       |
| Contract generation & e-signature                 | ✅       |
| Escrow payment via Stripe                         | ✅       |
| Post-shoot completion & payout                    | ✅       |
| Cancellation with penalty logic                   | ✅       |
| Dispute resolution                                | ✅       |
| Reviews (both directions)                         | ✅       |
| Email notifications                               | ✅       |
| Artist profile with portfolio                     | ✅       |
| Caster profile                                    | ✅       |
| Admin dashboard                                   | ✅       |

### What's Out (Phase 2)

| Feature                                 | Reason Deferred                 |
| --------------------------------------- | ------------------------------- |
| Calendar / availability sync            | Platform functions without it   |
| Mobile app (iOS / Android)              | Web is enough for MVP           |
| Comp card auto-generator                | Artists upload their own        |
| Multi-seat caster teams                 | Most early casters are solo     |
| Background check integration            | Manual workaround sufficient    |
| Portfolio watermarking                  | Not day-one critical            |
| Subscription tiers (multiple plans)     | One plan at launch              |
| Smart job recommendations (AI matching) | Needs usage data first          |
| Counter-offer on bids                   | Keep it simple first            |
| DocuSign / Adobe Sign integration       | Basic e-signature is sufficient |
| Auto ID verification (Onfido etc.)      | Manual admin review at launch   |

---

## 6. Admin Panel — Full Feature Spec

The admin panel is the operational control room. It is only accessible to internal team members.

### 6.1 Dashboard

- Summary tiles: total users, pending artist applications, open disputes, revenue this month, bookings this week
- Quick links to action queues (applications, disputes, flagged content)

### 6.2 Artist Application Queue

- Table view of all pending artist applications
- Filter by type (model / actor), date submitted, location
- Open any application and see a full profile preview exactly as it would appear publicly
- View uploaded ID document (secure, no download)
- Actions:
  - **Approve** — artist is notified by email, profile goes live
  - **Reject** — admin selects a rejection reason from a list, artist is notified with the reason and told they can reapply

**Rejection reasons available:**

- Portfolio quality too low
- ID document unclear or invalid
- Profile information incomplete
- Suspected duplicate account
- Other (free text required)

### 6.3 User Management

- Full table of all users (artists + casters) with search and filter
- Click any user to see their full account and linked profile
- Actions on any account: Suspend (temporary) or Ban (permanent)
- Suspended users see a "Your account has been suspended" screen on login
- Banned users cannot log in; if they try to register again, their email is blocked

### 6.4 Job Management

- View all jobs posted on the platform (active, filled, expired, cancelled)
- Search by caster, category, status, date
- Click any job to see full detail including all bids on it
- Actions: Remove job from platform (with reason), flag for review

### 6.5 Booking & Payment Oversight

- View all bookings with their payment status
- See escrow status per booking (held / released / refunded / disputed)
- Ability to force-release escrow in exceptional circumstances
- Ability to issue a refund
- Revenue summary: total platform commission earned by period

### 6.6 Dispute Queue

- All open and in-review disputes in a prioritised list
- Click dispute to see full detail: both parties' submissions, the booking, the message history
- Admin resolves the dispute by selecting an outcome:
  - Full payment released to artist
  - Full refund to caster
  - Split (admin sets percentage for each party)
  - Escalate (rare, for legal situations)
- Both parties are notified of the outcome with the admin's decision
- Every dispute resolution is logged permanently

### 6.7 Flagged Content

- Reports on jobs, messages, reviews, and profiles in one queue
- Admin reviews each and either: clears the flag (no action needed) or takes action (remove content, warn user, suspend)

### 6.8 Analytics

- New users per week (artists + casters)
- Jobs posted per week
- Booking fill rate (jobs posted vs. jobs that resulted in a booking)
- Revenue over time
- Dispute rate
- Average time from job post to booking

### 6.9 Admin Audit Log

- Every admin action is recorded: who did it, what they did, when, and on which entity
- Cannot be deleted or edited — permanent record

---

## 7. Caster Panel — Full Feature Spec

### 7.1 Registration & Onboarding

Casters can register and access the platform immediately after verifying their email. No admin approval required.

**Information collected at signup:**

- Company name
- Company type (Brand / Agency / Production House / Independent)
- Contact name
- Email and password (or social login via Google / Apple)

**After email verification:**

- Immediate access to the full caster panel
- Prompted to post their first job or explore the talent directory

### 7.2 Dashboard

- Summary of active jobs with bid counts
- Unread messages indicator
- Upcoming confirmed shoot dates
- Total spend this month
- Quick action: "Post a New Job"

### 7.3 Job Posting

A 6-step wizard that takes under 5 minutes to complete.

**Step 1 — Job Basics**

- Job title (e.g. "Female Model for Summer Campaign Shoot")
- Category: Model / Actor / Voiceover / Extra
- Subcategory: Fashion / Commercial / Editorial / TVC / Digital / Other
- Job description (rich text — can include brand context, mood, references)

**Step 2 — Requirements**

- Gender required (Male / Female / Non-binary / Any)
- Age range (min and max)
- City / location of shoot
- For model jobs: optional physical requirements (height range, dress size range, skin tone)
- For actor jobs: skills required (multi-select: accents, languages, special skills)

**Step 3 — Shoot Details**

- Shoot date
- Duration (hours)
- Rate: either a **Fixed Rate** (caster sets the fee) or **Open to Bids** (artists propose their rate)
- Number of artists needed (headcount — can be more than 1)
- Application deadline

**Step 4 — Legal**

- NDA required? (Yes / No)
- Exclusivity clause? (Yes / No — e.g. artist cannot work with direct competitors for 6 months)
- Usage rights description (free text — e.g. "UK digital, social media, 12 months")

**Step 5 — Visibility**

- Public (anyone who matches the requirements can see and bid)
- Invite Only (caster will search the talent directory and invite specific artists)

**Step 6 — Review & Post**

- Full summary of everything entered
- Edit any section before posting
- On posting, matching artists are notified (if public job)

### 7.4 Talent Search & Discovery

- Search the full approved artist directory
- Filters: category, gender, age range, city, height range, skin tone, hair colour, eye colour, skills, experience level, minimum rating
- Sort by: most reviewed, highest rated, most jobs completed, newest
- View any artist's full public profile
- Shortlist artists (save for later across all jobs)
- Send a direct invite to apply to a specific job

### 7.5 Bid Management

When bids come in on a job:

- View all bids in a list for that job
- Each bid shows: artist photo, name, proposed rate, cover note, highlighted portfolio items
- Click through to the artist's full profile
- Actions on each bid:
  - **Shortlist** — notifies the artist, unlocks messaging with them
  - **Reject** — artist is notified. Can be undone within 24 hours
  - **Accept** — triggers the booking flow

Sorting and filtering bids by: date submitted, proposed rate, shortlisted status.

### 7.6 Booking Flow (on accepting a bid)

1. Confirmation modal showing: artist name, job, agreed rate, shoot date
2. Payment screen — caster pays the agreed amount into secure escrow
3. Booking is confirmed — both parties notified
4. Contract is auto-generated — both parties sign it
5. Full shoot details (address, call time) are revealed to the artist once contract is signed

### 7.7 Messaging

- In-platform chat with each shortlisted artist, per job
- Messaging is unlocked when the caster shortlists an artist — not before
- Email notification when a new message arrives
- All messages are stored permanently (used if a dispute arises)
- No personal contact details (phone, personal email) should be shared before booking — this is in the Terms of Service and flagged to users

### 7.8 Payments

- Escrow model: caster pays the agreed rate into a secure Stripe account when the booking is confirmed
- Platform commission is deducted from the artist's side at payout (not an extra charge to the caster)
- After the shoot, caster clicks "Confirm Completion" to release the payment to the artist
- If the caster does not confirm within 48 hours of the shoot date, payment is automatically released
- Full payment history with downloadable invoices

### 7.9 Post-Shoot: Reviews

- After shoot completion, caster is prompted to rate the artist (1–5 stars + optional comment)
- 14-day window to leave a review
- Reviews are public on the artist's profile
- Casters can also be rated by artists — their rating is visible to artists considering a booking

### 7.10 Account & Settings

- Edit company info, contact name
- Change email and password
- Notification preferences (which emails to receive)
- Billing history
- Delete account (blocked if there are active bookings or escrow funds held)

---

## 8. Artist Panel — Full Feature Spec

### 8.1 Onboarding — Model

A 6-step process, submitted for admin approval before the artist can access the platform.

**Step 1 — Personal Info**

- Full name, date of birth (must be 18+ — hard block if under 18)
- Gender and pronouns
- City (UK only)
- Short bio (up to 300 characters, optional)

**Step 2 — Physical Stats**

- Height (cm or ft/in)
- Dress size and shoe size
- Bust, waist, hip measurements (optional)
- Hair colour, eye colour
- Skin tone (visual selector: fair / light / medium / olive / tan / deep)

**Step 3 — Experience & Rates**

- Experience level: New Face / Semi-Pro / Professional
- Hourly rate, half-day rate, full-day rate (all optional — can leave blank and always negotiate via bids)
- Instagram handle (optional but encouraged)

**Step 4 — Portfolio**

- Minimum 3 photos required
- Must include: a headshot, a full-body shot, and at least one other (editorial or commercial)
- Photo upload via drag and drop
- Each photo can have a caption
- One photo is set as the primary (shown as profile photo)

**Step 5 — Identity Verification**

- Upload front of passport or UK driving licence
- Stored securely — only visible to admin, never publicly accessible

**Step 6 — Review & Submit**

- Full summary of everything entered
- Edit any section before submitting
- On submission, goes into admin approval queue

### 8.2 Onboarding — Actor

Same structure as above, with these differences:

- Physical stats: height only as required (no measurements)
- Additional step: Skills (multi-select: accents, languages, special skills, training)
- Portfolio: Headshot required; video demo reel (YouTube/Vimeo link or direct upload) required; additional photos optional
- Optional: Spotlight profile URL, Equity membership status, age range they can play

### 8.3 Approval Waiting State

After submitting onboarding:

- Artist sees a "Your application is under review" screen
- Expected turnaround: within 48 hours
- If approved: email notification, full access to the platform
- If rejected: email with specific reason, ability to correct and resubmit

### 8.4 Artist Profile

The public-facing page that casters see. Includes:

- Primary photo, name, city, experience level
- Bio
- Physical stats (for models) / skills (for actors)
- Full photo portfolio / video reel
- Rating (average stars + number of reviews)
- Jobs completed count
- Availability status badge (Available / Not Available — artist controls this)
- Reviews from past casters
- Shareable URL (e.g. castflow.co.uk/artists/jane-smith)

### 8.5 Job Feed

- Feed of all active, public jobs matching the artist's category
- Filter by: city, shoot date range, rate range
- Each job card shows: title, category, shoot date, location, rate (or "Open to Bids"), spots remaining
- Click to see full job detail
- Save jobs to review later
- Artist cannot see how many others have bid on a job (prevents discouragement)

### 8.6 Submitting a Bid

1. Open a job → "Submit Bid"
2. Enter proposed rate (if job is fixed rate, this is pre-filled and cannot be changed)
3. Write a cover note (up to 500 characters) — prompted: "Tell the caster why you're right for this job"
4. Select up to 5 portfolio items to highlight with this bid
5. Review and submit
6. Bid appears in "My Bids" with status: Pending

**Rules:**

- One bid per artist per job (no re-bidding)
- Can edit a bid while it's still in "Pending" status (before caster has reviewed it)
- Can withdraw a bid while it's in "Pending" status

### 8.7 My Bids

Tabs for: Pending / Shortlisted / Rejected / Accepted / All

Each bid shows:

- Job title and caster (company name only)
- Proposed rate
- Current status
- Date submitted
- Link to the full job

### 8.8 Bookings

After a bid is accepted:

- Booking confirmation with all shoot details
- Contract available to review and sign
- Once contract is signed, full shoot address is revealed
- Caster's contact details (name + email) are shown
- Booking detail shows: shoot date, time, location, agreed rate, net payout (after platform commission)

### 8.9 Earnings Dashboard

- Summary: total earned (all time), pending payouts (in escrow), paid out
- Per-booking breakdown: gross rate / platform commission / net payout / status
- Stripe Connect setup: connect UK bank account for payouts (sort code + account number)
- Payouts typically arrive within 2–3 business days of release

### 8.10 Messaging

- Inbox showing all active message threads
- Threads are per job/caster pair
- Email notification on new message
- Messages are unlocked only after being shortlisted by that caster

### 8.11 Reviews

- View all reviews received from casters
- Leave a review for a caster after a completed booking
- 14-day window to leave a review after shoot completion

### 8.12 Notifications

Email notifications for all key events. In-app notification bell for real-time updates.

### 8.13 Account & Settings

- Edit profile details and portfolio (changes to certain fields may require re-review)
- Change email and password
- Notification preferences
- Connect / manage payout bank account
- Availability toggle
- Delete account (blocked if there are active bookings or pending payouts)

---

## 9. How the Platform Works — End to End

This section describes the full lifecycle of a job from post to payout, in plain language.

### 9.1 The Core Journey

```
1. CASTER POSTS A JOB
   A caster fills in a job post (5 minutes).
   The job goes live and matching artists are notified.

2. ARTISTS BID
   Artists browse the job feed, find the job, and submit a bid
   with their rate and a cover note highlighting why they're right for it.

3. CASTER REVIEWS & SHORTLISTS
   The caster reviews bids on their dashboard.
   They shortlist the ones they like — this unlocks messaging.

4. CONVERSATION (OPTIONAL)
   Caster and shortlisted artists can message each other to
   discuss the shoot before a decision is made.

5. CASTER ACCEPTS A BID
   The caster clicks "Accept" on their chosen artist.
   This triggers the booking flow.

6. PAYMENT INTO ESCROW
   The caster pays the agreed amount via Stripe.
   The money is held securely — neither party can touch it yet.

7. CONTRACT SIGNED
   A contract is automatically generated with the key terms.
   Both parties sign it with their typed name.
   Once both have signed, the full shoot address is revealed.

8. SHOOT DAY
   The artist turns up. The shoot happens.

9. COMPLETION & PAYOUT
   The caster confirms the shoot went ahead.
   The payment is released to the artist's bank account.
   If the caster does nothing within 48 hours, payment is auto-released.

10. REVIEWS
    Both parties rate each other.
    The review builds their reputation for future bookings.
```

### 9.2 Multi-Artist Jobs

If a job requires more than one artist (headcount > 1):

- The job stays open with a "X spots remaining" counter
- The caster can accept multiple bids until headcount is filled
- Once filled, all remaining pending bids are automatically notified that the job is closed
- Each accepted artist goes through their own separate booking → contract → payment flow

### 9.3 Invite-Only Jobs

- Caster can set a job as "Invite Only" — it does not appear in the public feed
- Caster uses the talent search to find specific artists they want
- Sends them a direct invite to apply
- Artist receives a notification and can choose to submit a bid or decline

---

## 10. Edge Cases & Business Rules

### 10.1 Age Restriction

- Artists must be 18 or older to register. Date of birth is collected at onboarding.
- A hard block is in place — under-18s cannot proceed past the age entry step.
- This is non-negotiable and applies in all circumstances.

### 10.2 Duplicate Accounts

- Artists cannot have more than one account. ID documents are reviewed manually for duplicates.
- If a banned user attempts to re-register, their email is blocked.

### 10.3 Job Editing After Bids Received

- Casters can edit non-critical fields (description, notes) at any time before the job is filled.
- Changes to critical fields (rate, shoot date, category) trigger a notification to all existing bidders.
- Bidders have the option to withdraw their bid after a critical field change.

### 10.4 Job Auto-Expiry

- If a job receives no activity for 14 days, the caster is sent a reminder email.
- If the application deadline passes and the job is still open, it auto-closes.
- All pending bidders are notified when a job closes without a hire.

### 10.5 Bid Rules

- One bid per artist per job — no exceptions.
- A bid can be edited while in "Pending" status (caster hasn't reviewed it yet).
- A bid can be withdrawn while in "Pending" status.
- Once a bid is shortlisted, it is locked — no edits or withdrawal.
- A rejected bid can be undone by the caster within 24 hours.

### 10.6 Cancellation Policy

**Artist cancels a booking:**
| How far in advance | Consequence |
|---|---|
| More than 7 days before shoot | Full escrow refunded to caster. No penalty. |
| 3–7 days before shoot | Full escrow refunded to caster. Formal warning added to artist's profile. |
| Under 48 hours before shoot | Artist receives 50% of agreed rate as a cancellation fee. Caster receives the other 50% refunded. Strike added to artist's profile. |

Three strikes = account reviewed by admin. Artist may be suspended.

**Caster cancels a booking:**
| How far in advance | Consequence |
|---|---|
| More than 48 hours before shoot | Full escrow refunded to caster. No penalty. |
| Under 48 hours before shoot | Artist receives 50% of agreed rate as a cancellation fee. Caster receives the other 50% refunded. |

### 10.7 Contract Rules

- Contract is generated automatically when a booking is confirmed and payment is received.
- Both parties must sign the contract within 72 hours.
- If the artist has not signed within 72 hours, the caster is notified and may cancel without penalty.
- The shoot address is only revealed to the artist once the contract is fully signed.
- Contract terms are locked at the time of booking — they cannot be changed after both parties sign.

### 10.8 Payment Rules

- Casters cannot confirm shoot completion before the scheduled shoot date — this is date-locked.
- If the caster does not confirm completion within 48 hours of the shoot date, payment is auto-released to the artist.
- Once payment is released, it cannot be recalled (a dispute must be raised if there is an issue).
- Disputes must be raised within 72 hours of the scheduled shoot date.
- Attempting to pay an artist directly outside the platform is a Terms of Service violation and grounds for account banning.

### 10.9 Review Rules

- Reviews can only be written after a booking is marked as completed.
- Reviews open 14 days after the shoot date and close 28 days after.
- A review cannot be edited once submitted.
- Either party can flag a review as retaliatory or defamatory. Admin reviews flagged content and can remove it.
- New artists who have no reviews display a "New to Platform" badge instead of a blank rating.

### 10.10 Off-Platform Communication

- Artists and casters cannot share personal contact details (phone, personal email) before a booking is confirmed.
- This is written into the Terms of Service.
- If personal details are shared in the messaging system, either party can report it.
- Repeat offenders are suspended.

---

## 11. Payments & Money Flow

### 11.1 How Escrow Works

CastFlow uses Stripe's payment infrastructure. When a booking is confirmed:

1. The caster's payment is captured and held in escrow (a ring-fenced Stripe account).
2. Neither party can access the funds while they're in escrow.
3. When the shoot is completed and confirmed, the funds are released.
4. Stripe deducts the platform commission and transfers the net amount to the artist's bank account.

### 11.2 Platform Commission

- A commission percentage is deducted from the artist's payout at the time of release.
- The commission rate is set by the platform (configurable by admin).
- The commission deduction is shown clearly at every step — on the bid confirmation, booking detail, and earnings screen. No surprises.
- The caster pays the agreed rate in full. The commission comes out of the artist's side, not as an additional charge.

### 11.3 Artist Payouts

- Artists connect a UK bank account (sort code + account number) via Stripe Connect.
- Payouts are initiated by Stripe automatically when escrow is released.
- Typical arrival: 2–3 business days.
- Artists can see the full breakdown: gross rate → platform commission deducted → net payout.

### 11.4 Cancellation Payments

- If a late cancellation triggers a cancellation fee (under 48 hours), Stripe handles the split automatically: the cancellation fee portion goes to the injured party, the remainder is refunded to the cancelling party.

### 11.5 Dispute Holds

- If a dispute is raised, the escrow funds are frozen — no auto-release while a dispute is open.
- Funds are only moved once admin resolves the dispute.

---

## 12. Contracts & Legal

### 12.1 What the Contract Contains

Every booking generates a contract that includes:

- Full legal names of both parties (artist and caster company)
- Job title and description
- Shoot date and confirmed location
- Agreed rate and payment terms
- Usage rights (as specified in the job posting)
- Exclusivity clause (if applicable)
- NDA (if applicable, appended as a clause)
- Platform jurisdiction and dispute process reference

### 12.2 E-Signature for MVP

For the MVP, e-signature is implemented as:

- The party reads the contract (displayed as a formatted page, downloadable as PDF)
- They type their full legal name in a signature field
- They check a confirmation checkbox: "I agree to the terms of this contract"
- The signature and timestamp are recorded

This is legally enforceable in the UK under the Electronic Communications Act 2000, provided both parties demonstrate clear intent to be bound — which the checkbox and typed name establishes.

### 12.3 Contract Storage

- Signed contracts are stored permanently as PDF files.
- Both parties can download the signed contract at any time from their booking detail page.
- The platform retains a copy indefinitely for dispute and legal purposes.

---

## 13. Trust & Safety

### 13.1 Artist Verification

- Every artist submits a government-issued ID (passport or driving licence) at onboarding.
- A human admin reviews the ID and cross-references it with the profile details before approving.
- Approved artists receive a "Verified" badge on their profile.

### 13.2 Contact Privacy

- Personal contact details are hidden between parties until a booking is confirmed and a contract is signed.
- Casters see only the artist's first name and profile until booking.
- Artists see only the caster's company name until booking.
- After booking confirmation: both parties see each other's contact details for shoot logistics.

### 13.3 Messaging Moderation

- Admin has read access to all message threads for moderation and dispute purposes.
- Either party can report a message thread for harassment, discrimination, or Terms of Service violations.
- Flagged threads are reviewed by admin within 24 hours.

### 13.4 Strike System (Artists)

- Artists receive a strike for every last-minute cancellation (under 48 hours).
- Three strikes trigger an account review by admin.
- Admin can choose to: keep the account active with a warning, suspend temporarily, or ban.

### 13.5 Frivolous Disputes

- If a user raises 3 disputes and loses all 3, admin is automatically alerted.
- Pattern of frivolous disputes can lead to account warning or suspension.

---

## 14. Notifications

All users receive email notifications for key events. In-app notifications appear in a notification bell.

### Artist Notifications

- Application approved / rejected (email + in-app)
- New matching job posted (email daily digest — max once per day)
- Bid shortlisted (email + in-app)
- Bid rejected (email + in-app)
- Bid accepted — booking confirmed (email + in-app)
- Contract ready to sign (email + in-app)
- Contract fully signed (email + in-app)
- Booking cancelled by caster (email + in-app)
- Payment released (email + in-app)
- New message received (email + in-app)
- Review received (in-app)

### Caster Notifications

- New bid received on a job (email + in-app)
- Message received from artist (email + in-app)
- Contract signed by artist (email + in-app)
- Booking cancelled by artist (email + in-app)
- Shoot completion reminder (email — sent day of shoot)
- Payment auto-released reminder (email — 24hrs before auto-release)
- Dispute raised by artist (email + in-app)
- Review received (in-app)

### Admin Notifications

- New artist application submitted (in-app)
- New dispute opened (in-app + email)
- Flagged content reported (in-app)

---

## 15. Screen Inventory

### Public Screens (13)

Homepage, Register (choose role), Register Artist type, Register Model form, Register Actor form, Register Caster form, Email verification pending, Email verified, Login, Forgot password, Reset password, Terms of Service, Privacy Policy.

### Artist Onboarding (9)

Onboarding shell, Personal info, Stats (model), Stats & skills (actor), Experience & rates, Portfolio upload, Identity verification, Review & submit, Pending approval.

### Artist Panel (21)

Dashboard, My profile (view), Edit profile, Edit stats, Manage portfolio, Public profile view, Job feed, Job detail, Submit bid, My bids, Bid detail, Saved jobs, My bookings, Booking detail, Contract review & sign, Earnings dashboard, Payout settings, Messages inbox, Message thread, My reviews, Leave a review, Notifications, Raise dispute, Dispute detail, Account settings, Delete account.

### Caster Panel (29)

Onboarding, Billing setup, Dashboard, My jobs, Post job (6 steps), Job detail, Edit job, Talent search, Artist public profile, Shortlisted talent, Bids for a job, Bid detail, My bookings, Booking detail, Booking payment, Contract review & sign, Confirm shoot completion, Messages inbox, Message thread, Leave a review, Raise dispute, Dispute detail, Account settings, Billing & subscription, Notification settings, Delete account.

### Admin Panel (17)

Dashboard, All users, User detail, Artist applications queue, Application review, All jobs, Job detail, All bookings, Booking detail, Payments dashboard, Payment detail, Disputes queue, Dispute detail, Flagged content, Flagged item review, Analytics, Admin log.

### Shared / Utility (6)

404, 403 Forbidden, 500 Error, Maintenance mode, Account suspended, Pending approval.

**Total: 97 screens**

---

## 16. Data & Privacy

### UK Compliance

- The platform operates under UK GDPR and the Data Protection Act 2018.
- A full Privacy Policy is displayed at registration and stored as a static page.
- Users must explicitly agree to Terms of Service and Privacy Policy at sign-up.

### What Data is Collected

- **Artists:** Name, DOB, contact info, physical stats (models), skills (actors), portfolio media, ID documents, bank account details (via Stripe — CastFlow never stores raw bank details)
- **Casters:** Company name, contact details, billing info (via Stripe — CastFlow never stores card details)
- **Both:** Messages, contracts, review content, booking history, login history

### ID Documents

- Stored in a private, encrypted cloud storage bucket (Cloudflare R2)
- Never publicly accessible — only admin can access a time-limited preview link
- Not shared with casters under any circumstances

### Data Retention

- User account data: retained while account is active + 2 years after deletion
- Contracts: retained indefinitely (legal requirement)
- Messages: retained for 2 years
- Payment records: retained for 7 years (HMRC requirement)

---

## 17. Tech Stack

_This section is for technical reference. Non-technical readers can skip it._

| Component       | Technology               | Purpose                              |
| --------------- | ------------------------ | ------------------------------------ |
| Frontend        | Next.js 16               | Web application                      |
| Backend         | Bun + Hono               | API server                           |
| Authentication  | Better Auth              | Login, social auth, sessions         |
| Database        | PostgreSQL + Prisma      | Data storage                         |
| File Storage    | Cloudflare R2            | Portfolio images, ID docs, contracts |
| Payments        | Stripe + Stripe Connect  | Escrow, payouts, commissions         |
| Email           | Resend                   | Transactional emails                 |
| Real-time       | Hono WebSockets (native) | In-app messaging                     |
| PDF Generation  | @react-pdf/renderer      | Contract PDFs                        |
| Frontend Deploy | Vercel                   | Hosting                              |
| Backend Deploy  | Railway                  | Hosting                              |
| Monorepo        | Turborepo                | Shared types & validators            |

---

_End of CastFlow MVP Product Requirements Document_

_This document is the single source of truth for the MVP build. Any feature not listed here is out of scope for the initial release. Changes to scope require written approval from the product owner._
