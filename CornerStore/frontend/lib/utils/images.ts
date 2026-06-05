function normalizeUrl(url: string): string {
  const match = url.match(/^(https?:\/\/[^/]+)(\/.*)?$/);
  if (!match) return url;
  const origin = match[1];
  const path = (match[2] ?? "/").replace(/\/{2,}/g, "/");
  return `${origin}${path}`;
}

function getApiOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_API_ORIGIN ??
    (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5141/api").replace(/\/api\/?$/, "")
  ).replace(/\/$/, "");
}

const LOCAL_PRODUCT_IMAGE_PREFIX = "/images/products/";

/** Extract `/images/products/...` from a stored or absolute URL. */
export function toLocalProductImagePath(pictureUrl: string): string | null {
  const marker = LOCAL_PRODUCT_IMAGE_PREFIX;
  const idx = pictureUrl.indexOf(marker);
  if (idx >= 0) return pictureUrl.slice(idx);
  return null;
}

/** Store relative paths in the database; strip API origin when editing. */
export function normalizePictureUrlForStorage(pictureUrl: string): string {
  const trimmed = pictureUrl.trim();
  if (!trimmed) return "";

  const local = toLocalProductImagePath(trimmed);
  if (local) return local;

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const fromAbsolute = toLocalProductImagePath(new URL(trimmed).pathname);
      if (fromAbsolute) return fromAbsolute;
    } catch {
      // keep as external URL
    }
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/**
 * Resolve product image URLs for display.
 * Uploaded files are served from the .NET API static files (/images/products/...).
 */
export function resolvePictureUrl(pictureUrl: string): string {
  if (!pictureUrl) return "/placeholder-product.svg";

  const localPath = toLocalProductImagePath(pictureUrl);
  if (localPath) {
    return normalizeUrl(`${getApiOrigin()}${localPath}`);
  }

  if (pictureUrl.startsWith("http://") || pictureUrl.startsWith("https://")) {
    return normalizeUrl(pictureUrl);
  }

  const path = pictureUrl.startsWith("/") ? pictureUrl : `/${pictureUrl}`;
  return normalizeUrl(`${getApiOrigin()}${path}`);
}
