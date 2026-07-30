import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { env } from '../../config/env';

let isConfigured = false;

export function configureGoogleSignIn() {
  if (isConfigured) {
    return;
  }

  if (!env.GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      'GOOGLE_WEB_CLIENT_ID is missing. Rebuild the Android app after fixing .env / react-native-config.',
    );
  }

  // webClientId must be the Web OAuth client (not Android/iOS).
  // Android uses package name + SHA-1 from Google Cloud; iOS uses iosClientId.
  GoogleSignin.configure({
    webClientId: env.GOOGLE_WEB_CLIENT_ID,
    iosClientId: env.GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  });

  isConfigured = true;
}

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Google sign-in was cancelled.');
    this.name = 'GoogleSignInCancelledError';
  }
}

export async function signInWithGoogle(): Promise<string> {
  configureGoogleSignIn();

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  try {
    const result = await GoogleSignin.signIn();

    if (result.type !== 'success') {
      throw new GoogleSignInCancelledError();
    }

    let idToken = result.data?.idToken;

    // Some Android builds return user info from signIn() but need getTokens() for idToken.
    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    }

    if (!idToken) {
      throw new Error(
        'Google sign-in did not return an id token. Check GOOGLE_WEB_CLIENT_ID is a Web client ID and loaded at runtime.',
      );
    }

    return idToken;
  } catch (error) {
    const code = (error as { code?: string })?.code;

    if (
      code === statusCodes.SIGN_IN_CANCELLED ||
      code === statusCodes.IN_PROGRESS
    ) {
      throw new GoogleSignInCancelledError();
    }

    throw error;
  }
}

export async function signOutFromGoogle() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Swallow — the user can still be logged out locally.
  }
}
