import type { PhotoDraft } from '../domain/types';

const MAX_INPUT_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_STORED_IMAGE_BYTES = 2.5 * 1024 * 1024;
export const MAX_DEFECT_PHOTO_BYTES = 8 * 1024 * 1024;

export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

export function getPhotoDraftBytes(photo: PhotoDraft): number {
  return estimateDataUrlBytes(photo.dataUrl);
}

export function assertPhotoStorageBudget(photos: PhotoDraft[]): void {
  const totalBytes = photos.reduce((sum, photo) => sum + getPhotoDraftBytes(photo), 0);
  if (totalBytes > MAX_DEFECT_PHOTO_BYTES) {
    throw new Error('נפח התמונות לליקוי גדול מדי. יש להסיר תמונות או לבחור תמונות קטנות יותר.');
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('לא ניתן לקרוא את התמונה.'));
    image.src = dataUrl;
  });
}

export async function imageFileToPhotoDraft(file: File, maxSize = 1280): Promise<PhotoDraft> {
  if (file.size > MAX_INPUT_IMAGE_BYTES) {
    throw new Error('התמונה גדולה מדי לשמירה מקומית. יש לבחור תמונה קטנה יותר.');
  }

  const originalDataUrl = await readFileAsDataUrl(file);

  if (!file.type.startsWith('image/') || typeof document === 'undefined') {
    return {
      dataUrl: originalDataUrl,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream'
    };
  }

  try {
    const image = await loadImage(originalDataUrl);
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    if (scale === 1 && file.size < 500_000) {
      return {
        dataUrl: originalDataUrl,
        fileName: file.name,
        mimeType: file.type,
        width,
        height
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('לא ניתן להכין תצוגת תמונה.');
    }

    context.drawImage(image, 0, 0, width, height);
    let compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
    if (estimateDataUrlBytes(compressedDataUrl) > MAX_STORED_IMAGE_BYTES) {
      compressedDataUrl = canvas.toDataURL('image/jpeg', 0.65);
    }

    if (estimateDataUrlBytes(compressedDataUrl) > MAX_STORED_IMAGE_BYTES) {
      throw new Error('התמונה עדיין גדולה מדי לאחר הקטנה. יש לבחור תמונה קטנה יותר.');
    }

    return {
      dataUrl: compressedDataUrl,
      fileName: file.name,
      mimeType: 'image/jpeg',
      width,
      height
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('גדולה מדי')) {
      throw error;
    }

    if (estimateDataUrlBytes(originalDataUrl) > MAX_STORED_IMAGE_BYTES) {
      throw new Error('התמונה גדולה מדי לשמירה מקומית. יש לבחור תמונה קטנה יותר.');
    }

    return {
      dataUrl: originalDataUrl,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream'
    };
  }
}
