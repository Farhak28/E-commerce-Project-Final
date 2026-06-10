const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

function inferMimeType(file: File): string {
  const mime = file.type?.toLowerCase() ?? "";
  if (mime && ALLOWED_TYPES.has(mime)) return mime;
  const name = file.name?.toLowerCase() ?? "";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export function validateImageFile(file: File): string | null {
  const mime = inferMimeType(file);
  if (!ALLOWED_TYPES.has(mime)) {
    return "Use JPG, PNG, or WEBP images only.";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 10 MB or smaller.";
  }
  if (file.size === 0) {
    return "The image file is empty. Try again.";
  }
  return null;
}

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  const mimeType = inferMimeType(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve({
        base64: comma >= 0 ? result.slice(comma + 1) : result,
        mimeType,
      });
    };
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}
