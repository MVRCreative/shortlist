# Shortlist by Revlo — Product Vision & Principles

## 1. Product Overview

**Shortlist by Revlo** is a lightweight, self-serve prospecting application that helps small businesses establish a consistent outbound sales habit.

Shortlist identifies a manageable number of highly relevant companies on a regular schedule, explains why they're worth contacting, and gives users enough information to take action.

It is designed primarily for creative studios, agencies, and service businesses that rely heavily on referrals and struggle to build a predictable sales pipeline.

**Our mission:** Make outbound prospecting simple, approachable, and consistent for businesses that aren't doing it today.

**Our philosophy:** Less software. More action.

---

## 2. The Problem We're Solving

Many small businesses lack a consistent outbound sales process.

They often:

- Depend almost entirely on referrals.
- Don't know which companies to approach.
- Struggle to identify timely reasons to reach out.
- Don't know what to say when contacting potential buyers.
- Find traditional prospecting platforms overwhelming.
- Lack the time or resources to build a dedicated sales operation.

These businesses don't necessarily need more tools, contacts, automation, or data.

They need a simple starting point and a repeatable habit.

Shortlist removes the research and decision-making barriers that prevent them from doing outbound.

---

## 3. The Core Product Experience

Shortlist follows a deliberately simple process.

### Step 1: Tell us who you want to work with

Users complete a short onboarding profile describing:

- Their website.
- What their business sells: services and strongest work (case study links).
- Their ideal industries, company sizes, and geographic markets.
- The types of decision-makers they want to reach.
- Examples of existing or aspirational customers, supplied as website URLs (2–3).
- Relevant buying signals they care about.
- Optional: typical project or deal size.
- Optional: accounts to skip (current clients, competitors), supplied as domains.

This information establishes their Ideal Customer Profile (ICP).

**Website prefill is a core requirement, not an enhancement.** When a user enters their website, Shortlist analyzes it and prefills their company name, services, case studies, and likely industries. Users confirm and edit rather than type. Onboarding should take about three minutes.

Customer example URLs are the most important input. They drive lookalike matching.

Users should not need to understand prospecting databases, enrichment providers, API configurations, or complex targeting rules.

### Step 2: Receive a curated Shortlist

**The first drop lands immediately after activation.** Users must see who to contact next before they leave onboarding. A multi-day empty state is a churn risk — never ship one as the default.

Shortlist matches each user's ICP against curated account libraries (see Section 4), using company intelligence, lookalike matching, and buying signals.

Potential signals include:

- Recent funding.
- Hiring activity.
- Leadership changes.
- Product launches.
- Company growth or expansion.
- Other relevant business developments.

Each account includes a consistent, predefined set of useful information:

- Company name and website.
- Industry, size, and location.
- Why the company matches the user's ICP.
- Relevant buying signal and supporting source, when available.
- Recommended decision-maker: name, title, and LinkedIn profile.
- Work email, **only if verified at the time of delivery**. If an email cannot be verified, omit it rather than show an unverified one.
- Suggested outreach angle.
- A personalized LinkedIn message draft.

The user cannot build custom enrichment workflows or arbitrarily add data fields.

**Every customer receives the same simple product structure. Their ICP determines which companies they receive.**

#### When there aren't enough good matches

Never fabricate signals, contacts, reasons for relevance, or personalization to fill a quota.

If a drop cannot be filled with accounts that meet the quality bar:

- Deliver fewer accounts.
- Say so plainly in the drop (e.g. "We found 3 strong matches this week, not 5.").
- Carry the shortfall forward to the next drop.
- Flag the gap internally so the relevant library can be expanded.

### Step 3: Take action

When new accounts are ready, Shortlist sends an email notification.

The recommendations are viewed inside the application, not delivered as an email spreadsheet.

Users can:

- Review their recommended accounts.
- Mark accounts as a good fit or not a fit (with an optional one-tap reason: too small, too big, wrong industry, wrong region, already a client).
- Mark accounts as contacted.
- Record replies and booked calls.
- Track weekly outreach progress and streaks.

