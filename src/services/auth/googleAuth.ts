import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { env } from '../../config/env';

let isConfigured = false;

export function configureGoogleSignIn() {
  if (isConfigured) {
    return;
  }

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

    const idToken = result.data?.idToken;

    if (!idToken) {
      throw new Error('Google sign-in did not return an id token.');
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
