import { endpoints } from '../api/endpoints';
import { http } from '../api/http';

import type {
  BrandKitRecord,
  CreateBrandInput,
  ListBrandKitsResponse,
  ScrapedBrandPayload,
  UpdateBrandInput,
} from './types';

const CREATE_BRAND_TIMEOUT_MS = 90000;

function parseIsDefault(value: unknown): boolean {
  return value === true || value === 1 || value === 'true' || value === '1';
}

function normalizeBrandKit(item: unknown): BrandKitRecord {
  const raw = (item && typeof item === 'object' ? item : {}) as Record<
    string,
    unknown
  >;

  const colors = Array.isArray(raw.colors)
    ? raw.colors.filter((entry): entry is string => typeof entry === 'string')
    : [];

  const logoUrlRaw = raw.logoUrl ?? raw.logo_url;

  return {
    id: String(raw.id ?? raw._id ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    website: String(raw.website ?? ''),
    colors,
    color: typeof raw.color === 'string' ? raw.color : colors[0] ?? '',
    logoDescription: String(raw.logoDescription ?? raw.logo_description ?? ''),
    isDefault: parseIsDefault(raw.isDefault ?? raw.is_default),
    logoUrl: typeof logoUrlRaw === 'string' ? logoUrlRaw : null,
    logoMime:
      typeof raw.logoMime === 'string'
        ? raw.logoMime
        : typeof raw.logo_mime === 'string'
          ? raw.logo_mime
          : null,
    updatedAt: String(raw.updatedAt ?? raw.updated_at ?? ''),
  };
}

function normalizeScrapedBrandPayload(data: unknown): ScrapedBrandPayload {
  const raw = (data && typeof data === 'object' ? data : {}) as Record<
    string,
    unknown
  >;

  const colors = Array.isArray(raw.colors)
    ? raw.colors.filter((entry): entry is string => typeof entry === 'string')
    : [];

  return {
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    colors,
    logoDescription: String(raw.logoDescription ?? raw.logo_description ?? ''),
    faviconUrl:
      typeof raw.faviconUrl === 'string' ? raw.faviconUrl : undefined,
    ogImageUrl:
      typeof raw.ogImageUrl === 'string' ? raw.ogImageUrl : undefined,
    logoDataUrl:
      typeof raw.logoDataUrl === 'string' ? raw.logoDataUrl : undefined,
    logoMime: typeof raw.logoMime === 'string' ? raw.logoMime : undefined,
    sourceUrl: typeof raw.sourceUrl === 'string' ? raw.sourceUrl : undefined,
  };
}

function sortWithDefaultFirst(items: BrandKitRecord[]) {
  return [...items].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

function inferFileNameFromUri(uri: string, fallback = 'logo.png') {
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
    case 'webp':
      return 'image/webp';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
}

function appendLogoField(
  formData: FormData,
  logoUri: string,
  fileName?: string,
  mimeType?: string,
) {
  const resolvedFileName = fileName || inferFileNameFromUri(logoUri);
  const resolvedMimeType = inferMimeType(resolvedFileName, mimeType);

  formData.append('logo', {
    uri: logoUri,
    name: resolvedFileName,
    type: resolvedMimeType,
  } as unknown as Blob);
}

function postBrandMultipart(
  url: string,
  formData: FormData,
): Promise<BrandKitRecord> {
  return http
    .post<unknown>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: CREATE_BRAND_TIMEOUT_MS,
      transformRequest: (data: unknown) => data,
    })
    .then(normalizeBrandKit);
}

function putBrandMultipart(
  url: string,
  formData: FormData,
): Promise<BrandKitRecord> {
  return http
    .put<unknown>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: CREATE_BRAND_TIMEOUT_MS,
      transformRequest: (data: unknown) => data,
    })
    .then(normalizeBrandKit);
}

export const brandsApi = {
  async list(): Promise<ListBrandKitsResponse> {
    const data = await http.get<{ items?: unknown[] }>(endpoints.brands.list);
    const items = Array.isArray(data.items)
      ? data.items.map(normalizeBrandKit)
      : [];

    return { items: sortWithDefaultFirst(items) };
  },

  create(input: CreateBrandInput): Promise<BrandKitRecord> {
    return postBrandMultipart(endpoints.brands.list, buildBrandFormData(input));
  },

  update(input: UpdateBrandInput): Promise<BrandKitRecord> {
    return putBrandMultipart(
      endpoints.brands.byId(input.id),
      buildBrandFormData(input),
    );
  },

  async scrapeWebsite(url: string): Promise<ScrapedBrandPayload> {
    const response = await http.post<unknown, { url: string }>(
      endpoints.brands.scrape,
      { url },
    );
    return normalizeScrapedBrandPayload(response);
  },

  setDefault(id: string, isDefault: boolean): Promise<BrandKitRecord> {
    return http
      .post<unknown, { isDefault: boolean }>(endpoints.brands.byId(id) + '/default', {
        isDefault,
      })
      .then(normalizeBrandKit);
  },

  clearDefault(): Promise<{ ok: boolean }> {
    return http.post<{ ok: boolean }>(`${endpoints.brands.list}/default/clear`);
  },

  delete(id: string): Promise<void> {
    return http.delete<void>(endpoints.brands.byId(id));
  },
};

function buildBrandFormData(input: CreateBrandInput): FormData {
  const formData = new FormData();

  formData.append('title', input.title.trim());
  formData.append('description', input.description.trim());
  formData.append('website', input.website.trim());
  formData.append('colors', JSON.stringify(input.colors));

  if (input.logoDescription?.trim()) {
    formData.append('logoDescription', input.logoDescription.trim());
  }

  if (input.isDefault) {
    formData.append('isDefault', 'true');
  }

  if (input.logoUri) {
    appendLogoField(formData, input.logoUri, input.fileName, input.mimeType);
  }

  return formData;
}
