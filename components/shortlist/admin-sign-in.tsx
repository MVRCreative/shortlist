"use client";

import { useFormStatus } from "react-dom";

import { signIn } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SignInButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" pending={pending} className="w-full">
      Sign in
    </Button>
  );
}

export function AdminSignIn({ error }: { error?: string }) {
  const errorId = "admin-sign-in-error";

  return (
    <section aria-labelledby="admin-sign-in-heading" className="flex max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 id="admin-sign-in-heading" className="page-title">
          Admin
        </h1>
        <p className="text-paragraph-sm text-text-sub-600">
          Sign in with an admin account to see users and their digests.
        </p>
      </div>
      <form
        action={signIn}
        className="surface-group flex flex-col gap-4 p-4 sm:p-5"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-paragraph-sm text-error-base">
            {error}
          </p>
        ) : null}
        <SignInButton />
      </form>
    </section>
  );
}
