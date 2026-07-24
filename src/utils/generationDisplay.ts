import type { ShootResultsParams } from '../navigation/types';
import type {
  BatchGeneration,
  GenerationCopy,
  PublicGeneration,
  RefineGenerationResponse,
} from '../services/generations/types';

function toNullableString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function refineResponseToBatchGeneration(
  generation: RefineGenerationResponse,
): BatchGeneration {
  return {
    id: generation.id,
    createdAt: generation.createdAt,
    imageUrl: generation.imageUrl,
    imageSize: generation.imageSize,
    aspectRatio: generation.aspectRatio,
    width: generation.width,
    height: generation.height,
    mode: generation.mode,
    platformId: toNullableString(generation.platformId),
    platformLabel: toNullableString(generation.platformLabel),
    platform: toNullableString(generation.platform),
    nicheId: toNullableString(generation.nicheId),
    nicheLabel: toNullableString(generation.nicheLabel),
    vibeId: toNullableString(generation.vibeId),
    vibeLabel: toNullableString(generation.vibeLabel),
    brandTitle: toNullableString(generation.brandTitle),
    brandDescription: toNullableString(generation.brandDescription),
    brandWebsite: toNullableString(generation.brandWebsite),
    headline: toNullableString(generation.headline),
    cta: toNullableString(generation.cta),
    categoryId: generation.categoryId,
    categoryLabel: generation.categoryLabel,
    lookId: generation.lookId,
    lookLabel: generation.lookLabel,
    treatmentId: generation.treatmentId,
    treatmentLabel: generation.treatmentLabel,
    audience: generation.audience,
    offer: generation.offer,
    copy: generation.copy,
    productId: generation.productId,
    parentGenerationId: generation.parentGenerationId,
    refineFeedback: generation.refineFeedback,
    creditsUsed: generation.creditsUsed,
    prompt: generation.prompt,
    favorite: generation.favorite,
  };
}

export function publicGenerationToBatchGeneration(
  generation: PublicGeneration,
): BatchGeneration {
  return {
    id: generation.id,
    createdAt: generation.createdAt,
    imageUrl: generation.imageUrl,
    imageSize: generation.imageSize,
    aspectRatio: generation.aspectRatio,
    width: generation.width,
    height: generation.height,
    mode: generation.mode,
    platformId: toNullableString(generation.platformId),
    platformLabel: toNullableString(generation.platformLabel),
    platform: toNullableString(generation.platform),
    nicheId: toNullableString(generation.nicheId),
    nicheLabel: toNullableString(generation.nicheLabel),
    vibeId: toNullableString(generation.vibeId),
    vibeLabel: toNullableString(generation.vibeLabel),
    brandTitle: toNullableString(generation.brandTitle),
    brandDescription: toNullableString(generation.brandDescription),
    brandWebsite: toNullableString(generation.brandWebsite),
    headline: toNullableString(generation.headline),
    cta: toNullableString(generation.cta),
    categoryId: generation.categoryId,
    categoryLabel: generation.categoryLabel,
    lookId: generation.lookId,
    lookLabel: generation.lookLabel,
    treatmentId: generation.treatmentId,
    treatmentLabel: generation.treatmentLabel,
    audience: generation.audience,
    offer: generation.offer,
    copy: generation.copy,
    productId: generation.productId,
    parentGenerationId: generation.parentGenerationId,
    refineFeedback: generation.refineFeedback,
    creditsUsed: generation.creditsUsed,
    prompt: generation.prompt,
    favorite: false,
  };
}

export function buildShootResultsParamsFromGeneration(
  generation: PublicGeneration,
): ShootResultsParams {
  const productName =
    generation.headline?.trim() ||
    generation.brandTitle?.trim() ||
    generation.nicheLabel?.trim() ||
    'Creative';

  const presetName =
    generation.lookLabel?.trim() ||
    generation.treatmentLabel?.trim() ||
    generation.categoryLabel?.trim() ||
    undefined;

  return {
    productName,
    presetName,
    imageUrl: generation.imageUrl,
    response: {
      batchId: generation.id,
      results: [
        {
          ok: true,
          variantIndex: 0,
          generation: publicGenerationToBatchGeneration(generation),
        },
      ],
    },
  };
}

export type CopyField = {
  id: string;
  label: string;
  value: string;
};

