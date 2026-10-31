import { useEffect, useState } from 'react';

import { endpoints } from '../api/endpoints';
import { http } from '../api/http';

export type ImageQuality = 'low' | 'medium' | 'high';
export type ImageSize = '1K' | '2K' | '4K';
export type CreateQualityId = 'std' | 'hd' | 'ultra';

export type CreditPricing = {
  quality: Record<ImageQuality, number>;
  size: Record<ImageSize, number>;
  jewelry: Record<ImageSize, number>;
  jewelryRefine: number;
};

export const CREATE_QUALITY_RATES: Record<
  CreateQualityId,
  { quality: ImageQuality; size: ImageSize; fallbackCredits: number }
> = {
  std: { quality: 'low', size: '1K', fallbackCredits: 1 },
  hd: { quality: 'medium', size: '2K', fallbackCredits: 2 },
  ultra: { quality: 'high', size: '4K', fallbackCredits: 5 },
};

export const REFINE_QUALITY_FALLBACK: Record<ImageQuality, number> = {
  low: 1,
  medium: 2,
  high: 4,
};

export const JEWELLERY_SIZE_FALLBACK: Record<ImageSize, number> = {
  '1K': 1,
  '2K': 2,
  '4K': 5,
};

export const JEWELLERY_REFINE_FALLBACK = 5;

const IMAGE_QUALITIES: ImageQuality[] = ['low', 'medium', 'high'];
const IMAGE_SIZES: ImageSize[] = ['1K', '2K', '4K'];

function isPositiveNumberMap<Key extends string>(
  value: unknown,
  keys: readonly Key[],
): value is Record<Key, number> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return keys.every(key => typeof record[key] === 'number' && Number.isFinite(record[key]));
}

export function isCreditPricing(value: unknown): value is CreditPricing {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<CreditPricing>;
  return (
    isPositiveNumberMap(record.quality, IMAGE_QUALITIES) &&
    isPositiveNumberMap(record.size, IMAGE_SIZES) &&
    isPositiveNumberMap(record.jewelry, IMAGE_SIZES) &&
    typeof record.jewelryRefine === 'number' &&
    Number.isFinite(record.jewelryRefine)
  );
}

export function isImageSize(value: string | null | undefined): value is ImageSize {
  return value === '1K' || value === '2K' || value === '4K';
}

export function createShotCredits(
  pricing: CreditPricing | null,
  qualityId: CreateQualityId,
  isJewellery: boolean,
): number {
  const rate = CREATE_QUALITY_RATES[qualityId];
  if (!pricing) {
    return isJewellery ? JEWELLERY_SIZE_FALLBACK[rate.size] : rate.fallbackCredits;
  }

  if (isJewellery) {
    return pricing.jewelry[rate.size];
  }

  return pricing.quality[rate.quality] * pricing.size[rate.size];
}

export function refineShotCredits(
  pricing: CreditPricing | null,
  quality: ImageQuality,
  imageSize: string | null | undefined,
  isJewellery: boolean,
): number {
  if (isJewellery) {
    return pricing?.jewelryRefine ?? JEWELLERY_REFINE_FALLBACK;
  }

  if (!pricing || !isImageSize(imageSize)) {
    return REFINE_QUALITY_FALLBACK[quality];
  }

  return pricing.quality[quality] * pricing.size[imageSize];
}

export function jewellerySizeCredits(
  pricing: CreditPricing | null,
  size: ImageSize,
): number {
  return pricing?.jewelry[size] ?? JEWELLERY_SIZE_FALLBACK[size];
}

export function useCreditPricing(): CreditPricing | null {
  const [pricing, setPricing] = useState<CreditPricing | null>(null);

  useEffect(() => {
    let cancelled = false;

    http
      .get<unknown>(endpoints.credits.pricing)
      .then(value => {
        if (!cancelled && isCreditPricing(value)) {
          setPricing(value);
        }
      })
      .catch(() => {
        // Keep the on-screen defaults when the rate card cannot be loaded.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return pricing;
}
