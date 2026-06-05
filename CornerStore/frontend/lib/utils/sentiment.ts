const positiveKeywords = [
  "good",
  "great",
  "excellent",
  "amazing",
  "fast",
  "perfect",
  "useful",
  "love",
  "smooth",
  "favorite",
  "quality",
  "worth",
  "recommend",
  "happy",
  "battery",
  "comfortable",
  "clear",
  "sharp",
];
const negativeKeywords = [
  "bad",
  "poor",
  "slow",
  "broken",
  "expensive",
  "terrible",
  "weak",
  "disappointed",
  "return",
  "issue",
  "defect",
  "cheap",
  "noisy",
  "overheat",
  "lag",
  "scratch",
  "refund",
];

export function getSentimentScore(text: string) {
  const normalized = text.toLowerCase();
  const positive = positiveKeywords.reduce((count, keyword) => count + (normalized.includes(keyword) ? 1 : 0), 0);
  const negative = negativeKeywords.reduce((count, keyword) => count + (normalized.includes(keyword) ? 1 : 0), 0);

  if (positive > negative) return 1;
  if (negative > positive) return -1;
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
