"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import {
  MAX_IMAGE_MB,
  MAX_VIDEO_MB,
  UploadError,
  uploadToCloudinary,
} from "@/lib/cloudinary";
import type { ReviewMedia } from "../types";
import MediaThumb from "./MediaThumb";

const MAX_FILES = 8;

/** Photo/video picker for the write-review form. Uploads each file to
 *  Cloudinary (with size limits) and reports the resulting media list up. */
export default function ReviewMediaUploader({
  value,
  onChange,
}: {
  value: ReviewMedia[];
  onChange: (media: ReviewMedia[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_FILES - value.length;
    if (room <= 0) {
      toast.error(`You can attach up to ${MAX_FILES} files.`);
      return;
    }
    const chosen = Array.from(files).slice(0, room);

    setUploading(true);
    const uploaded: ReviewMedia[] = [];
    for (const file of chosen) {
      try {
        const { url, type } = await uploadToCloudinary(file, {
          folder: "ibc/reviews",
        });
        uploaded.push({ url, type });
      } catch (e) {
        toast.error(
          e instanceof UploadError ? e.message : "Could not upload a file.",
        );
      }
    }
    if (uploaded.length) onChange([...value, ...uploaded]);
    setUploading(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        {value.map((m, i) => (
          <div key={i} className="relative">
            <MediaThumb media={m} size="sm" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              aria-label="Remove"
              className="absolute -right-1.5 -top-1.5 rounded-full bg-ink-900 p-0.5 text-white shadow transition hover:bg-danger-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {value.length < MAX_FILES && (
          <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-300 text-ink-400 transition hover:border-brand-400 hover:text-brand-600">
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
            <span className="text-[10px] font-medium">Add</span>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-400">
        Add photos or videos ({MAX_FILES} max — up to {MAX_IMAGE_MB} MB per photo,{" "}
        {MAX_VIDEO_MB} MB per video).
      </p>
    </div>
  );
}
