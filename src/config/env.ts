import Config from 'react-native-config';

function required(key: keyof typeof Config, value: string | undefined): string {
  if (!value || value.trim() === '') {
    if (__DEV__) {
      console.warn(`[env] Missing required env variable: ${key}`);
    }
    return '';
  }
  return value;
}

export const env = {
  BASE_URL: required('BASE_URL', Config.BASE_URL) || 'https://api.brandshots.app',
  GOOGLE_WEB_CLIENT_ID: required('GOOGLE_WEB_CLIENT_ID', Config.GOOGLE_WEB_CLIENT_ID),
  GOOGLE_IOS_CLIENT_ID: required('GOOGLE_IOS_CLIENT_ID', Config.GOOGLE_IOS_CLIENT_ID),
  GOOGLE_ANDROID_CLIENT_ID: required(
    'GOOGLE_ANDROID_CLIENT_ID',
    Config.GOOGLE_ANDROID_CLIENT_ID,
  ),
  REVENUECAT_API_KEY: required('REVENUECAT_API_KEY', Config.REVENUECAT_API_KEY),
  REVENUECAT_OFFERING: required('REVENUECAT_OFFERING', Config.REVENUECAT_OFFERING),
} as const;
