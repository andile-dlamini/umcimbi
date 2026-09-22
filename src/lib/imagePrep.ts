/**
 * Prepares an image file for upload:
 *  - converts iPhone HEIC/HEIF photos to JPEG (browsers cannot display HEIC)
 *  - downscales very large photos so uploads don't time out on mobile data
 * Returns the original file if no processing is needed or if processing fails.
 */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

function isHeic(file: File) {
  const name = file.name.toLowerCase();
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

function renameToJpg(name: string) {
  return name.replace(/\.[^.]+$/, '') + '.jpg';
}

async function loadBitmap(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    return await createImageBitmap(blob);
  }
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

async function downscaleToJpeg(blob: Blob, fileName: string): Promise<File | null> {
  const bitmap = await loadBitmap(blob);
  const width = 'width' in bitmap ? bitmap.width : 0;
  const height = 'height' in bitmap ? bitmap.height : 0;
  if (!width || !height) return null;

  const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  const out = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );
  if (!out) return null;
  return new File([out], renameToJpg(fileName), { type: 'image/jpeg' });
}

export async function prepareImageForUpload(file: File): Promise<File> {
  try {
    if (isHeic(file)) {
      const heic2any = (await import('heic2any')).default;
      const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: JPEG_QUALITY });
      const blob = Array.isArray(converted) ? converted[0] : converted;
      const jpegFile = new File([blob as Blob], renameToJpg(file.name), { type: 'image/jpeg' });
      return (await downscaleToJpeg(jpegFile, file.name)) ?? jpegFile;
    }

    // Only re-encode larger photos; small images and GIFs/SVGs pass through untouched.
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
      return file;
    }
    if (file.size <= 1_000_000) return file;

    return (await downscaleToJpeg(file, file.name)) ?? file;
  } catch (err) {
    console.error('Image preparation failed, uploading original:', err);
    return file;
  }
}

export async function prepareImagesForUpload(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) out.push(await prepareImageForUpload(f));
  return out;
}
