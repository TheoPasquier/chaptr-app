/**
 * Les images sont stockées en data URL dans la sauvegarde. On les réduit
 * avant pour garder des fichiers légers : une couverture n'a pas besoin de
 * dépasser ~360 px de haut pour être nette dans l'application.
 */

export const COVER_MAX = 480; // plus grand côté, en px
export const BANNER_MAX = 1200;

export function isDataUrl(src: string): boolean {
  return src.startsWith("data:");
}

export function isHttpUrl(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image illisible"));
    img.src = src;
  });
}

async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Lecture impossible"));
    r.readAsDataURL(blob);
  });
}

/** Réduit une image (fichier ou blob) et renvoie une data URL JPEG. */
export async function shrinkImage(blob: Blob, max: number): Promise<string> {
  const original = await blobToDataUrl(blob);
  let img: HTMLImageElement;
  try {
    img = await loadImage(original);
  } catch {
    return original;
  }
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && blob.size < 150_000) return original;

  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return original;
  // Fond blanc : les PNG transparents deviennent du JPEG opaque.
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.84);
}

/**
 * Tente de rapatrier une image distante en local (pour que la page marche
 * hors connexion). Si le serveur refuse (CORS), on garde l'URL telle quelle.
 */
export async function localizeUrl(url: string, max: number): Promise<{ src: string; local: boolean }> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) throw new Error();
    return { src: await shrinkImage(blob, max), local: true };
  } catch {
    return { src: url, local: false };
  }
}
