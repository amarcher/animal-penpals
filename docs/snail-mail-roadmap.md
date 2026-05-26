# Snail Mail Roadmap

Animal Penpals should become two connected products:

- **The app** is where a child visits an animal friend, writes letters, sees the animal react, and gets immediate emotional closure.
- **The mailbox** is where the animal proves the relationship is real through parent-approved physical letters.

The product should not replace the instant digital loop. It should split the loop into an immediate "your animal received this" moment and a delayed "your animal wrote back for real" moment.

## Product Loop

1. Child writes a letter in the existing compose flow.
2. The animal receives it immediately in `sending` / `receiving` with richer animation and a short acknowledgement.
3. The app creates a private animal reply draft.
4. A parent reviews, edits, regenerates, or approves the draft.
5. Approval renders a printable letter PDF with animal stationery and a private QR code.
6. A print-and-mail API sends the physical letter.
7. The child receives the letter at home.
8. The QR code opens a read-aloud page with the same word-by-word highlighting used by the current digital reading flow.

## Delivery Modes

Start with two modes so the current app stays useful while the snail-mail system grows.

| Mode | Child experience | Parent involvement | Fulfillment |
| --- | --- | --- | --- |
| Instant reply | Animal responds in-app after receiving animation | None or optional | Current `generate-response` + TTS |
| Mailbox reply | Animal acknowledges receipt, writes privately, and mails later | Required approval | PDF + mail API + QR read-aloud |

The default MVP can expose this as a parent setting per child or per animal: `instant`, `mailbox`, or `both`.

## System States

Add a mail-specific lifecycle next to the existing `Letter` / `Thread` types.

```ts
type MailReplyStatus =
  | 'drafting'
  | 'needs_parent_review'
  | 'parent_changes_requested'
  | 'approved'
  | 'rendered'
  | 'submitted_to_mail_vendor'
  | 'printing'
  | 'in_mail_stream'
  | 'delivered'
  | 'canceled'
  | 'failed';
```

The child-facing UI should collapse those into friendly states:

- `Maple is thinking about your letter`
- `Maple is writing carefully`
- `Maple sealed the envelope`
- `Your letter is traveling`
- `Check your mailbox soon`

Never show parent-review mechanics to the child.

## Data Model

The app is localStorage-first today. Snail mail needs server persistence.

Core records:

- `children`: parent-owned child profiles, reading level, interests, sensitivities.
- `parent_goals`: active parent agenda items such as bedtime, confidence, chores, sibling kindness.
- `animal_profiles`: character canon, voice, stationery, prompt rules.
- `threads`: child-animal conversation history.
- `letters`: child and animal messages.
- `mail_replies`: generated drafts, approval status, print metadata, QR token.
- `mail_orders`: vendor order id, delivery status, timestamps, retry/cancel details.
- `read_aloud_assets`: TTS audio URL, word timestamps, display text, QR token expiry.

Initial storage choice: Neon Postgres, because `api/generate-response.ts` already imports `@neondatabase/serverless` for usage logging. Use row-level ownership by parent account once auth exists.

## API Surface

Add these routes incrementally:

- `api/create-mail-draft.ts`: Creates a parent-review draft after a child sends a letter.
- `api/parent/review-queue.ts`: Lists drafts needing approval.
- `api/parent/update-draft.ts`: Saves parent edits or guidance.
- `api/parent/regenerate-draft.ts`: Regenerates with parent instructions.
- `api/parent/approve-draft.ts`: Freezes text and starts rendering.
- `api/render-letter.ts`: Produces PDF/HTML letter art and QR code.
- `api/submit-mail-order.ts`: Sends the rendered PDF to Lob/PostGrid.
- `api/mail-webhook.ts`: Receives vendor status updates.
- `api/read-aloud/:token.ts`: Returns approved letter text + TTS timing for QR pages.

Keep `api/generate-response.ts` for instant replies. Do not overload it with mail lifecycle logic.

## Parent Review UX

First parent dashboard screen:

- Review cards grouped by child and animal.
- Draft letter preview with stationery.
- Parent guidance input: "What should this letter gently encourage?"
- Tone controls: sillier, calmer, shorter, more educational.
- Safety controls: block topics, avoid specific names, do not mention a goal directly.
- Actions: approve, edit text, regenerate, cancel.

The parent's agenda should be transformed into a gentle story beat, not a scolding sentence. Example:

- Parent says: "We are working on putting shoes away."
- Animal says: "In my burrow, I have a special leaf spot for my favorite things. It helps me find them before adventures."

## Letter Generation Prompt Shape

Mail replies should be longer and more durable than instant replies.

Inputs:

- Animal canon and voice.
- Child's latest letter.
- Safe prior thread summary.
- Child reading level.
- Parent-approved goals.
- Parent private notes.
- Seasonal or daily animal state.

Output:

- 120-220 words for early readers, configurable by age.
- Warm reply that references the child.
- One tiny story from the animal's world.
- One parent-goal teaching beat disguised as character wisdom.
- One low-pressure invitation to write back.
- Signature.
- Optional postscript with a simple challenge.

## Physical Letter Rendering

Use HTML-to-PDF rendering first, then send the PDF to the mail vendor.

Letter components:

- Address page handled by the vendor when possible.
- Animal stationery background.
- Animal portrait or small spot illustration.
- Large readable type.
- Parent-approved body text.
- QR code linking to `/read-aloud/{token}`.
- Short alt text below QR: "Hear me read this letter."

