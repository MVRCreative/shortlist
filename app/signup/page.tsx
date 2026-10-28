"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";
import { BrandMark } from "@/components/shortlist/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-col gap-2">
        <BrandMark />
        <h1 className="text-2xl font-normal tracking-tight text-text-strong-950">
          Create your account
        </h1>
        <p className="text-paragraph-sm text-text-sub-600">
          {pendingConfirmation
            ? "Check your email and open the confirmation link to finish creating your account."
            : "Sign up to receive a curated Shortlist of accounts to contact."}
        </p>
      </div>

      {pendingConfirmation ? null : (
      <form
        className="flex flex-col gap-4"
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await signUpAction(formData);
            if (!result) return;
            if (!result.ok) {
              setError(result.error);
              return;
            }
            if (result.pending === "confirm_email") setPendingConfirmation(true);
          });
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="fullName">Name</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
          />
        </div>
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
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>
        {error ? (
          <p className="text-paragraph-sm text-error-base" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" pending={pending}>
          Create account
        </Button>
      </form>
      )}

      <p className="text-paragraph-sm text-text-sub-600">
        Already have an account?{" "}
        <Link href="/login" className="text-text-strong-950 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
