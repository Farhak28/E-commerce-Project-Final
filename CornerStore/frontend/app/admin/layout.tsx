"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginHub = pathname === "/admin";

  useEffect(() => {
    if (!isLoading && !isAdmin && !isLoginHub) {
      router.replace("/admin");
    }
  }, [isAdmin, isLoading, isLoginHub, router]);

  if (isLoginHub) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-text-muted">Admin sign-in required.</p>
        <Link href="/admin" className="mt-3 inline-block font-semibold text-primary">
          Go to admin login
        </Link>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
