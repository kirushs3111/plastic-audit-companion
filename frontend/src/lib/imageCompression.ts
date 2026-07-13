const MAX_DIMENSION_PX = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Resizes and re-encodes an image file entirely in the browser before it's
 * uploaded. Modern phone cameras routinely produce 10-30MB photos - on a
 * lower-RAM device, reading a file that large into memory (for the canvas
 * draw, then again for the network request body) can genuinely exhaust
 * available memory and crash or silently fail. Downscaling to a sane
 * maximum dimension and re-encoding as JPEG typically cuts file size by
 * 80-95% with no meaningful loss for the purpose (identifying a plastic
 * item), long before the original ever needs to be fully held in memory.
 *
 * Falls back to the original file if compression fails for any reason
 * (unsupported format, canvas errors, etc.) rather than blocking the
 * upload entirely - a slightly-too-large photo is better than no photo.
 */
export async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);

    const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height));
    const targetWidth = Math.round(bitmap.width * scale);
    const targetHeight = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
    );
    if (!blob) return file;

    // Only use the compressed version if it's actually smaller - a tiny
    // source image could theoretically grow slightly after re-encoding.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
