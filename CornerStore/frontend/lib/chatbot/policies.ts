export type PolicyAnswer = {
  title: string;
  body: string;
};

const policies: Record<string, PolicyAnswer> = {
  shipping: {
    title: "Shipping",
    body: "Corner Store ships within 3–5 business days. Express delivery is available at checkout. Track orders under Account → Order History.",
  },
  returns: {
    title: "Returns",
    body: "You may return unused items within 14 days. Open Account → Orders and contact support with your order ID to start a return.",
  },
  payment: {
    title: "Payment",
    body: "We accept card payments via Stripe at checkout. Your payment is encrypted and you receive instant order confirmation.",
  },
  warranty: {
    title: "Warranty",
    body: "Electronics include a 1-year manufacturer warranty unless noted on the product page. Keep your order receipt for claims.",
  },
  hours: {
    title: "Support hours",
    body: "Corner Store online support is available 24/7 via this assistant and the Help page. Live agents: Sun–Thu 9am–6pm.",
  },
};

export function matchPolicyIntent(message: string): PolicyAnswer | null {
  const q = message.toLowerCase();
  if (/ship|delivery|track|arrive/.test(q)) return policies.shipping;
  if (/return|refund|exchange/.test(q)) return policies.returns;
  if (/pay|card|stripe|payment/.test(q)) return policies.payment;
  if (/warranty|guarantee/.test(q)) return policies.warranty;
  if (/hour|support|contact|help|customer service/.test(q)) return policies.hours;
  if (/privacy|data|cookie/.test(q)) {
    return {
      title: "Privacy",
      body: "We use your account data only to fulfill orders and personalize recommendations. You can update profile details under Account.",
    };
  }
  return null;
}
