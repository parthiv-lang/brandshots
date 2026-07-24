import AsyncStorage from '@react-native-async-storage/async-storage';

import { AUTH_TOKEN_KEY } from '../../constants/storage';

let cachedToken: string | null = null;

export async function hydrateTokenCache(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    cachedToken = token;
    return token;
  } catch {
    cachedToken = null;
    return null;
  }
}

export function getCachedToken(): string | null {
  return cachedToken;
}

export function resetTokenCache(): void {
  cachedToken = null;
}

export async function saveToken(token: string): Promise<void> {
  cachedToken = token;
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function removeToken(): Promise<void> {
  cachedToken = null;
  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}
