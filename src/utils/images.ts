import type { PhotoDraft } from '../domain/types';

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
    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

    return {
      dataUrl: compressedDataUrl,
      fileName: file.name,
      mimeType: 'image/jpeg',
      width,
      height
    };
  } catch {
    return {
      dataUrl: originalDataUrl,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream'
    };
  }
}
