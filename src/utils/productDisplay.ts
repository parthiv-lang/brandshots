import type { ProductRecord } from '../services/products';

export function isProductPending(product: ProductRecord): boolean {
  const category = product.analysis?.category?.trim();
  const productType = product.analysis?.productType?.trim();

  return !category && !productType;
}

export function getAngleImageUrls(angleImages: unknown): string[] {
  if (!Array.isArray(angleImages)) {
    return [];
  }

  return angleImages
    .map(entry => {
      if (typeof entry === 'string') {
        return entry;
      }

      if (entry && typeof entry === 'object' && 'url' in entry) {
        const url = (entry as { url?: unknown }).url;
        return typeof url === 'string' ? url : null;
      }

      return null;
    })
    .filter((url): url is string => Boolean(url?.trim()));
}

export function formatJustUploaded(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'just uploaded';
  }

  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (diffSec < 60) {
    return `just uploaded · ${diffSec}s`;
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `just uploaded · ${diffMin}m`;
  }

  const diffHours = Math.floor(diffMin / 60);
  return `just uploaded · ${diffHours}h`;
}

export function getProductDetails(product: ProductRecord): string {
  const parts: string[] = [];

  const materials = product.analysis?.materials?.trim();
  if (materials) {
    parts.push(materials);
  }

  const colors = product.analysis?.dominantColors?.filter(Boolean);
  if (colors?.length) {
    parts.push(colors.join(', '));
  }

  return parts.join(' · ');
}
