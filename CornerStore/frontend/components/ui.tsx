"use client";

import { ReactNode, useState } from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variants = {
    primary: "bg-primary text-white shadow-sm hover:brightness-110 active:scale-[0.98]",
    secondary: "bg-secondary text-white shadow-sm hover:brightness-110 active:scale-[0.98]",
    ghost: "bg-transparent border border-border hover:bg-surface-2 active:scale-[0.98]",
    outline: "bg-transparent border-2 border-primary/30 text-primary hover:bg-primary/5 active:scale-[0.98]",
    danger: "bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 text-base rounded-xl",
  };
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none transition placeholder:text-text-muted focus:border-primary/40 focus:ring-2 focus:ring-primary/20 ${props.className ?? ""}`}
    />
  );
}

export function Card({ children, className = "", hover = true }: { children: ReactNode; className?: string; hover?: boolean }) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow)] ${hover ? "transition hover:shadow-[var(--shadow-lg)]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-xl ${className}`} />;
}

export function Badge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: "default" | "primary" | "success" | "warning" | "ai";
  className?: string;
}) {
  const tones = {
    default: "bg-surface-2 text-text-muted border-border",
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    ai: "bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 text-primary border-indigo-500/20",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-xl)] border border-dashed border-border bg-surface/50 px-6 py-16 text-center">
      {icon ? <div className="mb-4 text-4xl opacity-60">{icon}</div> : null}
      <h3 className="section-title text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm text-text-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Tabs({ items }: { items: string[] }) {
  const [active, setActive] = useState(items[0]);
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setActive(item)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            active === item ? "bg-primary text-white shadow-md shadow-primary/25" : "bg-surface-2 text-text-muted hover:bg-primary/10"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function FeatureTabs() {
  const [active, setActive] = useState<"Overview" | "Specs" | "Reviews">("Overview");
  const tabContent = {
    Overview: {
      title: "Platform Overview",
      body: "Corner Store blends premium commerce design with intelligent assistance, personalized merchandising, and app-like performance.",
      points: ["AI chat-led discovery", "Real-time recommendation zones", "Consistent design tokens across pages"],
    },
    Specs: {
      title: "Technical Specs",
      body: "Built on Next.js App Router, Tailwind custom theming, component-based architecture, and an API integration layer.",
      points: ["Dark mode + EN/AR persistence", "Reusable UI primitives", "SEO-ready route structure"],
    },
    Reviews: {
      title: "User Reviews",
      body: "Early testers praise speed, visual quality, and the natural-language shopping assistant experience.",
      points: ['"Feels premium and smooth"', '"Search is surprisingly smart"', '"Checkout flow is very clear"'],
    },
  }[active];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {(["Overview", "Specs", "Reviews"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setActive(item)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              active === item ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-surface-2 text-text-muted hover:bg-primary/10"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="animate-rise rounded-2xl border border-border bg-surface-2 p-5">
        <h3 className="section-title text-lg font-semibold">{tabContent.title}</h3>
        <p className="mt-2 text-sm text-text-muted">{tabContent.body}</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {tabContent.points.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <span className="text-primary">•</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ToastPreview() {
  return (
    <div className="fixed bottom-4 right-4 z-40 animate-slide-up rounded-xl border border-border bg-surface px-4 py-3 text-sm shadow-[var(--shadow-lg)]">
      Coupon NOVA20 applied successfully
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-text-muted" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-text-muted" />
      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-text-muted" />
    </div>
  );
}
