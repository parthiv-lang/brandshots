import type { ImageSourcePropType } from 'react-native';

import type { AppIconName } from '../components/AppIcon';

const catalogIcon = require('../assets/camera-svgrepo-com (2).png');
const instagramIcon = require('../assets/instagram-2016-logo-svgrepo-com.png');
const facebookIcon = require('../assets/facebook-svgrepo-com.png');
const linkedinIcon = require('../assets/linkedin-svgrepo-com.png');
const pinterestIcon = require('../assets/pinterest-color-svgrepo-com.png');
const googleIcon = require('../assets/google-color-svgrepo-com.png');
const tiktokIcon = require('../assets/tiktok-logo-logo-svgrepo-com.png');
const websiteIcon = require('../assets/website-click-svgrepo-com.png');

export const PLATFORM_ICON_SOURCES: Record<string, ImageSourcePropType> = {
  Catalog: catalogIcon,
  Instagram: instagramIcon,
  Facebook: facebookIcon,
  LinkedIn: linkedinIcon,
  Pinterest: pinterestIcon,
  'Meta Ads': facebookIcon,
  Google: googleIcon,
  TikTok: tiktokIcon,
  Website: websiteIcon,
};

export function getPlatformIconSource(
  platform: string,
): ImageSourcePropType | undefined {
  return PLATFORM_ICON_SOURCES[platform];
}

const COLORED_PLATFORMS = new Set([
  'Instagram',
  'Facebook',
  'LinkedIn',
  'Pinterest',
  'Meta Ads',
  'Google',
  'TikTok',
  'Website',
]);

export function isColoredPlatformIcon(platform: string): boolean {
  return COLORED_PLATFORMS.has(platform);
}

const PLATFORM_FALLBACK_ICONS: Record<string, AppIconName> = {
  Custom: 'sliders',
};

export function getPlatformFallbackIconName(platform: string): AppIconName {
  return PLATFORM_FALLBACK_ICONS[platform] ?? 'sliders';
}
