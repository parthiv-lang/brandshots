import type { ProductAnalysis } from '../services/products/types';
import type {
  ProductShootDetails,
  ShootType,
  SocialAdShootDetails,
} from './shootDetails';

export type AssetType = 'PRODUCT_SHOOT' | 'SOCIAL_POSTER' | 'ADS_CREATIVE';

export type VariantCount = 1 | 2 | 3;

export type BriefAspectRatio = '1:1' | '4:5' | '9:16' | '16:9';

export type GenerateQualityId = 'std' | 'hd' | 'ultra';

export type CreativeBrief = {
  asset_type: AssetType;
  preset_id: string;
  platform_id: string;
  variant_count: VariantCount;

  goal?: string;
  audience?: string;
  audience_stage?: string;
  tone?: string;
  headline?: string;
  subtext?: string;
  offer?: string;
  cta?: string;
  main_benefit?: string;
  product_name?: string;
  pain_point?: string;
  proof?: string;
  brandName?: string;
  brand_color?: string;
  background_override?: string;
  lighting_override?: string;
  props_override?: string;
  camera_angle?: string;
  product_placement?: string;
  headline_placement?: string;
  cta_placement?: string;
  custom_instruction?: string;
  customDimensions?: {
    width: number;
    height: number;
    aspectRatio?: BriefAspectRatio;
  };
  physicalDimensions?: {
    width: number;
    height: number;
    depth?: number;
    unit?: 'cm' | 'in' | 'mm';
  };
  jewelrySubtype?: string;
  jewelryPieceCount?: number;
  jewelryWorkflow?: 'preset' | 'reference';
};

export type GenerateSetupInput = {
  shootType: ShootType;
  productId: string;
  presetId: string;
  platformId: string;
  isCustomPlatform: boolean;
  customDimensions?: {
    width: number;
    height: number;
    aspectRatio?: string;
  };
  variantCount: VariantCount;
  quality: GenerateQualityId;
  notes?: string;
  productShootDetails: ProductShootDetails;
  socialAdDetails: SocialAdShootDetails;
  analysis: ProductAnalysis;
  brandId?: string;
  textMode?: string;
  batchId: string;
  jewelryWorkflow?: 'preset' | 'reference';
  jewelrySubtype?: string;
  jewelryPieceCount?: number;
};

export type { BatchResponse } from '../services/generations/types';
