const ALLOWED_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  const mime = file.type.toLowerCase();
  if (!ALLOWED_TYPES.has(mime)) {
    return "Use JPG, PNG, or WEBP images only.";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 10 MB or smaller.";
  }
  return null;
}

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve({
        base64: comma >= 0 ? result.slice(comma + 1) : result,
        mimeType: file.type || "image/jpeg",
      });
    };
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}
