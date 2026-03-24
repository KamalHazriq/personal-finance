"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/use-auth";

const PUBLIC_ROUTES = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/callback",
  "/auth/reset-password",
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Normalize pathname by removing basePath and trailing slash for comparison
  const normalizedPath = pathname.replace(/\/$/, "") || "/";

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => normalizedPath === route || normalizedPath.startsWith("/auth/"),
  );

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublicRoute) {
      router.replace("/auth/login/");
    }

    if (
      user &&
      (normalizedPath === "/auth/login" || normalizedPath === "/auth/signup")
    ) {
      router.replace("/dashboard/");
    }

    if (user && normalizedPath === "/") {
      router.replace("/dashboard/");
    }
  }, [user, loading, isPublicRoute, normalizedPath, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user && !isPublicRoute) return null; // Will redirect

  return <>{children}</>;
}
