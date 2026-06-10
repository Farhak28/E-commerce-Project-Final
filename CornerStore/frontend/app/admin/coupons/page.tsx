"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AdminEmptyState,
  AdminLoadingGrid,
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
} from "@/components/admin/admin-ui";
import { Card } from "@/components/ui";
import { getAdminCouponsSummary } from "@/lib/services/admin";
import type { AdminCouponsSummaryDTO } from "@/lib/types";

function formatRewardKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminCouponsPage() {
  const [summary, setSummary] = useState<AdminCouponsSummaryDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void getAdminCouponsSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Loyalty coupons"
        description="Purchase-based rewards auto-issued per customer. Customers apply codes at cart or checkout."
      />

      {loading ? (
        <AdminLoadingGrid count={4} />
      ) : !summary ? (
        <AdminEmptyState title="Could not load coupon summary" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label="Active coupons" value={summary.activeCoupons} tone="success" />
            <AdminStatCard label="Redeemed" value={summary.redeemedCoupons} />
            <AdminStatCard label="Expired" value={summary.expiredCoupons} tone="warning" />
            <AdminStatCard
              label="Total discounts given"
              value={`$${summary.totalDiscountsGiven.toFixed(2)}`}
            />
          </div>

          <Card>
            <h2 className="section-title text-lg font-semibold">Reward tiers</h2>
            <p className="mt-1 text-sm text-text-muted">
              Coupons unlock from order count and lifetime spend (welcome, silver, gold, VIP, spend milestones, free shipping).
            </p>
            {summary.couponsByReward.length === 0 ? (
              <p className="mt-4 text-sm text-text-muted">No coupons issued yet.</p>
            ) : (
              <div className="mt-4">
                <AdminTable
                  columns={["Reward", "Active", "Redeemed"]}
                  rows={summary.couponsByReward.map((tier) => [
                    formatRewardKey(tier.rewardKey),
                    String(tier.active),
                    String(tier.redeemed),
                  ])}
                />
              </div>
            )}
          </Card>

          <Card className="text-sm text-text-muted">
            <p>
              Coupons are synced when customers visit{" "}
              <Link href="/account/coupons" className="font-semibold text-primary">
                Account → My coupons
              </Link>
              . Each code is unique per user and single-use.
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
