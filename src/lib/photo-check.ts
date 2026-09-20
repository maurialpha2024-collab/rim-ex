export type PhotoWarnings = { blur: boolean; glare: boolean; small: boolean };

const NONE: PhotoWarnings = { blur: false, glare: false, small: false };

// Cheap in-browser checks on a passport photo. They only warn (never block): the photo
// stays on the device until the user submits it.
//  - blur:  low variance of the Laplacian on a downscaled greyscale copy
//  - glare: a large share of blown-out pixels
//  - small: low resolution
export async function analyzePhoto(file: File): Promise<PhotoWarnings> {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    const scale = Math.min(1, 320 / Math.max(width, height));
    const w = Math.max(3, Math.round(width * scale));
    const h = Math.max(3, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return NONE;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const { data } = ctx.getImageData(0, 0, w, h);

    const gray = new Float32Array(w * h);
    let bright = 0;
    for (let i = 0; i < w * h; i++) {
      const g = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
      gray[i] = g;
      if (g >= 245) bright++;
    }

    let sum = 0;
    let sumSq = 0;
    let n = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
        sum += lap;
        sumSq += lap * lap;
        n++;
      }
    }
    const variance = n ? sumSq / n - (sum / n) ** 2 : Infinity;

    return {
      blur: variance < 40,
      glare: bright / (w * h) > 0.07,
      small: Math.max(width, height) < 1000,
    };
  } catch {
    // Formats the browser can't decode (e.g. HEIC): skip the checks.
    return NONE;
  }
}
