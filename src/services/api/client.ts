import axios, { AxiosError, type AxiosInstance } from 'axios';

import { env } from '../../config/env';
import { getCachedToken, removeToken } from '../storage/tokenStorage';

const DEFAULT_TIMEOUT_MS = 20000;

type UnauthorizedHandler = () => void;

let onUnauthorized: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  onUnauthorized = handler;
}

export const api: AxiosInstance = axios.create({
  baseURL: env.BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(config => {
  const token = getCachedToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await removeToken();
      onUnauthorized?.();
    }

    return Promise.reject(error);
  },
);
