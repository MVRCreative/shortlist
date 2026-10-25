"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabel, type AdminUserSummary } from "@/lib/shortlist/admin-display";

export function AdminDirectory({ users }: { users: AdminUserSummary[] }) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalized) return users;
    return users.filter((user) => {
      const haystack = [user.fullName, user.email, user.businessName, user.websiteDomain]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [normalized, users]);

  return (
    <section aria-labelledby="users-heading" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 id="users-heading" className="text-title-h5 tracking-tight">
          Users
        </h1>
        <p className="text-paragraph-sm text-text-sub-600">
          Search accounts, then open one to see their details and digests.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="user-search">Search</Label>
        <Input
          id="user-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, email, or business"
          autoComplete="off"
        />
      </div>

      {normalized ? (
        <p className="sr-only" aria-live="polite">
          {filtered.length === 1 ? "1 user" : `${filtered.length} users`}
        </p>
      ) : null}

      {users.length === 0 ? (
        <p className="text-paragraph-sm text-text-sub-600">No users yet.</p>
      ) : filtered.length === 0 ? (
        <p className="text-paragraph-sm text-text-sub-600">No users match that search.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((user) => (
            <li key={user.id}>
              <UserRow user={user} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function UserRow({ user }: { user: AdminUserSummary }) {
  const name = user.fullName?.trim() || user.email;
  const business = [user.businessName, user.websiteDomain].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/admin/users/${user.id}`}
      className="flex items-start justify-between gap-3 rounded-20 border border-stroke-soft-200 bg-bg-white-0 px-4 py-3.5 shadow-[var(--elevation-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-base fine-hover:bg-bg-weak-50/40 sm:px-5"
    >
      <span className="min-w-0">
        <span className="block truncate text-label-md">{name}</span>
        {user.fullName ? (
          <span className="block text-paragraph-xs text-text-sub-600 [overflow-wrap:anywhere]">
            {user.email}
          </span>
        ) : null}
        <span className="block truncate text-paragraph-xs text-text-sub-600">
          {business || "No business yet"}
          <span aria-hidden="true"> · </span>
          {digestCountLabel(user.digestCount)}
        </span>
      </span>
      <Badge variant={user.role === "admin" ? "brand" : "neutral"}>{roleLabel(user.role)}</Badge>
    </Link>
  );
}

function digestCountLabel(count: number): string {
  if (count === 0) return "No digests";
  if (count === 1) return "1 digest";
  return `${count} digests`;
}
