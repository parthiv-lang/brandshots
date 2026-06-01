export type AssetType = 'SOCIAL_POSTER' | 'ADS_CREATIVE' | 'PRODUCT_SHOOT';

export type PlatformSpec = {
  id: string;
  label: string;
  platform: string;
  assetTypes: AssetType[];
  aspectRatio: string;
  exportWidth: number;
  exportHeight: number;
};

export type PlatformSpecOption = {
  key: string;
  label: string;
};

export const PLATFORM_SPECS: PlatformSpec[] = [
  /* --------------------------- Social surfaces --------------------------- */
  {
    id: 'instagram_square',
    label: 'Feed · square',
    platform: 'Instagram',
    assetTypes: ['SOCIAL_POSTER'],
    aspectRatio: '1:1',
    exportWidth: 1080,
    exportHeight: 1080,
  },
  {
    id: 'instagram_portrait',
    label: 'Feed · portrait',
    platform: 'Instagram',
    assetTypes: ['SOCIAL_POSTER'],
    aspectRatio: '4:5',
    exportWidth: 1080,
    exportHeight: 1350,
  },
  {
    id: 'instagram_story',
    label: 'Story / Reels',
    platform: 'Instagram',
    assetTypes: ['SOCIAL_POSTER', 'ADS_CREATIVE'],
    aspectRatio: '9:16',
    exportWidth: 1080,
    exportHeight: 1920,
  },
  {
    id: 'facebook_feed',
    label: 'Feed post',
    platform: 'Facebook',
    assetTypes: ['SOCIAL_POSTER'],
    aspectRatio: '1:1',
    exportWidth: 1080,
    exportHeight: 1080,
  },
  {
    id: 'linkedin_post',
    label: 'Feed post',
    platform: 'LinkedIn',
    assetTypes: ['SOCIAL_POSTER'],
    aspectRatio: '1:1',
    exportWidth: 1200,
    exportHeight: 1200,
  },
  {
    id: 'pinterest_pin',
    label: 'Pin',
    platform: 'Pinterest',
    assetTypes: ['SOCIAL_POSTER'],
    aspectRatio: '4:5',
    exportWidth: 1000,
    exportHeight: 1500,
  },

  /* ----------------------------- Ads surfaces --------------------------- */
  {
    id: 'meta_feed_ad',
    label: 'Feed',
    platform: 'Meta Ads',
    assetTypes: ['ADS_CREATIVE'],
    aspectRatio: '1:1',
    exportWidth: 1080,
    exportHeight: 1080,
  },
  {
    id: 'google_display',
    label: 'Display',
    platform: 'Google',
    assetTypes: ['ADS_CREATIVE'],
    aspectRatio: '16:9',
    exportWidth: 1200,
    exportHeight: 628,
  },
  {
    id: 'tiktok_ad',
    label: 'In-feed ad',
    platform: 'TikTok',
    assetTypes: ['ADS_CREATIVE'],
    aspectRatio: '9:16',
    exportWidth: 1080,
    exportHeight: 1920,
  },
  {
    id: 'website_hero',
    label: 'Hero banner',
    platform: 'Website',
    assetTypes: ['ADS_CREATIVE'],
    aspectRatio: '16:9',
    exportWidth: 1920,
    exportHeight: 1080,
  },

  /* ------------------------- Product-shoot surfaces --------------------- */
  {
    id: 'catalog_square',
    label: 'Square',
    platform: 'Catalog',
    assetTypes: ['PRODUCT_SHOOT'],
    aspectRatio: '1:1',
    exportWidth: 1500,
    exportHeight: 1500,
  },
  {
    id: 'catalog_portrait',
    label: 'Portrait',
    platform: 'Catalog',
    assetTypes: ['PRODUCT_SHOOT'],
    aspectRatio: '4:5',
    exportWidth: 1500,
    exportHeight: 1875,
  },
  {
    id: 'catalog_story',
    label: 'Story / vertical',
    platform: 'Catalog',
    assetTypes: ['PRODUCT_SHOOT'],
    aspectRatio: '9:16',
    exportWidth: 1080,
    exportHeight: 1920,
  },
  {
    id: 'catalog_landscape',
    label: 'Landscape / hero',
    platform: 'Catalog',
    assetTypes: ['PRODUCT_SHOOT'],
    aspectRatio: '16:9',
    exportWidth: 1920,
    exportHeight: 1080,
  },
];

export const SOCIAL_POSTER_SPECS: PlatformSpec[] = PLATFORM_SPECS.filter(spec =>
  spec.assetTypes.includes('SOCIAL_POSTER'),
);

export const ADS_CREATIVE_SPECS: PlatformSpec[] = PLATFORM_SPECS.filter(spec =>
  spec.assetTypes.includes('ADS_CREATIVE'),
);

export const PRODUCT_SHOOT_SPECS: PlatformSpec[] = PLATFORM_SPECS.filter(spec =>
  spec.assetTypes.includes('PRODUCT_SHOOT'),
);

export const SOCIAL_POSTER_PLATFORMS = [
  'Instagram',
  'Facebook',
  'LinkedIn',
  'Pinterest',
  'Custom',
] as const;

export const ADS_CREATIVE_PLATFORMS = [
  'Instagram',
  'Meta Ads',
  'Google',
  'TikTok',
  'Website',
  'Custom',
] as const;

export const PRODUCT_SHOOT_PLATFORMS = ['Catalog', 'Custom'] as const;

export type AssetTypePlatformData = {
  specs: PlatformSpec[];
  platforms: readonly string[];
};

export const ASSET_TYPE_PLATFORM_DATA: Record<AssetType, AssetTypePlatformData> =
  {
    SOCIAL_POSTER: {
      specs: SOCIAL_POSTER_SPECS,
      platforms: SOCIAL_POSTER_PLATFORMS,
    },
    ADS_CREATIVE: {
      specs: ADS_CREATIVE_SPECS,
      platforms: ADS_CREATIVE_PLATFORMS,
    },
    PRODUCT_SHOOT: {
      specs: PRODUCT_SHOOT_SPECS,
      platforms: PRODUCT_SHOOT_PLATFORMS,
    },
  };

export function getPlatformDataForAssetType(
  assetType: AssetType,
): AssetTypePlatformData {
  return ASSET_TYPE_PLATFORM_DATA[assetType];
}

export function getPlatformsForAssetType(
  assetType: AssetType,
): readonly string[] {
  return ASSET_TYPE_PLATFORM_DATA[assetType].platforms;
}

export function getPlatformSpecById(id: string): PlatformSpec | undefined {
  return PLATFORM_SPECS.find(spec => spec.id === id);
}

export function getPlatformSpecsForAssetType(
  assetType: AssetType,
): PlatformSpec[] {
  return ASSET_TYPE_PLATFORM_DATA[assetType].specs;
}

export function getProductShootSpecsForPlatform(platform: string): PlatformSpec[] {
  return PRODUCT_SHOOT_SPECS.filter(spec => spec.platform === platform);
}

export function getSocialPosterSpecsForPlatform(platform: string): PlatformSpec[] {
  return SOCIAL_POSTER_SPECS.filter(spec => spec.platform === platform);
}

export function getAdsCreativeSpecsForPlatform(platform: string): PlatformSpec[] {
  return ADS_CREATIVE_SPECS.filter(spec => spec.platform === platform);
}

export function toPlatformSpecOptions(
  specs: PlatformSpec[],
): PlatformSpecOption[] {
  return specs.map(spec => ({
    key: spec.id,
    label: spec.label,
  }));
}
