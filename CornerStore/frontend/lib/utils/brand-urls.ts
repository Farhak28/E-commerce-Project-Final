const BRAND_OFFICIAL_URLS: Record<string, string> = {
  apple: "https://www.apple.com",
  samsung: "https://www.samsung.com",
  sony: "https://www.sony.com",
  asus: "https://www.asus.com",
  dell: "https://www.dell.com",
  hp: "https://www.hp.com",
  lenovo: "https://www.lenovo.com",
  acer: "https://www.acer.com",
  msi: "https://www.msi.com",
  huawei: "https://consumer.huawei.com",
  xiaomi: "https://www.mi.com",
  oppo: "https://www.oppo.com",
  realme: "https://www.realme.com",
  oneplus: "https://www.oneplus.com",
  google: "https://store.google.com",
  microsoft: "https://www.microsoft.com",
  nintendo: "https://www.nintendo.com",
  logitech: "https://www.logitech.com",
  razer: "https://www.razer.com",
  hyperx: "https://hyperx.com",
  jbl: "https://www.jbl.com",
  bose: "https://www.bose.com",
  beats: "https://www.beatsbydre.com",
  anker: "https://www.anker.com",
  corsair: "https://www.corsair.com",
  "cooler master": "https://www.coolermaster.com",
  kingston: "https://www.kingston.com",
  seagate: "https://www.seagate.com",
  "western digital": "https://www.westerndigital.com",
};

export function getBrandOfficialUrl(
  brandName: string,
  officialUrl?: string | null,
): string | null {
  if (officialUrl?.trim()) return officialUrl.trim();
  const key = brandName.trim().toLowerCase();
  return BRAND_OFFICIAL_URLS[key] ?? null;
}
