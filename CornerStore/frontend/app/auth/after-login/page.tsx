"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { useI18n } from "@/lib/use-i18n";

export default function AfterLoginPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl font-bold">{t("afterLoginTitle")}</h1>
      <Card>
        <p className="text-sm text-text-muted">{t("afterLoginDesc")}</p>
        <div className="mt-4 flex gap-2">
          <Link href="/account/dashboard">
            <Button>{t("goToDashboard")}</Button>
          </Link>
          <Link href="/wishlist">
            <Button variant="ghost">{t("openWishlist")}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
