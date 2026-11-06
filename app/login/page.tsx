"use client";

import { Suspense, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  sendLoginCodeAction,
  verifyLoginCodeAction,
} from "@/app/auth/actions";
import { BrandMark } from "@/components/shortlist/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/digest";
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <div className="flex flex-col gap-2">
        <BrandMark />
        <h1 className="text-2xl font-normal tracking-tight text-text-strong-950">
          Sign in
        </h1>
        <p className="text-paragraph-sm text-text-sub-600">
          {step === "code"
            ? `Enter the 6-digit code we sent to ${email}.`
            : "We’ll email you a code. New here? This creates your account."}
        </p>
      </div>

      {step === "email" ? (
        <form
          className="flex flex-col gap-4"
          action={(formData) => {
            setError(null);
            setNotice(null);
            startTransition(async () => {
              const result = await sendLoginCodeAction(formData);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setEmail(
                String(formData.get("email") ?? "")
                  .trim()
                  .toLowerCase(),
              );
              setStep("code");
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
              defaultValue={email}
            />
          </div>
          {error ? (
            <p className="text-paragraph-sm text-error-base" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" pending={pending}>
            Email me a code
          </Button>
        </form>
      ) : (
        <form
          className="flex flex-col gap-4"
          action={(formData) => {
            setError(null);
            setNotice(null);
            startTransition(async () => {
              const result = await verifyLoginCodeAction(formData);
              if (result && !result.ok) setError(result.error);
            });
          }}
        >
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="token">Code</Label>
            <Input
              id="token"
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoFocus
              className="text-center text-base tracking-widest"
            />
          </div>
          {error ? (
            <p className="text-paragraph-sm text-error-base" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="text-paragraph-sm text-text-sub-600" role="status">
              {notice}
            </p>
          ) : null}
          <Button type="submit" pending={pending}>
            Sign in
          </Button>
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              className="text-paragraph-sm text-text-sub-600 underline-offset-4 hover:underline"
              onClick={() => {
                setStep("email");
                setError(null);
                setNotice(null);
              }}
            >
              Use a different email
            </button>
            <button
              type="button"
              className="text-paragraph-sm text-text-sub-600 underline-offset-4 hover:underline"
              disabled={pending}
              onClick={() => {
                setError(null);
                setNotice(null);
                const formData = new FormData();
                formData.set("email", email);
                startTransition(async () => {
                  const result = await sendLoginCodeAction(formData);
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  setNotice("Sent a new code.");
                });
              }}
            >
              Resend code
            </button>
          </div>
        </form>
      )}
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
