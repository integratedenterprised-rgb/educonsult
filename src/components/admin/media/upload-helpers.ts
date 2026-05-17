import type { Media } from "@prisma/client";

/**
 * Two-phase upload:
 *   1) Ask backend for a presigned PUT URL.
 *   2) PUT the bytes directly to S3, watching progress.
 *   3) POST the metadata to register the row.
 */
export async function uploadFile(
  file: File,
  folder: string | undefined,
  onProgress?: (pct: number) => void,
): Promise<Media> {
  const presignRes = await fetch("/api/admin/media/presign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type, folder }),
  });
  const presignJson = await presignRes.json();
  if (!presignJson.ok) throw new Error(presignJson.error?.message ?? "Presign failed");
  const { key, uploadUrl } = presignJson.data as { key: string; uploadUrl: string };

  await xhrPut(uploadUrl, file, onProgress);

  let width: number | undefined;
  let height: number | undefined;
  if (file.type.startsWith("image/")) {
    const dims = await readImageDimensions(file).catch(() => null);
    if (dims) { width = dims.width; height = dims.height; }
  }

  const recordRes = await fetch("/api/admin/media", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      key,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      width, height, folder,
    }),
  });
  const recordJson = await recordRes.json();
  if (!recordJson.ok) throw new Error(recordJson.error?.message ?? "Record failed");
  return recordJson.data as Media;
}

function xhrPut(url: string, file: File, onProgress?: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(file);
  });
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Could not read image"));
    img.src = URL.createObjectURL(file);
  });
}
