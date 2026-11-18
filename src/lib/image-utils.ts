export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  const okType = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
  if (!okType) return "Please choose a JPG, JPEG, PNG or WEBP image.";
  if (file.size > MAX_UPLOAD_BYTES) return "This image is larger than 10 MB. Please choose a smaller photo.";
  if (file.size === 0) return "This file is empty.";
  return null;
}

/** Downscale any image source to a JPEG data URL (max edge `maxEdge`) to keep uploads small. */
export async function toCompressedDataUrl(src: string, maxEdge = 1280, quality = 0.85): Promise<string> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await img.decode();
  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser");
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}
