import { endpoints } from '../api/endpoints';
import { http } from '../api/http';

import type { BatchResponse } from '../../types/creativeBrief';

export const generateApi = {
  generate(formData: FormData): Promise<BatchResponse> {
    return http.post<BatchResponse>(endpoints.generations.generate, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
      transformRequest: (data: unknown) => data,
    });
  },
};
