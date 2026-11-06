import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AdminFrame } from "@/components/shortlist/admin-frame";
import { AdminUser } from "@/components/shortlist/admin-user";
import { ErrorState } from "@/components/ui/error-state";
import { getAdminSession, loadAdminUser } from "@/lib/shortlist/admin";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const session = await getAdminSession();
  if (session.status !== "admin") return { title: "Admin — Shortlist" };

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return { title: "User — Admin" };

  const result = await loadAdminUser(id);
  const name =
    result.ok && result.user ? result.user.fullName?.trim() || result.user.email : "User";
  return { title: `${name} — Admin` };
}

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getAdminSession();
  if (session.status !== "admin") redirect("/admin");

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return (
      <AdminFrame signedIn>
        <MissingUser />
      </AdminFrame>
    );
  }

  const result = await loadAdminUser(id);
  if (!result.ok) {
    return (
      <AdminFrame signedIn>
        <ErrorState
          layout="region"
          title="Couldn’t load this user"
          description="Refresh the page and try again."
          reloadOnRetry
        />
      </AdminFrame>
    );
  }

  if (!result.user) {
    return (
      <AdminFrame signedIn>
        <MissingUser />
      </AdminFrame>
    );
  }

  return (
    <AdminFrame signedIn>
      <AdminUser user={result.user} />
    </AdminFrame>
  );
}

function MissingUser() {
  return (
    <section className="flex max-w-md flex-col gap-3">
      <h1 className="page-title">User not found</h1>
      <p className="text-paragraph-sm text-text-sub-600">
        This user isn’t in Shortlist.
      </p>
      <Link href="/admin" className="w-fit text-paragraph-xs text-text-sub-600 fine-hover:hover:text-text-strong-950">
        Back to users
      </Link>
    </section>
  );
}
