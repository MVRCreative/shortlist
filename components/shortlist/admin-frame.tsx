import { BrandMark } from "@/components/shortlist/brand-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/app/admin/actions";

export function AdminFrame({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-10 px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-16 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <BrandMark />
        <div className="flex items-center gap-3">
          {signedIn ? (
            <form action={signOut}>
              <button
                type="submit"
                className="text-paragraph-xs text-text-sub-600 fine-hover:text-text-strong-950"
              >
                Sign out
              </button>
            </form>
          ) : null}
          <ThemeToggle />
        </div>
      </header>
      {children}
    </div>
  );
}
