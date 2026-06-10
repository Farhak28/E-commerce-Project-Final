"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { StarRating } from "@/components/star-rating";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { getProductReviews, addProductReview } from "@/lib/services/reviews";
import { getSentimentBadge, getSentimentScore } from "@/lib/utils/sentiment";

type ReviewRow = {
  id?: number;
  user: string;
  rating: number;
  comment: string;
  createdAt?: string;
};

export function ProductDetailsTabs({ productId }: { productId: number }) {
  const [tab, setTab] = useState<"specs" | "reviews" | "checkout">("specs");
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { addToCart } = useCart();
  const { isSignedIn, session } = useAuth();
  const router = useRouter();

  const loadReviews = useCallback(() => {
    setLoadingReviews(true);
    void getProductReviews(productId)
      .then((data) =>
        setReviews(
          data.map((r) => ({
            id: r.id,
            user: r.userName,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
          })),
        ),
      )
      .catch(() => setReviews([]))
      .finally(() => setLoadingReviews(false));
  }, [productId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    const openReviews = () => setTab("reviews");
    window.addEventListener("product:open-reviews-tab", openReviews);
    return () => window.removeEventListener("product:open-reviews-tab", openReviews);
  }, []);

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
    if (!isSignedIn) {
      setFeedback({ type: "err", text: "Sign in to leave a review." });
      return;
    }
    if (!comment.trim()) {
      setFeedback({ type: "err", text: "Write a short comment before submitting." });
      return;
    }
    if (comment.trim().length > 2000) {
      setFeedback({ type: "err", text: "Comment must be 2000 characters or less." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const created = await addProductReview(productId, {
        rating,
        comment: comment.trim(),
        userName: session?.displayName,
      });
      setReviews((current) => [
        {
          id: created.id,
          user: created.userName,
          rating: created.rating,
          comment: created.comment,
          createdAt: created.createdAt,
        },
        ...current,
      ]);
      setComment("");
      setRating(5);
      setFeedback({ type: "ok", text: "Review submitted. Thank you!" });
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not submit review. Try again later.";
      setFeedback({ type: "err", text: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex gap-2">
        {[
          { id: "specs", label: "Overview" },
          { id: "reviews", label: `Reviews (${reviews.length})` },
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
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                <StarRating value={averageRating} readOnly size="sm" />
              </div>
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
        <div
          id="product-reviews"
          className="animate-rise scroll-mt-24 rounded-2xl border border-border bg-surface p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="section-title text-xl font-semibold">Ratings &amp; reviews</h2>
              <p className="mt-1 text-xs text-text-muted">
                Share your experience — star rating and written comment
              </p>
            </div>
            {reviews.length > 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2">
                <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
                <StarRating value={averageRating} readOnly size="sm" />
                <span className="text-xs text-text-muted">({reviews.length})</span>
              </div>
            ) : null}
          </div>

          {loadingReviews ? (
            <p className="mt-4 text-sm text-text-muted">Loading reviews…</p>
          ) : (
            <>
              <div className="mt-4 grid gap-4 lg:grid-cols-4">
                <div className="rounded-2xl bg-surface-2 p-4 text-sm">
                  <p className="font-semibold">Average</p>
                  <p className="mt-2 text-3xl font-bold">{averageRating.toFixed(1)}</p>
                  <StarRating value={averageRating} readOnly size="sm" />
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
                    <p className="mt-2 text-sm text-text-muted">
                      <Link href="/login" className="font-semibold text-primary hover:underline">
                        Sign in
                      </Link>{" "}
                      to rate and review this product.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-text-muted">
                      Posting as {session?.displayName ?? "you"}
                    </p>
                  )}
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-sm font-medium">Your rating</label>
                      <div className="mt-2 flex items-center gap-2">
                        <StarRating value={rating} onChange={setRating} />
                        <span className="text-sm text-text-muted">{rating} / 5</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="review-comment" className="block text-sm font-medium">
                        Comment
                      </label>
                      <textarea
                        id="review-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm"
                        rows={4}
                        placeholder="What did you like or dislike?"
                        maxLength={2000}
                        disabled={!isSignedIn}
                      />
                      <p className="mt-1 text-right text-[10px] text-text-muted">{comment.length}/2000</p>
                    </div>
                    {feedback ? (
                      <p
                        className={`text-sm ${feedback.type === "ok" ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {feedback.text}
                      </p>
                    ) : null}
                    <Button type="submit" className="w-full" disabled={submitting || !isSignedIn}>
                      {submitting ? "Submitting…" : "Submit review"}
                    </Button>
                  </div>
                </form>

                <div className="max-h-96 space-y-3 overflow-y-auto">
                  {reviews.length === 0 ? (
                    <p className="text-sm text-text-muted">No reviews yet. Be the first to review.</p>
                  ) : (
                    reviews.map((review) => (
                      <div
                        key={review.id ?? `${review.user}-${review.createdAt}`}
                        className="rounded-2xl bg-surface-2 p-4 text-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">{review.user}</p>
                          <StarRating value={review.rating} readOnly size="sm" />
                        </div>
                        <p className="mt-1 text-xs text-text-muted">
                          {getSentimentBadge(getSentimentScore(review.comment))}
                          {review.createdAt
                            ? ` · ${new Date(review.createdAt).toLocaleDateString()}`
                            : ""}
                        </p>
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
