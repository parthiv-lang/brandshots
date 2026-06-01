import { getPlatformSpecById } from '../../constants/platformSpecs';
import type {
  BriefAspectRatio,
  CreativeBrief,
  GenerateQualityId,
  GenerateSetupInput,
} from '../../types/creativeBrief';
import type { ShootType, SocialAdShootDetails } from '../../types/shootDetails';

const DEFAULT_SOCIAL_PRESET_ID = 'product_highlight';
const DEFAULT_SOCIAL_PLATFORM_ID = 'instagram_square';
const DEFAULT_AD_PRESET_ID = 'brand_awareness';
const DEFAULT_AD_PLATFORM_ID = 'meta_feed_ad';

const QUALITY_SETTINGS: Record<
  GenerateQualityId,
  { imageQuality: string; imageSize: string }
> = {
  std: { imageQuality: 'low', imageSize: '1K' },
  hd: { imageQuality: 'medium', imageSize: '2K' },
  ultra: { imageQuality: 'high', imageSize: '4K' },
};

export function shootTypeToAssetType(shootType: ShootType) {
  switch (shootType) {
    case 'product':
      return 'PRODUCT_SHOOT' as const;
    case 'social':
      return 'SOCIAL_POSTER' as const;
    case 'ad':
      return 'ADS_CREATIVE' as const;
  }
}

export function assetTypeToMode(assetType: CreativeBrief['asset_type']) {
  switch (assetType) {
    case 'PRODUCT_SHOOT':
      return 'product-shoot';
    case 'ADS_CREATIVE':
      return 'ads';
    case 'SOCIAL_POSTER':
    default:
      return 'social';
  }
}

export function getDefaultPresetIdForShootType(shootType: ShootType) {
  switch (shootType) {
    case 'social':
      return DEFAULT_SOCIAL_PRESET_ID;
    case 'ad':
      return DEFAULT_AD_PRESET_ID;
    case 'product':
    default:
      return 'minimal_studio';
  }
}

export function getDefaultPlatformIdForShootType(shootType: ShootType) {
  switch (shootType) {
    case 'social':
      return DEFAULT_SOCIAL_PLATFORM_ID;
    case 'ad':
      return DEFAULT_AD_PLATFORM_ID;
    case 'product':
    default:
      return 'catalog_square';
  }
}

