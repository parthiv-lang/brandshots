import { endpoints } from '../api/endpoints';
import { http } from '../api/http';

import type { BatchResponse } from '../../types/creativeBrief';

const GENERATE_TIMEOUT_MS = 180000;

export const generateApi = {
  generate(formData: FormData): Promise<BatchResponse> {
    return http.post<BatchResponse>(endpoints.generations.generate, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: GENERATE_TIMEOUT_MS,
      transformRequest: (data: unknown) => data,
    });
  },
};
