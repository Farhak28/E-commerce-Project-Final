import { getBrandOfficialUrl } from "@/lib/utils/brand-urls";

type Props = {
  brandName: string;
  officialUrl?: string | null;
  className?: string;
  variant?: "inline" | "card";
};

export function BrandOfficialLink({
  brandName,
  officialUrl,
  className = "",
  variant = "inline",
}: Props) {
  const url = getBrandOfficialUrl(brandName, officialUrl);
  if (!url) return null;

  const base =
    variant === "card"
      ? "inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-primary/5"
      : "inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-2 hover:underline";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${className}`}
    >
      <span>Visit {brandName} official site</span>
      <span aria-hidden className="text-xs opacity-70">
        ↗
      </span>
    </a>
  );
}
