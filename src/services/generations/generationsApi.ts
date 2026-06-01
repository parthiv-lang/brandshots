import { endpoints } from '../api/endpoints';
import { http } from '../api/http';

import type {
  ListGenerationsParams,
  ListGenerationsResponse,
} from './types';

function toQueryParams(
  params?: ListGenerationsParams,
): Record<string, string> | undefined {
  if (!params) {
    return undefined;
  }

  const query: Record<string, string> = {};

  if (params.limit != null) {
    query.limit = String(params.limit);
  }
  if (params.cursor) {
    query.cursor = params.cursor;
  }
  if (params.platformId) {
    query.platformId = params.platformId;
  }
  if (params.nicheId) {
    query.nicheId = params.nicheId;
  }
  if (params.vibeId) {
    query.vibeId = params.vibeId;
  }
  if (params.since) {
    query.since = params.since;
  }

  return Object.keys(query).length > 0 ? query : undefined;
}

export const generationsApi = {
  list(params?: ListGenerationsParams): Promise<ListGenerationsResponse> {
    return http.get<ListGenerationsResponse>(endpoints.generations.list, {
      params: toQueryParams(params),
    });
  },

  delete(id: string): Promise<void> {
    return http.delete<void>(endpoints.generations.byId(id));
  },
};