const FLAT_COPY_FIELDS: Array<{
  id: string;
  label: string;
  key: keyof BatchGeneration;
}> = [
  { id: 'headline', label: 'Headline', key: 'headline' },
  { id: 'cta', label: 'Call to action', key: 'cta' },
  { id: 'offer', label: 'Offer', key: 'offer' },
  { id: 'audience', label: 'Audience', key: 'audience' },
  { id: 'brandTitle', label: 'Brand', key: 'brandTitle' },
  { id: 'brandDescription', label: 'Brand description', key: 'brandDescription' },
  { id: 'categoryLabel', label: 'Category', key: 'categoryLabel' },
  { id: 'lookLabel', label: 'Look', key: 'lookLabel' },
  { id: 'treatmentLabel', label: 'Treatment', key: 'treatmentLabel' },
  { id: 'nicheLabel', label: 'Niche', key: 'nicheLabel' },
  { id: 'vibeLabel', label: 'Vibe', key: 'vibeLabel' },
  { id: 'platformLabel', label: 'Platform', key: 'platformLabel' },
];

export function normalizeGenerationCopy(
  copy: string | GenerationCopy | null | undefined,
): GenerationCopy | null {
  if (copy == null) {
    return null;
  }

  if (typeof copy === 'string') {
    const trimmed = copy.trim();
    return trimmed ? { caption: trimmed } : null;
  }

  const hasContent =
    copy.caption?.trim() ||
    copy.shortTitle?.trim() ||
    copy.longTitle?.trim() ||
    copy.ctaText?.trim() ||
    copy.altText?.trim() ||
    (copy.hashtags?.length ?? 0) > 0;

  return hasContent ? copy : null;
}

function appendStructuredCopyFields(
  fields: CopyField[],
  copy: GenerationCopy,
): void {
  const seen = new Set(fields.map(field => field.id));

  const add = (id: string, label: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed || seen.has(id)) {
      return;
    }

    seen.add(id);
    fields.push({ id, label, value: trimmed });
  };

  if (copy.caption?.trim()) {
    add('caption', 'Caption', copy.caption);
  }

  if (copy.shortTitle?.trim()) {
    add('shortTitle', 'Short title', copy.shortTitle);
  }

  if (copy.longTitle?.trim()) {
    add('longTitle', 'Long title', copy.longTitle);
  }

  if (copy.ctaText?.trim()) {
    add('ctaText', 'CTA text', copy.ctaText);
  }

  if (copy.altText?.trim()) {
    add('altText', 'Alt text', copy.altText);
  }

  if (copy.hashtags?.length) {
    const tags = copy.hashtags
      .map(tag => tag.trim())
      .filter(Boolean)
      .map(tag => (tag.startsWith('#') ? tag : `#${tag}`))
      .join(' ');

    if (tags) {
      add('hashtags', 'Hashtags', tags);
    }
  }
}

export function getGenerationCopyFields(
  generation: BatchGeneration,
  batchCopy?: GenerationCopy | null,
): CopyField[] {
  const fields: CopyField[] = [];

  for (const field of FLAT_COPY_FIELDS) {
    const raw = generation[field.key];
    if (typeof raw !== 'string') {
      continue;
    }

    const value = raw.trim();
    if (!value) {
      continue;
    }

    fields.push({ id: field.id, label: field.label, value });
  }

  const structured =
    normalizeGenerationCopy(generation.copy) ??
    normalizeGenerationCopy(batchCopy);

  if (structured) {
    appendStructuredCopyFields(fields, structured);
  }

  return fields;
}

export function formatGenerationMode(mode: string): string {
  const normalized = mode.trim().toLowerCase();

  if (normalized === 'product-shoot' || normalized === 'product_shoot') {
    return 'Product shoot';
  }
  if (
    normalized === 'social' ||
    normalized === 'social-poster' ||
    normalized === 'social_poster'
  ) {
    return 'Social post';
  }
  if (normalized === 'ads-creative' || normalized === 'ads_creative') {
    return 'Ad creative';
  }

  return mode
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());
}

export function isProductShootMode(mode: string): boolean {
  const normalized = mode.trim().toLowerCase();
  return normalized === 'product-shoot' || normalized === 'product_shoot';
}

export function getGenerationStyleBadge(generation: BatchGeneration): string | null {
  return (
    generation.lookLabel?.trim() ||
    generation.treatmentLabel?.trim() ||
    generation.categoryLabel?.trim() ||
    null
  );
}
