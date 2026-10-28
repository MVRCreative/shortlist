"use client";

import { useState, useTransition } from "react";
import { updatePasswordAction } from "@/app/auth/actions";
import { BrandMark } from "@/components/shortlist/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UpdatePasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-12">
      <div className="flex flex-col gap-2">
        <BrandMark />
        <h1 className="text-2xl font-normal tracking-tight text-text-strong-950">
          Choose a new password
        </h1>
        <p className="text-paragraph-sm text-text-sub-600">
          Use at least 8 characters.
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            const result = await updatePasswordAction(formData);
            if (result && !result.ok) setError(result.error);
          });
        }}
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">New password</Label>
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
          Update password
        </Button>
      </form>
    </main>
  );
}
