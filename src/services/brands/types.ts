export type BrandKitRecord = {
  id: string;
  title: string;
  description: string;
  website: string;
  colors: string[];
  color: string;
  logoDescription: string;
  isDefault: boolean;
  logoUrl: string | null;
  logoMime: string | null;
  updatedAt: string;
};

export type ScrapedBrandPayload = {
  title: string;
  description: string;
  colors: string[];
  logoDescription: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  logoDataUrl?: string;
  logoMime?: string;
  sourceUrl?: string;
};

export type ListBrandKitsResponse = {
  items: BrandKitRecord[];
};

export type CreateBrandInput = {
  title: string;
  description: string;
  website: string;
  colors: string[];
  logoDescription?: string;
  isDefault?: boolean;
  logoUri?: string;
  fileName?: string;
  mimeType?: string;
};

export type UpdateBrandInput = CreateBrandInput & {
  id: string;
};
