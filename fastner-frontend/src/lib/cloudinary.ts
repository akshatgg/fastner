/** Shared unsigned Cloudinary upload helper.
 *
 * Configured via public env vars (neither is secret, so both are safe in the
 * browser):
 *    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 *    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET   (an *unsigned* preset)
 *
 * Supports both images and videos. Callers pass a size limit; oversized files
 * are rejected before the network call so we never waste an upload.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export type CloudinaryResourceType = "image" | "video";

/** Default size ceilings (in MB) for review media. */
export const MAX_IMAGE_MB = 5;
export const MAX_VIDEO_MB = 50;

export class UploadError extends Error {}

export function isConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

/** Infer the Cloudinary resource type from a File's MIME type. */
export function resourceTypeOf(file: File): CloudinaryResourceType {
  return file.type.startsWith("video/") ? "video" : "image";
}

/**
 * Upload a single file to Cloudinary and return its secure URL.
 * Throws `UploadError` with a user-friendly message on any failure.
 */
export async function uploadToCloudinary(
  file: File,
  opts: { folder?: string; maxMB?: number } = {},
): Promise<{ url: string; type: CloudinaryResourceType }> {
  if (!isConfigured()) {
    throw new UploadError(
      "Image uploads aren't configured. Please try again later.",
    );
  }

  const type = resourceTypeOf(file);
  const maxMB =
    opts.maxMB ?? (type === "video" ? MAX_VIDEO_MB : MAX_IMAGE_MB);
  if (file.size > maxMB * 1024 * 1024) {
    throw new UploadError(
      `That ${type} is too large. Maximum size is ${maxMB} MB.`,
    );
  }

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET as string);
  if (opts.folder) form.append("folder", opts.folder);

  let res: Response;
  try {
    res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${type}/upload`,
      { method: "POST", body: form },
    );
  } catch {
    throw new UploadError("Upload failed — check your connection and retry.");
  }
  if (!res.ok) throw new UploadError("Upload failed. Please try again.");

  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new UploadError("Upload failed. Please try again.");
  return { url: data.secure_url, type };
}
