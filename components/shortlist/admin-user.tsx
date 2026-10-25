import { format } from "date-fns";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  digestStatusLabel,
  roleLabel,
  type AdminDigest,
  type AdminUserDetail,
} from "@/lib/shortlist/admin-display";

const statusVariant = {
  scheduled: "neutral",
  building: "info",
  delivered: "success",
  failed: "danger",
  skipped: "warning",
} as const;

export function AdminUser({ user }: { user: AdminUserDetail }) {
  const name = user.fullName?.trim() || user.email;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <Link
          href="/admin"
          className="w-fit text-paragraph-xs text-text-sub-600 fine-hover:text-text-strong-950"
        >
          Back to users
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-title-h5 tracking-tight">{name}</h1>
          <Badge variant={user.role === "admin" ? "brand" : "neutral"}>
            {roleLabel(user.role)}
          </Badge>
        </div>
      </div>

      <section aria-labelledby="account-heading" className="flex flex-col gap-4">
        <h2 id="account-heading" className="text-label-md">
          Account
        </h2>
        <dl className="grid gap-x-8 gap-y-4 rounded-20 border border-stroke-soft-200 bg-bg-white-0 px-4 py-4 shadow-[var(--elevation-card)] sm:grid-cols-2 sm:px-5">
          <Detail label="Email" value={user.email} />
          <Detail label="Joined" value={format(new Date(user.createdAt), "MMM d, yyyy")} />
          {user.businessName ? <Detail label="Business" value={user.businessName} /> : null}
          {user.websiteDomain ? (
            <div className="min-w-0">
              <dt className="text-paragraph-xs text-text-sub-600">Website</dt>
              <dd className="truncate text-paragraph-sm">
                <a
                  href={`https://${user.websiteDomain}`}
                  className="fine-hover:underline"
                  rel="noreferrer"
                >
                  {user.websiteDomain}
                </a>
              </dd>
            </div>
          ) : null}
          {user.account?.planName ? (
            <Detail
              label="Plan"
              value={
                user.account.subscriptionStatus
                  ? `${user.account.planName} · ${user.account.subscriptionStatus}`
                  : user.account.planName
              }
            />
          ) : null}
          {user.account?.dealSize ? <Detail label="Deal size" value={user.account.dealSize} /> : null}
          {user.account ? (
            <Detail
              label="Onboarding"
              value={
                user.account.onboardingCompletedAt
                  ? format(new Date(user.account.onboardingCompletedAt), "MMM d, yyyy")
                  : "Not finished"
              }
            />
          ) : null}
          {user.account?.services.length ? (
            <Detail label="Services" value={user.account.services.join(", ")} wide />
          ) : null}
          {user.account?.description ? (
            <Detail label="Description" value={user.account.description} wide />
          ) : null}
          {user.account?.industries.length ? (
            <Detail label="Industries" value={user.account.industries.join(", ")} wide />
          ) : null}
          {user.account?.companySizes.length ? (
            <Detail label="Company size" value={user.account.companySizes.join(", ")} />
          ) : null}
          {user.account?.regions.length ? (
            <Detail label="Regions" value={user.account.regions.join(", ")} />
          ) : null}
          {user.account?.buyerTitles.length ? (
            <Detail label="Buyers" value={user.account.buyerTitles.join(", ")} wide />
          ) : null}
          {user.account?.signals.length ? (
            <Detail label="Signals" value={user.account.signals.join(", ")} wide />
          ) : null}
        </dl>
        {user.account ? null : (
          <p className="text-paragraph-xs text-text-sub-600">No business on this account yet.</p>
        )}
      </section>

      <section aria-labelledby="digests-heading" className="flex flex-col gap-4">
        <h2 id="digests-heading" className="text-label-md">
          Digests
        </h2>
        {user.digests.length === 0 ? (
          <p className="text-paragraph-sm text-text-sub-600">No digests yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {user.digests.map((digest) => (
              <li
                key={digest.id}
                className="rounded-20 border border-stroke-soft-200 bg-bg-white-0 px-4 py-4 shadow-[var(--elevation-card)] sm:px-5"
              >
                <DigestBlock digest={digest} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "min-w-0 sm:col-span-2" : "min-w-0"}>
      <dt className="text-paragraph-xs text-text-sub-600">{label}</dt>
      <dd className="text-paragraph-sm text-pretty [overflow-wrap:anywhere]">{value}</dd>
    </div>
  );
}

function DigestBlock({ digest }: { digest: AdminDigest }) {
  const when = format(new Date(digest.scheduledFor), "MMM d, yyyy");

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-label-sm">
          {when}
          <span className="font-normal text-text-sub-600">
            {" "}
            · {digest.deliveredCount} of {digest.targetCount}
          </span>
        </p>
        <Badge variant={statusVariant[digest.status]}>{digestStatusLabel(digest.status)}</Badge>
      </div>
      {digest.shortfallNote ? (
        <p className="text-paragraph-xs text-text-sub-600">{digest.shortfallNote}</p>
      ) : null}
      {digest.accounts.length > 0 ? (
        <ol className="flex flex-col gap-2.5">
          {digest.accounts.map((account) => (
            <li key={account.id} className="flex gap-3">
              <span className="mt-0.5 shrink-0 font-mono text-paragraph-xs tabular-nums text-text-sub-600">
                {String(account.position).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="truncate text-paragraph-sm font-medium">{account.company}</p>
                {account.contact ? (
                  <p className="truncate text-paragraph-xs text-text-sub-600">{account.contact}</p>
                ) : null}
                <p className="line-clamp-2 text-paragraph-xs text-text-sub-600">{account.fitReason}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
