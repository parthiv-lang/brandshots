import { endpoints } from '../api/endpoints';
import { http } from '../api/http';

import type {
  AnalyzeProductInput,
  CreateProductInput,
  ListProductsParams,
  ListProductsResponse,
  ProductAnalysis,
  ProductRecord,
  RemoveBackgroundInput,
  RemoveBackgroundResponse,
  UpdateProductPayload,
} from './types';

const DEFAULT_LIST_LIMIT = 24;

const BG_REMOVE_TIMEOUT_MS = 90000;
const ANALYZE_TIMEOUT_MS = 90000;
const CREATE_PRODUCT_TIMEOUT_MS = 90000;

function inferFileNameFromUri(uri: string, fallback = 'product.png') {
  if (uri.startsWith('data:')) {
    return fallback;
  }

  const last = uri.split('/').pop();
  if (!last) {
    return fallback;
  }

  return last.split('?')[0] || fallback;
}

function inferMimeType(fileName: string, fallback?: string) {
  if (fallback) {
    return fallback;
  }

  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'webp':
      return 'image/webp';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

function appendImageField(
  formData: FormData,
  imageUri: string,
  fileName?: string,
  mimeType?: string,
) {
  const resolvedFileName = fileName || inferFileNameFromUri(imageUri);
  const resolvedMimeType = inferMimeType(resolvedFileName, mimeType);

  formData.append('image', {
    uri: imageUri,
    name: resolvedFileName,
    type: resolvedMimeType,
  } as unknown as Blob);
}

function postMultipart<TResponse>(
  url: string,
  formData: FormData,
  timeoutMs: number,
): Promise<TResponse> {
  return http.post<TResponse>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: timeoutMs,
    transformRequest: (data: unknown) => data,
  });
}

export const productsApi = {
  removeBackground({
    imageUri,
    fileName,
    mimeType,
  }: RemoveBackgroundInput): Promise<RemoveBackgroundResponse> {
    const formData = new FormData();
    appendImageField(formData, imageUri, fileName, mimeType);

    return postMultipart<RemoveBackgroundResponse>(
      endpoints.products.bgRemove,
      formData,
      BG_REMOVE_TIMEOUT_MS,
    );
  },

  analyze({
    imageUri,
    fileName,
    mimeType,
  }: AnalyzeProductInput): Promise<ProductAnalysis> {
    const formData = new FormData();
    appendImageField(formData, imageUri, fileName, mimeType);

    return postMultipart<ProductAnalysis>(
      endpoints.products.analyze,
      formData,
      ANALYZE_TIMEOUT_MS,
    );
  },

  create({
    imageUri,
    analysis,
    fileName,
    mimeType,
  }: CreateProductInput): Promise<ProductRecord> {
    const formData = new FormData();
    appendImageField(formData, imageUri, fileName, mimeType);
    formData.append('analysisJson', JSON.stringify(analysis));

    return postMultipart<ProductRecord>(
      endpoints.products.create,
      formData,
      CREATE_PRODUCT_TIMEOUT_MS,
    );
  },

  uploadImage({
    imageUri,
    fileName,
    mimeType,
  }: AnalyzeProductInput): Promise<ProductRecord> {
    const formData = new FormData();
    appendImageField(formData, imageUri, fileName, mimeType);

    return postMultipart<ProductRecord>(
      endpoints.products.create,
      formData,
      CREATE_PRODUCT_TIMEOUT_MS,
    );
  },

  update(id: string, payload: UpdateProductPayload): Promise<ProductRecord> {
    return http.patch<ProductRecord>(endpoints.products.byId(id), payload);
  },

  list(params?: ListProductsParams): Promise<ListProductsResponse> {
    const query: Record<string, string> = {
      limit: String(params?.limit ?? DEFAULT_LIST_LIMIT),
    };

    if (params?.cursor) {
      query.cursor = params.cursor;
    }

    return http.get<ListProductsResponse>(endpoints.products.create, {
      params: query,
    });
  },

  getById(id: string): Promise<ProductRecord> {
    return http.get<ProductRecord>(endpoints.products.byId(id));
  },

  delete(id: string): Promise<void> {
    return http.delete<void>(endpoints.products.byId(id));
  },
};
