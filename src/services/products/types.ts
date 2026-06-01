export type RemoveBackgroundInput = {
  imageUri: string;
  fileName?: string;
  mimeType?: string;
};

export type RemoveBackgroundResponse = {
  mimeType: string;
  bytes: number;
  imageDataUrl: string;
};

export type ProductAnalysis = {
  productType: string;
  category: string;
  shape?: string;
  useCase?: string;
  consumptionContext?: string;
  brandText: string | null;
  isWellKnownBrand?: boolean;
  dominantColors?: string[];
  materials?: string;
  stylistics?: string;
  targetAudience?: string;
  visibleText?: string[];
  perAngleVisibleText?: Record<string, unknown>;
  logoDetected?: boolean;
  packagingNotes?: string;
  mustPreserve?: string[];
  riskFlags?: string[];
  notes?: string;
  brandContext?: unknown;
  copyIntelligence?: unknown;
};

export type AnalyzeProductInput = {
  imageUri: string;
  fileName?: string;
  mimeType?: string;
};

export type CreateProductInput = {
  imageUri: string;
  analysis: ProductAnalysis;
  fileName?: string;
  mimeType?: string;
};

export type ProductRecord = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageMime: string;
  angleImages: unknown;
  analysis: ProductAnalysis;
  createdAt: string;
  updatedAt: string;
};

export type UpdateProductPayload = {
  name?: string;
  description?: string;
  analysis?: ProductAnalysis;
};

export type ListProductsParams = {
  limit?: number;
  cursor?: string;
};

export type ListProductsResponse = {
  items: ProductRecord[];
  nextCursor: string | null;
};
