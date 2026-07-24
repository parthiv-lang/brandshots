export type PublicGeneration = {
  id: string;
  createdAt: string;
  imageUrl: string;
  imageSize: string;
  aspectRatio: string;
  width: number;
  height: number;
  mode: string;
  platformId: string;
  platformLabel: string;
  platform: string;
  nicheId: string;
  nicheLabel: string;
  vibeId: string;
  vibeLabel: string;
  brandTitle: string;
  brandDescription: string;
  brandWebsite: string;
  headline: string;
  cta: string;
  categoryId: string | null;
  categoryLabel: string | null;
  lookId: string | null;
  lookLabel: string | null;
  treatmentId: string | null;
  treatmentLabel: string | null;
  audience: string | null;
  offer: string | null;
  copy: string | null;
  productId: string | null;
  parentGenerationId: string | null;
  refineFeedback: string | null;
  creditsUsed: number;
  prompt: string;
};

export type ListGenerationsParams = {
  limit?: number;
  cursor?: string;
  platformId?: string;
  nicheId?: string;
  vibeId?: string;
  since?: string;
};

export type ListGenerationsResponse = {
  items: PublicGeneration[];
  nextCursor?: string;
};

export type GenerationCopy = {
  caption?: string;
  shortTitle?: string;
  longTitle?: string;
  hashtags?: string[];
  ctaText?: string;
  altText?: string;
};

export type BatchGeneration = {
  id: string;
  createdAt: string;
  imageUrl: string;
  imageSize: string;
  aspectRatio: string;
  width: number;
  height: number;
  mode: string;
  platformId: string | null;
  platformLabel: string | null;
  platform: string | null;
  nicheId: string | null;
  nicheLabel: string | null;
  vibeId: string | null;
  vibeLabel: string | null;
  brandTitle: string | null;
  brandDescription: string | null;
  brandWebsite: string | null;
  headline: string | null;
  cta: string | null;
  categoryId: string | null;
  categoryLabel: string | null;
  lookId: string | null;
  lookLabel: string | null;
  treatmentId: string | null;
  treatmentLabel: string | null;
  audience: string | null;
  offer: string | null;
  copy: string | GenerationCopy | null;
  productId: string | null;
  parentGenerationId: string | null;
  refineFeedback: string | null;
  creditsUsed: number;
  prompt: string;
  favorite: boolean;
};

export type BatchResultItem = {
  ok: boolean;
  variantIndex: number;
  jobId?: string;
  generation?: BatchGeneration;
  error?: string;
};

export type BatchResponse = {
  batchId: string;
  results: BatchResultItem[];
  credits?: {
    balance: number;
  };
  copy?: GenerationCopy;
  autoCreatedProductId?: string;
};

export type RefineImageQuality = 'low' | 'medium' | 'high';

export type RefineGenerationRequest = {
  feedback: string;
  imageQuality: RefineImageQuality;
};

export type RefineGenerationResponse = {
  id: string;
  createdAt: string;
  imageUrl: string;
  imageSize: string;
  aspectRatio: string;
  width: number;
  height: number;
  mode: string;
  platformId: string | null;
  platformLabel: string | null;
  platform: string | null;
  nicheId: string | null;
  nicheLabel: string | null;
  vibeId: string | null;
  vibeLabel: string | null;
  brandTitle: string | null;
  brandDescription: string | null;
  brandWebsite: string | null;
  headline: string | null;
  cta: string | null;
  categoryId: string | null;
  categoryLabel: string | null;
  lookId: string | null;
  lookLabel: string | null;
  treatmentId: string | null;
  treatmentLabel: string | null;
  audience: string | null;
  offer: string | null;
  copy: string | GenerationCopy | null;
  productId: string | null;
  parentGenerationId: string | null;
  refineFeedback: string | null;
  creditsUsed: number;
  prompt: string;
  favorite: boolean;
  credits?: {
    balance: number;
  };
};
