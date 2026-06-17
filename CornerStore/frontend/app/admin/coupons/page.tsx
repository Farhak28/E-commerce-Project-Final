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
import { useAdminI18n } from "@/lib/admin/use-admin-i18n";
import { getAdminCouponsSummary } from "@/lib/services/admin";
import type { AdminCouponsSummaryDTO } from "@/lib/types";

function formatRewardKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminCouponsPage() {
  const { t } = useAdminI18n();
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
      <AdminPageHeader title={t("couponsTitle")} description={t("couponsDescCart")} />

      {loading ? (
        <AdminLoadingGrid count={4} />
      ) : !summary ? (
        <AdminEmptyState title={t("couldNotLoadCoupons")} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard label={t("statActiveCoupons")} value={summary.activeCoupons} tone="success" />
            <AdminStatCard label={t("statRedeemed")} value={summary.redeemedCoupons} />
            <AdminStatCard label={t("statExpired")} value={summary.expiredCoupons} tone="warning" />
            <AdminStatCard
              label={t("statTotalDiscounts")}
              value={`$${summary.totalDiscountsGiven.toFixed(2)}`}
            />
          </div>

          <Card>
            <h2 className="section-title text-lg font-semibold">{t("rewardTiers")}</h2>
            <p className="mt-1 text-sm text-text-muted">{t("rewardTiersHintExtended")}</p>
            {summary.couponsByReward.length === 0 ? (
              <p className="mt-4 text-sm text-text-muted">{t("noCouponsIssued")}</p>
            ) : (
              <div className="mt-4">
                <AdminTable
                  columns={[t("colReward"), t("colActive"), t("colRedeemed")]}
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
              {t("couponsSyncHintBefore")}
              <Link href="/account/coupons" className="font-semibold text-primary">
                {t("accountMyCoupons")}
              </Link>
              {t("couponsSyncHintAfter")}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}
