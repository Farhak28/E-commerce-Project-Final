"use client";

import { Card } from "@/components/ui";
import type { AdminAiOverviewDTO, AdminAnalyticsDTO } from "@/lib/types";
import { getOrderStatusMeta } from "@/lib/utils/order-status";

function BarChart({
  items,
  formatValue,
}: {
  items: { label: string; value: number }[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between gap-2 text-xs text-text-muted">
            <span className="truncate">{item.label}</span>
            <span className="shrink-0 tabular-nums">{formatValue ? formatValue(item.value) : item.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${Math.max(8, (item.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminCharts({
  analytics,
  ai,
}: {
  analytics: AdminAnalyticsDTO | null;
  ai?: AdminAiOverviewDTO | null;
}) {
  if (!analytics) return null;

  const revenueItems = analytics.revenueByMonth.map((m) => ({
    label: m.label,
    value: m.amount,
  }));

  const statusItems = analytics.ordersByStatus.map((s) => ({
    label: getOrderStatusMeta(s.status).label,
    value: s.count,
  }));

  const aiToolItems = ai
    ? [
        { label: "Product searches", value: ai.productSearchRequests },
        { label: "Comparisons", value: ai.comparisonRequests },
        { label: "Order tracking", value: ai.orderStatusRequests },
        { label: "Recommendations", value: ai.recommendationRequests },
      ].filter((i) => i.value > 0)
    : [];

  const fulfillmentItems = (analytics.fulfillmentByStage ?? []).map((s) => ({
    label: s.stage.replace(/([A-Z])/g, " $1").trim(),
    value: s.count,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="section-title text-lg font-semibold">Revenue (6 months)</h2>
        <div className="mt-4">
          <BarChart items={revenueItems} formatValue={(v) => `$${v.toLocaleString()}`} />
        </div>
      </Card>
      <Card>
        <h2 className="section-title text-lg font-semibold">Orders by status</h2>
        <div className="mt-4">
          <BarChart items={statusItems} />
        </div>
      </Card>
      {fulfillmentItems.length > 0 ? (
        <Card>
          <h2 className="section-title text-lg font-semibold">Fulfillment pipeline</h2>
          <div className="mt-4">
            <BarChart items={fulfillmentItems} />
          </div>
        </Card>
      ) : null}
      {aiToolItems.length > 0 ? (
        <Card className={fulfillmentItems.length > 0 ? "" : "lg:col-span-2"}>
          <h2 className="section-title text-lg font-semibold">AI tool usage</h2>
          <p className="mt-1 text-sm text-text-muted">Real counts from assistant interaction logs.</p>
          <div className="mt-4">
            <BarChart items={aiToolItems} />
          </div>
        </Card>
      ) : (
        <Card className="lg:col-span-2">
          <h2 className="section-title text-lg font-semibold">AI engagement</h2>
          <p className="mt-2 text-sm text-text-muted">
            {ai?.totalConversations
              ? `${ai.totalConversations} conversations logged · ${ai.uniqueSessions} unique sessions`
              : "No AI conversations logged yet. Usage will appear after customers use the assistant."}
          </p>
        </Card>
      )}
    </div>
  );
}
