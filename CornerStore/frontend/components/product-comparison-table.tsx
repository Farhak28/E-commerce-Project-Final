import Image from "next/image";
import Link from "next/link";
import { BrandOfficialLink } from "@/components/brand-official-link";
import type { Product } from "@/lib/types";

const rows: { label: string; get: (p: Product) => string }[] = [
  {
    label: "Description",
    get: (p) => (p.description.length > 160 ? `${p.description.slice(0, 160)}…` : p.description),
  },
  { label: "Price", get: (p) => `$${p.price}` },
  { label: "Category", get: (p) => p.productType },
  { label: "Brand", get: (p) => p.productBrand },
  { label: "Rating", get: (p) => (p.rating ? `${p.rating.toFixed(1)} ★` : "—") },
  { label: "Stock", get: (p) => (p.stock != null ? String(p.stock) : "—") },
  {
    label: "Features",
    get: (p) => (p.keyFeatures?.length ? p.keyFeatures.join(" · ") : p.description.slice(0, 80)),
  },
];

export function ProductComparisonTable({ products }: { products: Product[] }) {
  if (products.length < 2) return null;

  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2">
            <th className="p-3 font-semibold">Attribute</th>
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
            <tr key={row.label} className="border-b border-border last:border-0">
              <td className="p-3 font-medium text-text-muted">{row.label}</td>
              {products.map((p) => (
                <td key={`${p.id}-${row.label}`} className="p-3">
                  {row.get(p)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-b border-border last:border-0 bg-surface-2/50">
            <td className="p-3 font-medium text-text-muted">Official site</td>
            {products.map((p) => (
              <td key={`${p.id}-official`} className="p-3">
                <BrandOfficialLink
                  brandName={p.productBrand}
                  officialUrl={p.brandOfficialUrl}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
