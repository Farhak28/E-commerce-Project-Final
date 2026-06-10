"use client";

type StarRatingProps = {
  value: number;
  max?: number;
  size?: "sm" | "md";
  onChange?: (value: number) => void;
  readOnly?: boolean;
};

export function StarRating({
  value,
  max = 5,
  size = "md",
  onChange,
  readOnly = false,
}: StarRatingProps) {
  const starSize = size === "sm" ? "text-base" : "text-xl";
  const interactive = !readOnly && onChange;

  return (
    <div className={`inline-flex items-center gap-0.5 ${starSize}`} role={interactive ? "radiogroup" : undefined}>
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= Math.round(value);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            className={`leading-none transition ${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            } ${filled ? "text-amber-400" : "text-border"}`}
            onClick={() => onChange?.(star)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