export function createBatchId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, marker => {
    const random = Math.floor(Math.random() * 16);
    const value = marker === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function normalizeAspectRatio(value?: string): BriefAspectRatio | undefined {
  if (value === '1:1' || value === '4:5' || value === '9:16' || value === '16:9') {
    return value;
  }

  return undefined;
}

function appendImageField(
  formData: FormData,
  fieldName: string,
  imageUri: string,
  fileName?: string,
) {
  const resolvedFileName =
    fileName ||
    imageUri.split('/').pop()?.split('?')[0] ||
    `${fieldName}.jpg`;

  const ext = resolvedFileName.split('.').pop()?.toLowerCase();
  const mimeType =
    ext === 'png'
      ? 'image/png'
      : ext === 'webp'
        ? 'image/webp'
        : ext === 'heic'
          ? 'image/heic'
          : 'image/jpeg';

  formData.append(fieldName, {
    uri: imageUri,
    name: resolvedFileName,
    type: mimeType,
  } as unknown as Blob);
}

function applySocialAdDetails(
  brief: CreativeBrief,
  details: SocialAdShootDetails,
  shootType: ShootType,
) {
  if (shootType === 'product') {
    return;
  }

  if (details.targetAudience?.trim()) {
    brief.audience = details.targetAudience.trim();
  }

  if (details.stage) {
    brief.audience_stage = details.stage;
  }

  if (details.tone) {
    brief.tone = details.tone;
  }

  if (details.offer?.trim()) {
    brief.offer = details.offer.trim();
  }

  if (details.cta && details.cta !== 'auto') {
    brief.cta = details.cta;
  }

  if (details.socialProof?.trim()) {
    brief.proof = details.socialProof.trim();
  }

  if (details.campaignGoal) {
    brief.goal = details.campaignGoal;
  }
}

function applyProductShootDetails(brief: CreativeBrief, input: GenerateSetupInput) {
  const { productShootDetails, notes } = input;
  const physical = productShootDetails.physicalDimensions;

  if (physical && physical.width > 0 && physical.height > 0) {
    brief.physicalDimensions = {
      width: physical.width,
      height: physical.height,
      ...(physical.depth && physical.depth > 0 ? { depth: physical.depth } : {}),
      unit: physical.unit ?? 'cm',
    };
  }

  if (notes?.trim()) {
    brief.custom_instruction = notes.trim();
  }
}

export function buildCreativeBrief(input: GenerateSetupInput): CreativeBrief {
  const assetType = shootTypeToAssetType(input.shootType);
  const platformId = input.isCustomPlatform ? 'custom' : input.platformId;

  const brief: CreativeBrief = {
    asset_type: assetType,
    preset_id: input.presetId,
    platform_id: platformId,
    variant_count: input.variantCount,
  };

  if (input.isCustomPlatform && input.customDimensions) {
    brief.customDimensions = {
      width: input.customDimensions.width,
      height: input.customDimensions.height,
      aspectRatio: normalizeAspectRatio(input.customDimensions.aspectRatio),
    };
  }

  applyProductShootDetails(brief, input);
  applySocialAdDetails(brief, input.socialAdDetails, input.shootType);

  return brief;
}

export function resolveAspectRatioForBrief(brief: CreativeBrief) {
  if (brief.platform_id === 'custom' && brief.customDimensions?.aspectRatio) {
    return brief.customDimensions.aspectRatio;
  }

  if (brief.platform_id === 'custom' && brief.customDimensions) {
    const { width, height } = brief.customDimensions;
    const ratio = width / height;
    const candidates: Array<{ label: BriefAspectRatio; value: number }> = [
      { label: '1:1', value: 1 },
      { label: '4:5', value: 4 / 5 },
      { label: '9:16', value: 9 / 16 },
      { label: '16:9', value: 16 / 9 },
    ];
    let closest = candidates[0];
    for (const item of candidates) {
      if (Math.abs(ratio - item.value) < Math.abs(ratio - closest.value)) {
        closest = item;
      }
    }
    return closest.label;
  }

  return getPlatformSpecById(brief.platform_id)?.aspectRatio ?? '1:1';
}

export function buildGenerateFormData(input: GenerateSetupInput): FormData {
  const brief = buildCreativeBrief(input);
  const qualitySettings = QUALITY_SETTINGS[input.quality];
  const formData = new FormData();

  formData.append('productId', input.productId);

  if (input.productShootDetails.styleReferenceUri) {
    appendImageField(
      formData,
      'referenceImages',
      input.productShootDetails.styleReferenceUri,
    );
  }

  if (input.productShootDetails.backgroundReferenceUri) {
    appendImageField(
      formData,
      'backgroundImage',
      input.productShootDetails.backgroundReferenceUri,
    );
  }

  if (input.brandId) {
    formData.append('brandId', input.brandId);
  }

  formData.append('briefJson', JSON.stringify(brief));
  formData.append('analysisJson', JSON.stringify(input.analysis));
  formData.append('textMode', input.textMode ?? 'full_image');
  formData.append('batchId', input.batchId);
  formData.append('totalVariants', String(input.variantCount));
  formData.append('variantIndex', '0');
  formData.append('imageSize', qualitySettings.imageSize);
  formData.append('imageQuality', qualitySettings.imageQuality);
  formData.append('aspectRatio', resolveAspectRatioForBrief(brief));
  formData.append('mode', assetTypeToMode(brief.asset_type));
  formData.append('prompt', '[server-composed]');

  return formData;
}

export function buildGenerateSetupFromScreenState(input: {
  shootType: ShootType;
  productId: string;
  selectedPresetId: string;
  selectedSizeId: string;
  isCustomPlatform: boolean;
  customWidth: number;
  customHeight: number;
  snapAspectRatio: string;
  quantity: number;
  quality: GenerateQualityId;
  notes: string;
  productShootDetails: GenerateSetupInput['productShootDetails'];
  socialAdDetails: SocialAdShootDetails;
  analysis: GenerateSetupInput['analysis'];
  brandId?: string;
  batchId?: string;
}): GenerateSetupInput {
  const presetId = input.selectedPresetId || getDefaultPresetIdForShootType(input.shootType);
  const platformId = input.isCustomPlatform
    ? 'custom'
    : input.selectedSizeId || getDefaultPlatformIdForShootType(input.shootType);

  return {
    shootType: input.shootType,
    productId: input.productId,
    presetId,
    platformId,
    isCustomPlatform: input.isCustomPlatform,
    customDimensions: input.isCustomPlatform
      ? {
          width: input.customWidth,
          height: input.customHeight,
          aspectRatio: input.snapAspectRatio,
        }
      : undefined,
    variantCount: Math.min(3, Math.max(1, input.quantity)) as GenerateSetupInput['variantCount'],
    quality: input.quality,
    notes: input.notes,
    productShootDetails: input.productShootDetails,
    socialAdDetails: input.socialAdDetails,
    analysis: input.analysis,
    brandId: input.brandId,
    batchId: input.batchId ?? createBatchId(),
  };
}