Shortlist does not send messages or emails on the user's behalf.

The user performs the actual outreach using their preferred tools.

### Step 4: Improve future recommendations

User feedback helps Shortlist improve future recommendations.

Good-fit ratings, rejection reasons, and reported outcomes inform subsequent account selection. Outcomes (replied, booked a call) should carry more weight than ratings.

Feedback can also improve shared libraries: accounts that many users reject in a sector can be deprioritized or removed.

This should be implemented as straightforward, understandable matching and scoring logic.

We are not building a complex machine-learning platform.

### Step 5: Repeat consistently

After the immediate first drop, Shortlist delivers a small, manageable set of new accounts on a recurring schedule according to the user's subscription:

- Starter: monthly.
- Pro and Growth: weekly.

The goal is to establish consistent outbound behavior over time.

**Shortlist should encourage action, not accumulation.**

---

## 4. Account Sourcing & Inventory

Shortlist does not run fresh discovery for each user on each drop. That would be slow, expensive, and inconsistent.

### Shared sector libraries

- Accounts live in curated, sector-based libraries (e.g. B2B SaaS, fintech, healthcare) stored in Supabase.
- Each user's drop is selected from the libraries that match their ICP, ranked by fit to their profile, similarity to their example customers, current signals, and their feedback.
- Company-level data is built into the library in batches. Contact lookup and email verification happen **only when an account is delivered** (just-in-time), so contact data is fresh and costs track actual usage.

### Sector requests

- When a user's ICP requires a sector with no library, or too little inventory, Shortlist records a sector request and alerts the Revlo team.
- Still deliver a first drop immediately: use the best available matches (even if fewer than the plan target), say so plainly, and carry the shortfall forward. Do not make the user wait days with an empty product.
- If inventory is so thin that zero quality accounts can ship, say that once — then expand the library on a 2–3 day ops SLA. That path is an exception, not the default signup experience.
- New sectors start small (roughly 100–200 accounts) and grow with demand. Do not build large libraries speculatively.

### Account caps

- A single account should be delivered to no more than **3 users per quarter**.
- This protects recommendation quality and prevents many users from contacting the same companies.
- Caps should be configurable, not hard-coded.

### Inventory monitoring

- Track remaining deliverable inventory per library, meaning accounts not yet at their cap and not excluded.
- When a library falls below roughly 4 weeks of supply for its current users, alert the Revlo team to top it up.
- Libraries are refreshed periodically (e.g. quarterly) to remove stale or closed companies.

### Exclusions

Never deliver an account that is on the user's "accounts to skip" list, matches the user's own domain, or was previously delivered to the same user.

---

## 5. Content Generation

Each Shortlist drop may also include lightweight content suggestions designed to help users reach their target audience:

- One LinkedIn post draft.
- One X post draft.
- One blog topic or outline.

Content should be relevant to the user's business, ICP, and available market insights.

This is a supporting feature, not a separate content marketing platform.

Do not expand it into a content calendar, publishing scheduler, social media management system, or full AI writing suite.

Do not claim content is written "in the user's voice" unless the product has actually collected samples of that voice.

---

## 6. Subscription Model

The planned pricing structure is:

| Plan | Price | Accounts | Cadence |
|---|---|---|---|
| Starter | $79/month | 10 per month | Monthly |
| Pro | $99/month | 5 per week | Weekly |
| Growth | $179/month | 10 per week | Weekly |

Content suggestions are included in all plans.

Plans primarily change recommendation volume and cadence, not access to increasingly complicated functionality.

Show one price per plan. Do not present per-account or per-content line-item pricing.

These are proposed commercial terms and should remain configurable rather than being hard-coded throughout the application.

---

## 7. Product Principles

### Simplicity over capability

Shortlist should do a few things exceptionally well.

Do not add features solely because competing products offer them.

A feature should exist only when it directly improves account relevance, outreach readiness, consistent activity, or the user's understanding of progress.

