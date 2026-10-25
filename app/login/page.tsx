"use client";

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInAction } from "@/app/auth/actions";
import { BrandMark } from "@/components/shortlist/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/digest";
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="flex flex-col gap-2">
        <BrandMark />
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-paragraph-sm text-text-sub-600">
          Access your Shortlist digest and account history.
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await signInAction(formData);
            if (result && !result.ok) setError(result.error);
          });
        }}
      >
        <input type="hidden" name="next" value={next} />
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
            autoComplete="current-password"
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
          Sign in
        </Button>
      </form>

      <p className="text-paragraph-sm text-text-sub-600">
        No account yet?{" "}
        <Link
          href="/signup"
          className="text-text-strong-950 underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-12">
      <Suspense fallback={<div className="min-h-40" aria-busy="true" />}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
