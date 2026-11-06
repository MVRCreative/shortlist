# Attio discovery

Read-only. No Attio records were created or updated. The API key was read from `ATTIO_API_KEY` and is not copied here.

Re-run: 2026-10-27, after the subscription fields, the Incomplete expired option, and the three Shortlist company checkboxes were added. Base URL: `https://api.attio.com/v2`. Method: GET only. Object, attribute, and select-option requests returned 200.

## Comparison

The fields this job writes are present. Option titles are display labels, so the sync maps Shortlist enums onto them.

| Shortlist | Attio | Result |
| --- | --- | --- |
| `plans.id` `starter`, `pro`, `growth` | `plan` titles `Starter`, `Pro`, `Growth` | Present. Titles match `plans.name`, not the ids. |
| `subscription_status`, including `incomplete_expired` | `Incomplete expired` plus the other seven titles | Present. `past_due` is the title `Past due`. |
| `delivery_cadence` `weekly`, `monthly` | `Weekly`, `Monthly` | Present. |
| `cancel_at_period_end` | `cancel_at_period_end` checkbox, title "Cancel at period end" | Present. |
| `canceled_at` | `canceled_on` date. The title returned by the API is ` Canceled on` (leading space). | Present. Slug is `canceled_on`. |
| subscription row `created_at` | `started_on` date, title "Started on" | Present. This is not Attio's system `created_at`. |
| `member_activity.traction` | `shortlist_traction` checkbox, title "Shortlist traction" | Present. Written. |
| `member_activity.not_acting` | `shortlist_not_acting` checkbox, title "Shortlist not acting" | Present. Written. |
| `member_activity.poor_fit` | `shortlist_poor_fit` checkbox, title "Shortlist poor fit" | Present. Written. |
| delivered / contacted / replied / booked counts and `not_fit_ratio` | not on Companies | Not synced. |
| weekly streak | not on Companies | Out of this job. |

`company_mrr` and `customer_since` are still on Companies. The sync does not write them.

## Objects

| API slug | Singular | Plural | Object id |
| --- | --- | --- | --- |
| `subscriptions` | Subscription | Subscriptions | `395b2161-3c61-46d6-ac28-44506b7cfdba` |
| `companies` | Company | Companies | `7e7ca09a-7761-4bcf-ad39-cc065a5a8522` |
| `people` | Person | People | `165a7cf5-61de-4892-b0ae-e50bfaca15e2` |
| `deals` | Deal | Deals | `140c2e1e-b5fc-43b0-ad01-0837c745acc4` |

`deals` stays out of this sync. `users` and `workspaces` are not in the object list.

## Subscriptions

None archived.

| Title | API slug | Type | Unique | Writable |
| --- | --- | --- | --- | --- |
| Record ID | `record_id` | text | yes | no |
| Created at | `created_at` | timestamp | no | no |
| Created by | `created_by` | actor-reference | no | no |
| Company | `company` | record-reference | no | yes |
| Person | `person` | record-reference | no | yes |
| Plan | `plan` | select | no | yes |
| Status | `status` | select | no | yes |
| MRR | `mrr` | currency | no | yes |
| Cadence | `cadence` | select | no | yes |
| Period Start | `period_start_2` | date | no | yes |
| Period End | `period_end` | date | no | yes |
| Stripe Subscription ID | `stripe_subscription_id` | text | yes | yes |
| Cancel at period end | `cancel_at_period_end` | checkbox | no | yes |
| ` Canceled on` | `canceled_on` | date | no | yes |
| Started on | `started_on` | date | no | yes |

`company` allows object `7e7ca09a-7761-4bcf-ad39-cc065a5a8522` (`companies`). `person` allows object `165a7cf5-61de-4892-b0ae-e50bfaca15e2` (`people`). Neither is multiselect.

`mrr` default currency code is `USD`, display type `code`.

`stripe_subscription_id` is the upsert matching attribute. Period Start's slug is `period_start_2`.

Select options, none archived:

| Attribute slug | Option titles |
| --- | --- |
| `plan` | `Starter`, `Growth`, `Pro` |
| `status` | `Trialing`, `Active`, `Past due`, `Canceled`, `Incomplete`, `Unpaid`, `Paused`, `Incomplete expired` |
| `cadence` | `Weekly`, `Monthly` |

## Companies

Unique attributes:

| Title | API slug | Type | Unique | Multiselect | Writable |
| --- | --- | --- | --- | --- | --- |
| Record ID | `record_id` | text | yes | no | no |
| Domains | `domains` | domain | yes | yes | yes |

`domains` is the company match key for `businesses.website_domain`. An update does not send `domains`, so existing domains stay.

Company flags this job writes:

| Title | API slug | Type |
| --- | --- | --- |
| Shortlist traction | `shortlist_traction` | checkbox |
| Shortlist not acting | `shortlist_not_acting` | checkbox |
| Shortlist poor fit | `shortlist_poor_fit` | checkbox |

`company_mrr` (currency, default `USD`) and `customer_since` (timestamp) exist and are not written. There is no Company attribute for the four-week account counts, `not_fit_ratio`, or streak.

The other returned attributes are the standard company fields: `name`, `description`, `team`, `categories`, `primary_location`, `logo_url`, social URLs, `twitter_follower_count`, `estimated_arr_usd`, `funding_raised_usd`, `foundation_date`, `employee_range`, interaction attributes, connection strength, `associated_deals`, `created_at`, `created_by`.

## People

| Title | API slug | Type | Unique | Multiselect | Writable |
| --- | --- | --- | --- | --- | --- |
| Record ID | `record_id` | text | yes | no | no |
| Email addresses | `email_addresses` | email-address | yes | yes | yes |
| Name | `name` | personal-name | no | no | yes |
| Company | `company` | record-reference | no | no | yes |

`email_addresses` is the person match key for `profiles.email`. An update does not send `email_addresses`, so existing addresses stay.

`company` points at `companies`. Its inverse is companies `team` (title "Team", multiselect). The sync sets that link only when it is empty.
