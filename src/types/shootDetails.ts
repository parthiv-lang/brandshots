export type ShootType = 'product' | 'social' | 'ad';

export type PhysicalDimensionUnit = 'cm' | 'in' | 'mm';

export type PhysicalDimensions = {
  width: number;
  height: number;
  depth?: number;
  unit?: PhysicalDimensionUnit;
};

export type ProductShootDetails = {
  useBrandKit?: boolean;
  brandId?: string;
  styleReferenceUri?: string;
  backgroundReferenceUri?: string;
  physicalDimensions?: PhysicalDimensions;
};

export type AudienceStage = 'cold' | 'warm' | 'hot' | 'existing_customer';

export type CreativeTone =
  | 'premium'
  | 'bold'
  | 'friendly'
  | 'urgent'
  | 'emotional';

export type CampaignGoal =
  | 'awareness'
  | 'traffic'
  | 'engagement'
  | 'leads'
  | 'sales'
  | 'app_installs'
  | 'retargeting'
  | 'brand_lift';

export type AdCta =
  | 'auto'
  | 'Shop Now'
  | 'Learn More'
  | 'Sign Up'
  | 'Download'
  | 'Book Now'
  | 'Get Offer'
  | 'Subscribe'
  | 'Contact Us';

export type SocialAdShootDetails = {
  useBrandKit?: boolean;
  brandId?: string;
  targetAudience?: string;
  stage?: AudienceStage;
  tone?: CreativeTone;
  offer?: string;
  cta?: AdCta;
  socialProof?: string;
  campaignGoal?: CampaignGoal;
};

export const CAMPAIGN_GOAL_OPTIONS: Array<{ id: CampaignGoal; label: string }> = [
  { id: 'awareness', label: 'Awareness' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'engagement', label: 'Engagement' },
  { id: 'leads', label: 'Leads' },
  { id: 'sales', label: 'Sales' },
  { id: 'app_installs', label: 'App installs' },
  { id: 'retargeting', label: 'Retargeting' },
  { id: 'brand_lift', label: 'Brand lift' },
];

export const AD_CTA_OPTIONS: Array<{ id: AdCta; label: string }> = [
  { id: 'auto', label: 'Auto-select' },
  { id: 'Shop Now', label: 'Shop Now' },
  { id: 'Learn More', label: 'Learn More' },
  { id: 'Sign Up', label: 'Sign Up' },
  { id: 'Download', label: 'Download' },
  { id: 'Book Now', label: 'Book Now' },
  { id: 'Get Offer', label: 'Get Offer' },
  { id: 'Subscribe', label: 'Subscribe' },
  { id: 'Contact Us', label: 'Contact Us' },
];

export const AUDIENCE_STAGE_OPTIONS: Array<{ id: AudienceStage; label: string }> = [
  { id: 'cold', label: 'Cold' },
  { id: 'warm', label: 'Warm' },
  { id: 'hot', label: 'Hot' },
  { id: 'existing_customer', label: 'Existing' },
];

export const AD_TONE_OPTIONS: Array<{ id: CreativeTone; label: string }> = [
  { id: 'premium', label: 'Premium' },
  { id: 'bold', label: 'Bold' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'emotional', label: 'Emotional' },
];

export const EMPTY_PRODUCT_SHOOT_DETAILS: ProductShootDetails = {};

export const EMPTY_SOCIAL_AD_SHOOT_DETAILS: SocialAdShootDetails = {
  useBrandKit: true,
};

export function getDetailsSummaryPreview(
  shootType: ShootType,
  brandTitle?: string,
): string {
  const brandPart = brandTitle ?? 'Brand';
  if (shootType === 'ad') {
    return `${brandPart} · audience · tone · CTA · campaign goal`;
  }
  return `${brandPart} · Reference images · product dimensions`;
}
