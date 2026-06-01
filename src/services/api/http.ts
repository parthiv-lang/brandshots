import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

import { api } from './client';

export type ApiError = {
  status?: number;
  message: string;
  data?: unknown;
};

function normalizeError(error: unknown): ApiError {
  const axiosError = error as AxiosError<{ message?: string; error?: string }>;

  if (axiosError?.isAxiosError) {
    const data = axiosError.response?.data;
    const message =
      (typeof data === 'object' && data && 'message' in data && data.message) ||
      (typeof data === 'object' && data && 'error' in data && data.error) ||
      axiosError.message ||
      'Something went wrong. Please try again.';

    return {
      status: axiosError.response?.status,
      message: String(message),
      data: axiosError.response?.data,
    };
  }

  return {
    message:
      (error as Error)?.message ?? 'Something went wrong. Please try again.',
  };
}

async function unwrap<T>(promise: Promise<AxiosResponse<T>>): Promise<T> {
  try {
    const response = await promise;
    return response.data;
  } catch (error) {
    throw normalizeError(error);
  }
}

export const http = {
  get<TResponse>(url: string, config?: AxiosRequestConfig): Promise<TResponse> {
    return unwrap<TResponse>(api.get(url, config));
  },

  post<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    return unwrap<TResponse>(api.post(url, body, config));
  },

  put<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    return unwrap<TResponse>(api.put(url, body, config));
  },

  patch<TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    return unwrap<TResponse>(api.patch(url, body, config));
  },

  delete<TResponse>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<TResponse> {
    return unwrap<TResponse>(api.delete(url, config));
  },
};
