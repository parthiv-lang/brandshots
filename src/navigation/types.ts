import type { NavigatorScreenParams } from '@react-navigation/native';

import type { BatchResponse } from '../services/generations/types';

export type MainTabParamList = {
  Create: undefined;
  Products: undefined;
  Brand: undefined;
  Creatives: undefined;
  Settings: undefined;
};

export type UploadProductParams = {
  source: 'camera' | 'library' | 'file' | 'saved';
  imageUri?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  width?: number;
  height?: number;
  productId?: string;
};

export type ProductShootParams = {
  productId: string;
  productName: string;
  imageUrl: string;
  category?: string;
};

export type ShootResultsParams = {
  productName: string;
  presetName?: string;
  imageUrl?: string;
  response: BatchResponse;
};

export type BrandDetailsParams = {
  brandId?: string;
  title?: string;
  description?: string;
  website?: string;
  colors?: string[];
  logoDescription?: string;
  logoUrl?: string;
  logoMime?: string;
  isDefault?: boolean;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  UploadProduct: UploadProductParams;
  ProductShoot: ProductShootParams;
  ShootResults: ShootResultsParams;
  BrandDetails: BrandDetailsParams | undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
