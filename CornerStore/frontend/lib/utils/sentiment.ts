/** Classify review sentiment from star rating: 4–5 positive, 3 neutral, 1–2 negative. */
export function getRatingSentimentScore(rating: number) {
  if (rating >= 4) return 1;
  if (rating <= 2) return -1;
  return 0;
}

export function getSentimentLabel(score: number) {
  if (score > 0) return "Positive";
  if (score < 0) return "Negative";
  return "Neutral";
}

export function getSentimentBadge(score: number) {
  if (score > 0) return "✅ Positive";
  if (score < 0) return "⚠️ Negative";
  return "🟡 Neutral";
}
