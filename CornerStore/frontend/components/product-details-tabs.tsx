"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { getProductReviews, addProductReview } from "@/lib/services/reviews";
import { getSentimentBadge, getSentimentScore } from "@/lib/utils/sentiment";

type ReviewRow = {
  user: string;
  rating: number;
  comment: string;
};

export function ProductDetailsTabs({ productId }: { productId: number }) {
  const [tab, setTab] = useState<"specs" | "reviews" | "checkout">("specs");
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [newReview, setNewReview] = useState<ReviewRow>({ user: "Guest", rating: 5, comment: "" });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToCart } = useCart();
  const { isSignedIn, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setLoadingReviews(true);
    void getProductReviews(productId)
      .then((data) =>
        setReviews(
          data.map((r) => ({
            user: r.userName,
            rating: r.rating,
            comment: r.comment,
          })),
        ),
      )
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [productId]);

  const averageRating = useMemo(
    () => (reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0),
    [reviews],
  );

  const sentimentCounts = useMemo(() => {
    const counts = { positive: 0, neutral: 0, negative: 0 };
    reviews.forEach((review) => {
      const score = getSentimentScore(review.comment);
      if (score > 0) counts.positive += 1;
      else if (score < 0) counts.negative += 1;
      else counts.neutral += 1;
    });
    return counts;
  }, [reviews]);

  const sentimentPct = useMemo(() => {
    const total = reviews.length || 1;
    return {
      positive: Math.round((sentimentCounts.positive / total) * 100),
      neutral: Math.round((sentimentCounts.neutral / total) * 100),
      negative: Math.round((sentimentCounts.negative / total) * 100),
    };
  }, [sentimentCounts, reviews.length]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newReview.comment.trim()) {
      setFeedback("Write a short comment before submitting.");
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const created = await addProductReview(productId, {
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        userName: session?.displayName ?? "Guest",
      });
      setReviews((current) => [
        {
          user: created.userName,
          rating: created.rating,
          comment: created.comment,
        },
        ...current,
      ]);
      setNewReview({ user: session?.displayName ?? "Guest", rating: 5, comment: "" });
      setFeedback("Review submitted. Thank you!");
    } catch {
      setFeedback("Could not submit review. Sign in or try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex gap-2">
        {[
          { id: "specs", label: "Overview" },
          { id: "reviews", label: "Reviews" },
          { id: "checkout", label: "Checkout" },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id as "specs" | "reviews" | "checkout")}
            className={`rounded-full px-4 py-2 text-sm transition ${tab === item.id ? "bg-primary text-white" : "bg-surface-2 text-text-muted"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "specs" ? (
        <div className="animate-rise rounded-2xl border border-border bg-surface p-4">
          <h2 className="section-title text-xl font-semibold">Product overview</h2>
          <p className="mt-2 text-sm text-text-muted">
            Ratings and sentiment are computed from live Corner Store reviews.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-surface-2 p-4 text-sm">
              <p className="font-semibold">Average rating</p>
              <p className="mt-2 text-2xl font-bold">{averageRating.toFixed(1)} ★</p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4 text-sm">
              <p className="font-semibold">Review count</p>
              <p className="mt-2 text-2xl font-bold">{reviews.length}</p>
            </div>
            <div className="rounded-2xl bg-surface-2 p-4 text-sm">
              <p className="font-semibold">Sentiment mix</p>
              <p className="mt-2 text-xs text-text-muted">
                {sentimentPct.positive}% positive · {sentimentPct.neutral}% neutral · {sentimentPct.negative}%
                negative
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "reviews" ? (
        <div className="animate-rise rounded-2xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title text-xl font-semibold">Ratings &amp; reviews</h2>
              <p className="mt-1 text-xs text-text-muted">Keyword-based sentiment (positive / neutral / negative)</p>
            </div>
          </div>

          {loadingReviews ? (
            <p className="mt-4 text-sm text-text-muted">Loading reviews…</p>
          ) : (
            <>
              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl bg-surface-2 p-4 text-sm">
                  <p className="font-semibold">Average</p>
                  <p className="mt-2 text-3xl font-bold">{averageRating.toFixed(1)}</p>
                </div>
                <div className="rounded-2xl bg-surface-2 p-4 text-sm">
                  <p className="font-semibold text-secondary">Positive</p>
                  <p className="mt-2 text-2xl font-bold">{sentimentPct.positive}%</p>
                </div>
                <div className="rounded-2xl bg-surface-2 p-4 text-sm">
                  <p className="font-semibold">Neutral</p>
                  <p className="mt-2 text-2xl font-bold">{sentimentPct.neutral}%</p>
                </div>
                <div className="rounded-2xl bg-surface-2 p-4 text-sm">
                  <p className="font-semibold text-accent">Negative</p>
                  <p className="mt-2 text-2xl font-bold">{sentimentPct.negative}%</p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <form className="rounded-2xl bg-surface-2 p-4" onSubmit={handleSubmit}>
                  <h3 className="font-semibold">Write a review</h3>
                  {!isSignedIn ? (
                    <p className="mt-2 text-xs text-text-muted">Sign in for best results; guest name is used otherwise.</p>
                  ) : null}
                  <div className="mt-3 space-y-3">
                    <label className="block text-sm font-medium">Rating</label>
                    <select
                      value={newReview.rating}
                      onChange={(e) => setNewReview({ ...newReview, rating: Number(e.target.value) })}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} stars
                        </option>
                      ))}
                    </select>
                    <label className="block text-sm font-medium">Comment</label>
                    <textarea
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                      rows={4}
                    />
                    {feedback ? <p className="text-sm text-text-muted">{feedback}</p> : null}
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? "Submitting…" : "Submit review"}
                    </Button>
                  </div>
                </form>

                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-text-muted">No reviews yet. Be the first to review.</p>
                  ) : (
                    reviews.map((review, idx) => (
                      <div key={`${review.user}-${idx}`} className="rounded-2xl bg-surface-2 p-4 text-sm">
                        <p className="font-semibold">
                          {review.user} — {review.rating}/5
                        </p>
                        <p className="mt-1 text-text-muted">{getSentimentBadge(getSentimentScore(review.comment))}</p>
                        <p className="mt-2">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}

      {tab === "checkout" ? (
        <div className="animate-rise rounded-2xl border border-border bg-surface p-4">
          <h2 className="section-title text-xl font-semibold">Instant checkout</h2>
          <p className="mt-2 text-sm text-text-muted">Add to cart and continue to secure checkout.</p>
          <Button
            type="button"
            className="mt-4"
            onClick={() => {
              void addToCart(productId, 1);
              router.push("/checkout");
            }}
          >
            Proceed to checkout
          </Button>
        </div>
      ) : null}
    </section>
  );
}
