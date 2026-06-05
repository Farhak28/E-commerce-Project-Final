"use client";

import Link from "next/link";
import { Badge } from "@/components/ui";

const FEATURES = [
  { label: "AI Shopping Assistant", icon: "✦" },
  { label: "Smart Recommendations", icon: "↗" },
  { label: "Product Comparison", icon: "⚖" },
  { label: "Review Analysis", icon: "★" },
  { label: "RAG Knowledge Base", icon: "▤" },
  { label: "Personalized Picks", icon: "◎" },
];

export function AiShowcaseBadges({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "" : "justify-center"}`}>
      {FEATURES.map((f) => (
        <Badge key={f.label} tone="ai" className="normal-case tracking-normal">
          <span aria-hidden>{f.icon}</span>
          {f.label}
        </Badge>
      ))}
    </div>
  );
}

export function AiShowcaseStrip() {
  return (
    <section className="rounded-[var(--radius-xl)] border border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 via-transparent to-cyan-500/5 p-6 md:p-8">
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-label text-primary">Graduation project showcase</p>
          <h2 className="section-title mt-1 text-xl font-bold md:text-2xl">Powered by AI throughout the shopping journey</h2>
          <p className="mt-2 max-w-xl text-sm text-text-muted">
            Corner Store demonstrates production-grade e-commerce with Gemini-powered assistance, RAG knowledge retrieval, and intelligent product discovery.
          </p>
        </div>
        <Link href="/help" className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:brightness-110">
          Try the assistant →
        </Link>
      </div>
      <div className="mt-5">
        <AiShowcaseBadges />
      </div>
    </section>
  );
}
