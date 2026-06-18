import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type LogHandler,
} from 'react-native-purchases';

import { DEVICE_ID_KEY } from '../../constants/storage';
import { env } from '../../config/env';

let isConfigured = false;
let isLogHandlerSet = false;

function isPurchaseCancellationMessage(message: string): boolean {
  return /purchase was cancel/i.test(message);
}

function setupRevenueCatLogHandler(): void {
  if (isLogHandlerSet) {
    return;
  }

  const handler: LogHandler = (logLevel, message) => {
    const formattedMessage = `[RevenueCat] ${message}`;

    if (
      logLevel === LOG_LEVEL.ERROR &&
      isPurchaseCancellationMessage(message)
    ) {
      return;
    }

    switch (logLevel) {
      case LOG_LEVEL.DEBUG:
        console.debug(formattedMessage);
        break;
      case LOG_LEVEL.INFO:
        console.info(formattedMessage);
        break;
      case LOG_LEVEL.WARN:
        console.warn(formattedMessage);
        break;
      case LOG_LEVEL.ERROR:
        console.error(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  };

  Purchases.setLogHandler(handler);
  isLogHandlerSet = true;
}

export function isPurchaseCancelledError(err: unknown): boolean {
  if (!err || typeof err !== 'object') {
    return false;
  }

  const error = err as { userCancelled?: boolean; code?: string | number };
  if (error.userCancelled) {
    return true;
  }

  return (
    String(error.code) ===
    String(PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR)
  );
}

export function getPurchaseErrorMessage(
  err: unknown,
  fallback = 'Could not open subscriptions.',
): string | null {
  if (isPurchaseCancelledError(err)) {
    return null;
  }

  return err instanceof Error ? err.message : fallback;
}

async function getDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }

  const deviceId = `did_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export function buildRevenueCatAppUserId(userId: string): string {
  return `uid:${userId}`;
}

export async function buildRevenueCatLoginId(userId: string): Promise<string> {
  const deviceId = await getDeviceId();
  return `uid:${userId}|did:${deviceId}`;
}

export function configureRevenueCat(): void {
  const apiKey = env.REVENUECAT_API_KEY;
  if (!apiKey || apiKey === 'YOUR_REVENUECAT_API_KEY') {
    return;
  }

  if (isConfigured) {
    return;
  }

  setupRevenueCatLogHandler();
  Purchases.configure({ apiKey });
  isConfigured = true;
  Purchases.getOfferings().catch(() => {});
}

export async function identifyRevenueCatUser(userId: string): Promise<void> {
  const apiKey = env.REVENUECAT_API_KEY;
  if (!apiKey || apiKey === 'YOUR_REVENUECAT_API_KEY' || !userId) {
    return;
  }

  configureRevenueCat();

  try {
    const appUserId = await buildRevenueCatLoginId(userId);
    await Purchases.logIn(appUserId);
  } catch {
    try {
      await Purchases.logIn(userId);
    } catch {
      // RevenueCat identification is best-effort.
    }
  }
}

export async function logoutRevenueCatUser(): Promise<void> {
  if (!isConfigured) {
    return;
  }

  try {
    await Purchases.logOut();
  } catch {
    // Ignore logout errors.
  }
}