### Opinionated by design

Users should not need to configure how Shortlist works.

We make the technical decisions behind the scenes.

Avoid exposing technical controls, enrichment settings, scoring weights, AI prompts, database selections, or workflow configuration to customers.

### Action over information

Shortlist is not a database for collecting thousands of companies.

Every recommendation should help users answer:

1. Who should I contact?
2. Why are they a good fit?
3. Why might now be a good time?
4. Who should I approach?
5. What could I say?

If information doesn't help answer those questions, it probably doesn't belong in the primary experience.

### Quality over quantity

Ten excellent recommendations are more valuable than 100 generic companies.

Do not fabricate signals, contacts, reasons for relevance, or personalization to fill a quota.

Clearly distinguish recent, verified buying signals from general ICP matches.

### Encouragement without unnecessary gamification

Shortlist should motivate customers to prospect consistently.

Weekly streaks, simple progress indicators, and reminders can reinforce that habit.

Avoid elaborate achievements, points systems, leaderboards, or other gamification unrelated to meaningful outreach.

### Minimal user effort

Users should spend their time reaching out to companies, not managing Shortlist.

Favor clear defaults, simple actions, sensible automation, and minimal administration.

### Consistent language

Use "accounts" for recommended companies throughout the product. Do not mix "accounts" and "leads".

---

## 8. What Shortlist Is NOT

Shortlist is not:

- A CRM.
- A sales engagement platform.
- An email marketing tool.
- A LinkedIn automation tool.
- A mass outbound platform.
- A replacement for Clay, Apollo, or ZoomInfo.
- A customizable enrichment workflow builder.
- A general-purpose AI agent platform.
- A comprehensive analytics suite.
- A project management application.
- A social media scheduling platform.
- An automated sales representative.
- A searchable contact database or data export tool.

**Do not introduce features from these categories unless explicitly requested and supported by a clear product decision.**

In particular, avoid:

- Email sending and sequencing.
- LinkedIn message automation.
- Campaign builders.
- Custom data field builders.
- Drag-and-drop workflow builders.
- Complex task management.
- Pipeline stage management.
- Team performance dashboards.
- Excessive filtering and sorting.
- Unnecessary configuration screens.
- Bulk export of accounts or contacts (CSV downloads, etc.).

These may be valuable capabilities in other products, but they are outside Shortlist's intended scope.

---

## 9. Technical Philosophy

Shortlist should be technically reliable without becoming architecturally excessive.

### Application infrastructure

- Next.js app; Supabase provides persistent storage, authentication, and backend functionality.
- Scheduled background jobs prepare and deliver each user's drops from the shared sector libraries, including just-in-time contact lookup and verification.
- External data APIs provide company discovery, lookalike matching, contacts, and buying signals, primarily when building and refreshing libraries.
- AI assists with website analysis during onboarding, qualification, account summaries, outreach suggestions, and content drafts. Batch AI work per drop rather than per account where practical.
- Resend (or similar) sends drop notification emails.
- Stripe manages subscriptions, using the Stripe customer portal for plan changes and cancellation.
- Attio receives relevant information about Shortlist's customers for Revlo's CRM and sales operations.
- A small internal admin area lets the Revlo team import accounts into libraries (e.g. CSV upload with column mapping), see sector requests, and monitor library inventory.

### Data sourcing

Our preferred approach is to use one or two commercial data providers where possible.

Ocean.io is being evaluated for company discovery, lookalikes, contacts, and signals. PredictLeads is being evaluated as a possible supplementary signal provider. People Data Labs, Crustdata, and Explorium are alternatives.

These integrations are not finalized.

Provider selection must account for data accuracy, freshness, costs, API availability, and **contractual permissions for customer-facing use**. Only use data in Shortlist that we are licensed to deliver to paying customers.

Clay's terms restrict reselling data obtained from Clay. Do not use Clay as a source of customer-facing Shortlist data unless Revlo has written approval from Clay. Clay may be used for Revlo's internal and agency work.

