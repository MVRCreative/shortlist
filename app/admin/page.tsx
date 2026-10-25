import type { Metadata } from "next";

import { AdminDirectory } from "@/components/shortlist/admin-directory";
import { AdminFrame } from "@/components/shortlist/admin-frame";
import { AdminSignIn } from "@/components/shortlist/admin-sign-in";
import { ErrorState } from "@/components/ui/error-state";
import { getAdminSession, loadAdminUsers } from "@/lib/shortlist/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Shortlist",
};

const signInErrors: Record<string, string> = {
  invalid: "Enter a valid email and password.",
  credentials: "Those credentials didn’t match an account.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const session = await getAdminSession();

  if (session.status === "signed_out") {
    const params = await searchParams;
    const code = Array.isArray(params.error) ? params.error[0] : params.error;
    const error = code ? signInErrors[code] : undefined;
    return (
      <AdminFrame signedIn={false}>
        <AdminSignIn error={error} />
      </AdminFrame>
    );
  }

  if (session.status === "forbidden") {
    return (
      <AdminFrame signedIn>
        <section className="flex max-w-md flex-col gap-2">
          <h1 className="text-title-h5 tracking-tight">Standard account</h1>
          <p className="text-paragraph-sm text-text-sub-600 [overflow-wrap:anywhere]">
            {session.email} is a standard user. Admin access is granted separately.
          </p>
        </section>
      </AdminFrame>
    );
  }

  const directory = await loadAdminUsers();
  return (
    <AdminFrame signedIn>
      {directory.ok ? (
        <AdminDirectory users={directory.users} />
      ) : (
        <ErrorState
          layout="region"
          title="Couldn’t load users"
          description="Refresh the page and try again."
          reloadOnRetry
        />
      )}
    </AdminFrame>
  );
}
