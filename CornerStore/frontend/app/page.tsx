import Link from "next/link";
import { HomeShowcase } from "@/components/home-showcase";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="space-y-10">
      <HomeShowcase />

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="sheen-hover animate-rise rounded-3xl border border-border bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Smart search</p>
          <p className="mt-2 text-sm text-text-muted">Try visual search to discover products from photos.</p>
          <Link href="/visual-search" className="mt-4 inline-flex text-sm font-semibold text-primary">
            Visual search
          </Link>
        </div>
        <div className="sheen-hover animate-rise rounded-3xl border border-border bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Intelligent assistant</p>
          <p className="mt-2 text-sm text-text-muted">
            Use the Corner Store AI assistant to compare, budget-filter, and recommend products.
          </p>
          <Link href="/help" className="mt-4 inline-flex text-sm font-semibold text-primary">
            Learn about AI
          </Link>
        </div>
        <div className="sheen-hover animate-rise rounded-3xl border border-border bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Notifications</p>
          <p className="mt-2 text-sm text-text-muted">See price drop alerts, back-in-stock updates, and order messages.</p>
          <Link href="/notifications" className="mt-4 inline-flex text-sm font-semibold text-primary">
            View alerts
          </Link>
        </div>
      </section>
    </div>
  );
}