Avoid unnecessary API calls. Cache and reuse appropriately licensed data, deduplicate company records, and enrich promising accounts progressively.

### Privacy & compliance

Shortlist handles personal contact data.

- Respect each data provider's license terms.
- Honor removal requests: support suppressing a person or company from all libraries and future drops.
- Treat contacts in the EU and UK with GDPR in mind; keep only the contact data needed for the product.
- Do not expose contact data beyond the user it was delivered to.

### Stable output structure

The fields displayed for recommended accounts should be standardized.

Customer ICPs vary, but the underlying output structure should remain consistent.

Do not build an open-ended data schema or customer-configurable enrichment framework.

### Separate product data from CRM data

Supabase stores Shortlist's operational data, account libraries, recommendations, user activity, and product history.

Attio stores relevant customer intelligence for Revlo, including onboarding information, customer attributes, subscriptions, engagement metrics, and indicators of potential expansion opportunities.

Do not synchronize Shortlist customers' prospecting databases into Revlo's Attio account.

### Keep the architecture proportional

Favor simple, maintainable solutions.

Avoid additional services, abstractions, dependencies, microservices, or background workers unless they solve a demonstrated need.

Reliability and data isolation are essential. Complexity is not a feature.

---

## 10. Relationship to Revlo

Shortlist is a standalone subscription product powered by Revlo.

Revlo provides higher-touch services such as:

- Sales strategy.
- Pipeline development.
- Custom outbound initiatives.
- Sales process improvement.
- Fractional sales leadership and execution.

Shortlist serves as an accessible entry point for businesses that need help beginning outbound prospecting.

Some customers will be perfectly served by Shortlist alone.

Others may eventually need more hands-on help.

Relevant customer information and engagement indicators can help Revlo identify appropriate opportunities to offer additional services. Useful indicators include:

- **Traction:** the user is booking calls and may want more volume or help.
- **Not acting:** accounts are delivered but rarely marked contacted.
- **Poor fit:** a high share of "not a fit" ratings, suggesting targeting or positioning needs work.

However, **Shortlist should remain genuinely useful as a standalone product.** It should not be intentionally limited or frustrating simply to force customers toward Revlo.

---

## 11. Product Success

Shortlist succeeds when customers consistently take meaningful outbound action.

**Primary metric: accounts contacted per active user per week.** It measures the habit the product exists to build.

Supporting indicators:

- Percentage of recommended accounts rated as good fits.
- Percentage of delivered accounts contacted.
- Weekly active customers.
- Outreach consistency and streaks.
- Reported replies and booked calls.
- Subscription retention.
- Cost per useful recommendation.

The most important outcome is not how many accounts Shortlist delivers.

**It's whether customers are making more meaningful outbound attempts because Shortlist exists.**

---

## 12. Instructions for AI Development Agents

When working on Shortlist, always preserve the product's deliberately small scope.

Before implementing a feature or suggesting an enhancement, consider:

1. Does this directly support identifying, understanding, contacting, or tracking relevant prospect accounts?
2. Does this make the user's experience simpler or more effective?
3. Can the problem be solved using functionality we already have?
4. Does this introduce a workflow or configuration the user shouldn't need to manage?
5. Are we adding complexity because it is necessary, or merely because it is possible?

When the requirements are ambiguous, favor the smaller implementation.

Do not independently expand product scope based on conventions from larger sales platforms.

Do not create additional features, settings, dashboards, or data models unless they are required by the task.

Preserve established UI patterns and the existing design system (see `docs/design-principles.md`).

Do not redesign functional parts of the product without a specific reason.

Do not add per-user discovery calls to external data APIs on each drop; use the shared libraries and just-in-time contact enrichment described in Section 4.

When a requested feature conflicts with these principles, briefly identify the tradeoff instead of silently expanding the application.

**The north star: Shortlist should be the simplest possible way for a business owner to know who to contact next, why they're worth contacting, and what to say.**

We are building a small product that delivers meaningful value, not a miniature version of every sales platform on the market.
