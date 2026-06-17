"use client";

import Image from "next/image";
import Link from "next/link";
import { BrandOfficialLink } from "@/components/brand-official-link";
import { useI18n } from "@/lib/use-i18n";
import type { Product } from "@/lib/types";
import type { I18nKey } from "@/lib/i18n";

export function ProductComparisonTable({ products }: { products: Product[] }) {
  const { t } = useI18n();

  const rows: { labelKey: I18nKey; get: (p: Product) => string }[] = [
    {
      labelKey: "compareDescription",
      get: (p) => (p.description.length > 160 ? `${p.description.slice(0, 160)}…` : p.description),
    },
    { labelKey: "price", get: (p) => `$${p.price}` },
    { labelKey: "type", get: (p) => p.productType },
    { labelKey: "brand", get: (p) => p.productBrand },
    { labelKey: "ratings", get: (p) => (p.rating ? `${p.rating.toFixed(1)} ★` : "—") },
    { labelKey: "compareStock", get: (p) => (p.stock != null ? String(p.stock) : "—") },
    {
      labelKey: "compareFeatures",
      get: (p) => (p.keyFeatures?.length ? p.keyFeatures.join(" · ") : p.description.slice(0, 80)),
    },
  ];

  if (products.length < 2) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="p-3 font-semibold">{t("compareAttribute")}</th>
            {products.map((p) => (
              <th key={p.id} className="min-w-[160px] p-3">
                <div className="relative mb-2 h-20 w-full overflow-hidden rounded-lg">
                  <Image src={p.pictureUrl} alt={p.name} fill sizes="160px" className="object-cover" />
                </div>
                <Link href={`/products/${p.id}`} className="font-semibold text-primary hover:underline">
                  {p.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.labelKey} className="border-b border-border last:border-0">
              <td className="p-3 font-medium text-text-muted">{t(row.labelKey)}</td>
              {products.map((p) => (
                <td key={`${p.id}-${row.labelKey}`} className="p-3">
                  {row.get(p)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-b border-border last:border-0 bg-surface-2/50">
            <td className="p-3 font-medium text-text-muted">{t("officialBrandSite")}</td>
            {products.map((p) => (
              <td key={`${p.id}-official`} className="p-3">
                <BrandOfficialLink brandName={p.productBrand} officialUrl={p.brandOfficialUrl} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
