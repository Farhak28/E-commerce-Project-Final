"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { useI18n } from "@/lib/use-i18n";

export default function BeforeLoginPage() {
  const { t } = useI18n();

  return (
    <div className="space-y-6">
      <h1 className="section-title text-3xl font-bold">{t("beforeLoginTitle")}</h1>
      <Card>
        <p className="text-sm text-text-muted">{t("beforeLoginDesc")}</p>
        <div className="mt-4 flex gap-2">
          <Link href="/login">
            <Button>{t("loginTitle")}</Button>
          </Link>
          <Link href="/register">
            <Button variant="ghost">{t("registerTitle")}</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
