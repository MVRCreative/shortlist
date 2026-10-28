"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { requestPasswordResetAction } from "@/app/auth/actions";
import { BrandMark } from "@/components/shortlist/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("error") === "expired";
  const [error, setError] = useState<string | null>(
    expired ? "That reset link has expired. Request a new one." : null,
  );
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="flex flex-col gap-2">
        <BrandMark />
        <h1 className="text-2xl font-normal tracking-tight text-text-strong-950">
          Reset your password
        </h1>
        <p className="text-paragraph-sm text-text-sub-600">
          {sent
            ? "If an account exists for that email, a reset link is on its way."
            : "We’ll email you a link to choose a new password."}
        </p>
      </div>

      {sent ? null : (
        <form
          className="flex flex-col gap-4"
          action={(formData) => {
            setError(null);
            startTransition(async () => {
              const result = await requestPasswordResetAction(formData);
              if (result.ok) {
                setSent(true);
                return;
              }
              setError(result.error);
            });
          }}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          {error ? (
            <p className="text-paragraph-sm text-error-base" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" size="lg" pending={pending}>
            Send reset link
          </Button>
        </form>
      )}

      <p className="text-paragraph-sm text-text-sub-600">
        <Link
          href="/login"
          className="text-text-strong-950 underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-12">
      <Suspense fallback={<div className="min-h-40" aria-busy="true" />}>
        <ForgotPasswordForm />
      </Suspense>
    </main>
  );
}