MVP can use one universal letter template before per-animal stationery.

## Mail Vendor

Evaluate Lob and PostGrid first.

Required capabilities:

- Sandbox/test mode with digital proofs.
- Address verification.
- PDF letter sending.
- Webhooks or polling for status.
- Cancel before printing.
- Per-piece pricing that supports low volume.

Implementation interface:

```ts
interface MailVendor {
  verifyAddress(address: PostalAddress): Promise<VerifiedAddress>;
  createLetter(input: CreateLetterInput): Promise<MailOrder>;
  cancelLetter(orderId: string): Promise<void>;
  getLetter(orderId: string): Promise<MailOrder>;
}
```

Hide vendor-specific code behind this interface so the product can switch vendors after pricing tests.

## QR Read-Aloud

The QR should open a private, tokenized route:

- No login required for the child at the mailbox.
- Token only reveals one approved letter.
- Parent can revoke token.
- Page uses existing `ReadingView` / `HighlightedText` patterns where possible.
- TTS can be generated on approval and cached so the QR page loads fast.

This is high-value because it makes one physical letter feel like a multimedia object.

## Content Engine

Extend the existing `pipeline/` directory from animal creation into daily character life.

New pipeline concepts:

- `daily_states`: sleepy, proud, rainy-day cozy, building something, nervous, celebrating.
- `letter_stationery`: per-animal paper, stamps, margins, signature art.
- `micro_videos`: short looping clips for "thinking", "writing", "sealing", and "waiting".
- `character_memory`: durable facts and recurring bits for each animal.

This supports the daily visit loop without requiring a physical letter every day.

## Monetization

Subscription should sell rhythm, not one-off postage.

| Tier | Includes | Why it works |
| --- | --- | --- |
| Digital Penpal | App visits, writing help, instant read-aloud replies | Low-cost entry |
| Mailbox Club | 1 physical letter/month, parent approval, QR read-aloud | Core magical product |
| Storybook Club | 2-4 letters/month, postcards, richer art | Covers fulfillment margin |
| Family Pack | Multiple children, shared parent dashboard | Better household ARPU |

Add-ons:

- Birthday letter.
- Holiday letter bundle.
- Achievement certificate.
- Extra postcard.
- Sticker sheet or seasonal stationery pack.

The first pricing test should measure willingness to pay for **one guaranteed monthly physical letter**. Do not start by promising unlimited mail.

## Compliance And Trust

This app is child-directed, so parent control has to be foundational.

Baseline requirements:

- Verifiable parental consent before collecting child personal information.
- Parent-owned account and address book.
- Child profiles editable and deletable by parent.
- No child-facing freeform sharing outside the animal letter loop.
- Parent approval before physical mail.
- Clear data retention policy for child letters and TTS/audio assets.
- Separate consent for any analytics, marketing, or third-party disclosures.

Also avoid using parent goals in a way that feels manipulative or shaming. The animal should encourage, model, and celebrate.

## MVP Build Plan

### Phase 1: Mailbox Mode Prototype

Goal: prove the delayed-reply loop without real postage.

- Add `mailboxReply` mode to the send flow.
- After `SendAnimation`, route to a new child-facing "animal is writing" / "watch the mailbox" state instead of `reading`.
- Add a local parent review queue backed by localStorage.
- Generate a draft using a new mail-letter prompt.
- Let parent approve/edit in a hidden route such as `/parent/review`.
- On approval, generate a QR read-aloud route using local data.
- Render a printable HTML letter page.

Success criterion: a parent can print a convincing letter at home and scan a QR code that reads it aloud.

### Phase 2: Server Persistence

Goal: make drafts and QR pages survive devices.

- Add database tables for child profiles, threads, mail replies, and read-aloud tokens.
- Move mail draft creation to `api/create-mail-draft.ts`.
- Add tokenized QR API.
- Generate TTS at approval time.
- Add parent auth before collecting real child/address data.

Success criterion: child writes on one device, parent approves on another, QR works from a phone.

### Phase 3: Vendor Sandbox

Goal: automate mail without sending paid production letters by accident.

- Implement `MailVendor` interface.
- Add Lob or PostGrid sandbox integration.
- Verify addresses.
- Submit PDFs in test mode.
- Store vendor proof URLs and status.
- Build cancellation/retry handling.

Success criterion: approving a draft creates a vendor test proof and status record.

### Phase 4: Paid Pilot

Goal: send real letters to a small parent cohort.

- Add Stripe subscription or manual pilot billing.
- Enable production mail for approved accounts only.
- Add parent address verification.
- Add mail status emails.
- Add fulfillment cost reporting per child/month.

Success criterion: 10 families receive letters and at least 5 scan QR read-aloud.

### Phase 5: Character Life Engine

Goal: make daily app visits valuable between physical letters.

- Add daily animal state content.
- Generate/curate writing, thinking, sealing, and waiting clips.
- Surface mail tracking as in-world moments.
- Add parent-scheduled themes and special occasions.

Success criterion: children return between physical letters because the animal feels alive.

## Immediate Next Tickets

1. Add `src/types/mail.ts` with mail reply statuses and draft types.
2. Add localStorage `useParentReviewStore`.
3. Add `/parent/review` route with draft cards.
4. Add `api/create-mail-draft.ts` using a longer snail-mail prompt.
5. Change send flow to support a hardcoded `mailbox` experiment flag.
6. Add printable letter route with QR token.
7. Reuse `ReadingView` for QR read-aloud.
8. Add tests for draft lifecycle and route behavior.

