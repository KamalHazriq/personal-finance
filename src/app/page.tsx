import Link from "next/link";
import { Wallet } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-3">
          <Wallet className="size-10 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Wealth Tracker
          </h1>
        </div>

        <p className="text-lg leading-relaxed text-muted-foreground">
          A secure, private personal finance and net worth tracker. Take control
          of your financial future with clear insights into your accounts,
          spending, and goals.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth/login"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
