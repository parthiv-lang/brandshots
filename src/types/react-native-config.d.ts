declare module 'react-native-config' {
  export interface NativeConfig {
    BASE_URL?: string;
    GOOGLE_WEB_CLIENT_ID?: string;
    GOOGLE_IOS_CLIENT_ID?: string;
    GOOGLE_ANDROID_CLIENT_ID?: string;
    REVENUECAT_API_KEY?: string;
    REVENUECAT_OFFERING?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
