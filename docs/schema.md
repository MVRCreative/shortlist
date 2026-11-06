# Shortlist schema

Supabase holds product data. This is the contract for the tables that already exist. One word means one thing in the database, the code, and the UI.

## Vocabulary

- **company** — a real business. Shared. Admin-only. `companies`.
- **contact** — a real person at a company. Shared. Admin-only. `contacts`.
- **account** — a company as it appears on one member's list. Nothing else. `drop_accounts`.
- **drop** — one scheduled delivery. Use this word in code. Do not add a `lists` or `digests` table. `drops`.
- **audience** — who the member sells to, versioned. `audiences`.
- **business** — the member's studio. `businesses`.
- **profile** — the person who logs in. One row per `auth.users` id. `profiles`.

A **campaign** is the member's current outreach theme for an audience: a title, an objective, and an optional link. It changes the copy and the content drafts on a drop. It is not a sequence, a sender, or a campaign builder. One active campaign per business.

**audience_seeds** are the 2–3 example customer domains sent to Ocean as lookalike seeds. At most three per audience.

**audience_references** are extra example domains the member keeps on the audience. They are not sent to Ocean as lookalike seeds.

Tables are plural snake_case nouns, named for what one row is. Child tables are `parent_child`. Event tables are `<entity>_events`. Functions are `verb_noun` and match the table they write.

## What one account row is

`drops` → `drop_accounts`, the same way `drops` → `drop_content` and `libraries` → `library_companies`.

One `drop_accounts` row is one company on one member's list in one drop. If a drop has five companies, it has five rows. Each row holds:

- which company and which contact
- the copy written for that member (`fit_reason`, `outreach_angle`, `linkedin_message`)
- the frozen card (`snapshot`)
- the checkbox (`contacted_at`)

`unique (business_id, company_id)` lets the list grow without delivering the same company twice.

Shared facts stay on `companies` and `contacts`. Members do not read those tables. Anything that depends on this member, this audience, or this campaign stays on `drop_accounts`.

## What the card reads

The account card reads `snapshot`. Delivery writes `fitReason`, `outreachAngle`, and `linkedinMessage` into the snapshot and into the three text columns. The UI reads the snapshot. The columns stay for admin queries. If a snapshot key is missing on an older row, fall back to the column.

A verified email is stored inside the snapshot only when it was verified at delivery. Omit it otherwise.

## Contacted

The checkbox is `contacted_at`, keyed by `drop_accounts.id`. Unchecked means `contacted_at` is null. Checked means the member took action.

Members cannot update `drop_accounts` directly. They call `update_drop_account`.

- `null` means don't touch that field. A viewed or fit update must not clear `contacted_at`.
- `true` sets the timestamp once and inserts a `contacted` event.
- `false` clears `contacted_at` and deletes that row's `contacted` events in the same transaction. This is the one exception to append-only events, so a mis-click does not inflate accounts contacted.

`member_activity` counts `contacted_at`. `get_my_streak` counts `drop_account_events` of type `contacted`. Both move together.

Undo is refused when `replied_at` or `booked_call_at` is set. The function raises `Cannot mark this account as not contacted after a reply or a booked call` and leaves the row unchanged.

Still-open accounts are counted with a partial index: `drop_accounts (business_id) where contacted_at is null`.

## Where a drop comes from

Ocean companies are shared. Deepline contacts are looked up at delivery and stored on `contacts` with `source = deepline`. New writes use that value. Older rows may say `manual` and are not backfilled.

`data_source` is `ocean`, `predictleads`, `csv`, `manual`, `deepline`.

Customer-facing Deepline data needs the same written permission the product vision requires before Clay data is shown. This doc does not record that the terms were reviewed.

## As the list grows

Read every delivered drop for the business, grouped by `drop_id`, newest first. Inside an older drop, collapse contacted accounts. Page by drop once the history is long. Neither needs another table.

## Names that stay

`profiles`, `businesses`, `business_exclusions`, `plans`, `subscriptions`, `drops`, `drop_accounts`, `drop_content`, `companies`, `contacts`, `company_signals`, `libraries`, `library_companies`, `library_imports`, `library_requests`, `suppressions`, `provider_calls`, `app_config`, `industries`, `audiences`, `audience_seeds`, `audience_references`, `audience_lookalikes`, `audience_reviews`, `campaigns`, `campaign_assets`, `drop_account_events`.
