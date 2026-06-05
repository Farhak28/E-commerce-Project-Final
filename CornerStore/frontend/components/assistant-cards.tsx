"use client";

import Link from "next/link";
import { ProductImage } from "@/components/product-image";
import type {
  AssistantStructuredData,
  ComparisonProduct,
  OrderStatusItem,
  ReviewSummary,
} from "@/lib/types/assistant";
import type { Product } from "@/lib/types";

export function AssistantProductCards({
  products,
  compareIds,
  onToggleCompare,
}: {
  products: Product[];
  compareIds: number[];
  onToggleCompare: (id: number) => void;
}) {
  if (!products.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {products.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-surface">
          <Link href={`/products/${item.id}`} className="flex gap-3 p-2 transition hover:bg-surface-2">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
              <ProductImage src={item.pictureUrl} alt="" fill sizes="56px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 font-semibold">{item.name}</p>
              <p className="text-xs text-text-muted">
                ${item.price} · {item.productType}
                {item.rating ? ` · ★ ${item.rating.toFixed(1)}` : ""}
              </p>
            </div>
          </Link>
          <div className="flex border-t border-border">
            <button
              type="button"
              className={`flex-1 py-1.5 text-[11px] font-semibold ${compareIds.includes(item.id) ? "bg-accent/10 text-accent" : "text-primary hover:bg-primary/5"}`}
              onClick={() => onToggleCompare(item.id)}
            >
              {compareIds.includes(item.id) ? "✓ In compare" : "+ Compare"}
            </button>
            <Link
              href={`/products/${item.id}`}
              className="flex-1 border-l border-border py-1.5 text-center text-[11px] font-semibold text-primary hover:bg-primary/5"
            >
              View →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ComparisonCard({ products }: { products: ComparisonProduct[] }) {
  if (!products.length) return null;

  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-indigo-500/20 bg-surface">
      <table className="w-full min-w-[320px] text-left text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-2/80">
            <th className="p-2 font-semibold">Product</th>
            <th className="p-2 font-semibold">Price</th>
            <th className="p-2 font-semibold">Rating</th>
            <th className="p-2 font-semibold">Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0">
              <td className="p-2">
                <Link href={`/products/${p.id}`} className="font-semibold text-primary hover:underline">
                  {p.name}
                </Link>
                <p className="text-[10px] text-text-muted">{p.productBrand} · {p.productType}</p>
              </td>
              <td className="p-2">${p.price}</td>
              <td className="p-2">★ {p.averageRating.toFixed(1)}</td>
              <td className="p-2">{p.stockQuantity > 0 ? p.stockQuantity : "Out"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OrderStatusCard({
  orders,
  highlighted,
}: {
  orders: OrderStatusItem[];
  highlighted?: OrderStatusItem | null;
}) {
  const items = highlighted ? [highlighted] : orders;
  if (!items.length) return null;

  return (
    <div className="mt-3 space-y-2">
      {items.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          className="block rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 transition hover:bg-emerald-500/10"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">Order #{order.id.slice(0, 8)}…</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {order.status}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-text-muted">
            ${order.total} · {new Date(order.orderDate).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function ReviewSummaryCard({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
      <p className="text-xs font-semibold">Review Summary — {summary.productName}</p>
      <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-600">
          +{summary.positivePercentage}%
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5">
          ~{summary.neutralPercentage}%
        </span>
        <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-red-600">
          −{summary.negativePercentage}%
        </span>
        <span className="rounded-full bg-surface-2 px-2 py-0.5">
          ★ {summary.averageRating.toFixed(1)} ({summary.totalReviews})
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-text-muted">{summary.summary}</p>
    </div>
  );
}

export function AssistantStructuredCards({
  structured,
  compareIds,
  onToggleCompare,
}: {
  structured?: AssistantStructuredData | null;
  compareIds: number[];
  onToggleCompare: (id: number) => void;
}) {
  if (!structured) return null;

  return (
    <>
      {structured.comparison?.products?.length ? (
        <ComparisonCard products={structured.comparison.products} />
      ) : null}
      {structured.orders ? (
        <OrderStatusCard
          orders={structured.orders.orders}
          highlighted={structured.orders.highlightedOrder}
        />
      ) : null}
      {structured.reviewSummary ? (
        <ReviewSummaryCard summary={structured.reviewSummary} />
      ) : null}
    </>
  );
}
