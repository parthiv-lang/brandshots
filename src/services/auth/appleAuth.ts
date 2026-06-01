import appleAuth from '@invertase/react-native-apple-authentication';
import { Platform } from 'react-native';

export class AppleSignInUnsupportedError extends Error {
  constructor() {
    super('Apple sign-in is not supported on this device.');
    this.name = 'AppleSignInUnsupportedError';
  }
}

export class AppleSignInCancelledError extends Error {
  constructor() {
    super('Apple sign-in was cancelled.');
    this.name = 'AppleSignInCancelledError';
  }
}

export type AppleSignInPayload = {
  identityToken: string;
  nonce: string;
  email: string | null;
  fullName: {
    givenName: string | null;
    familyName: string | null;
  } | null;
};

export function isAppleSignInAvailable(): boolean {
  return Platform.OS === 'ios' && appleAuth.isSupported;
}

export async function signInWithApple(): Promise<AppleSignInPayload> {
  if (!isAppleSignInAvailable()) {
    throw new AppleSignInUnsupportedError();
  }

  try {
    const response = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
    });

    if (!response.identityToken) {
      throw new Error('Apple sign-in did not return an identity token.');
    }

    return {
      identityToken: response.identityToken,
      nonce: response.nonce,
      email: response.email,
      fullName: response.fullName
        ? {
            givenName: response.fullName.givenName ?? null,
            familyName: response.fullName.familyName ?? null,
          }
        : null,
    };
  } catch (error) {
    const code = (error as { code?: string })?.code;

    if (code === '1001') {
      throw new AppleSignInCancelledError();
    }

    throw error;
  }
}
