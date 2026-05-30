"use client";

import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

/** Unsigned Cloudinary upload — configured via public env vars:
 *    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME   e.g. "ibc-fasteners"
 *    NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET  an *unsigned* preset created in the
 *      Cloudinary dashboard (Settings → Upload → Upload presets).
 *  Neither value is secret, so they're safe to expose to the browser. */
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function ImageUpload({
  value,
  onChange,
  label = "Image",
  folder,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Cloudinary folder to upload into, e.g. "ibc/industries". */
  folder?: string;
}) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      toast.error(
        "Cloudinary isn't configured — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.",
      );
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("upload_preset", UPLOAD_PRESET);
      if (folder) form.append("folder", folder);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: form },
      );
      if (!res.ok) throw new Error("upload failed");
      const data = (await res.json()) as { secure_url?: string };
      if (!data.secure_url) throw new Error("no url");
      onChange(data.secure_url);
      toast.success("Image uploaded.");
    } catch {
      toast.error("Could not upload the image. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && (
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
          {label}
        </label>
      )}

      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[10px] text-ink-300">No image</span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:text-brand-600">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Uploading…" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
                e.target.value = "";
              }}
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="inline-flex w-fit items-center gap-1 text-xs text-ink-400 transition hover:text-red-600"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL"
        className="mt-2 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
