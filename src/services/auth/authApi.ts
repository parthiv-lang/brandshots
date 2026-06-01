import { endpoints } from '../api/endpoints';
import { http } from '../api/http';

import {
  normalizeAuthCredits,
  normalizeAuthUser,
  type AuthResponse,
  type MeResponse,
  type RawAuthCredits,
  type RawAuthUser,
} from './types';

type RawAuthResponse = {
  accessToken: string;
  user?: RawAuthUser;
  credits?: RawAuthCredits;
};

type RawMeResponse =
  | {
      user?: RawAuthUser;
      credits?: RawAuthCredits;
    }
  | (RawAuthUser & {
      credits?: RawAuthCredits;
    });

export const authApi = {
  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await http.post<RawAuthResponse, { idToken: string }>(
      endpoints.auth.google,
      { idToken },
    );

    return {
      accessToken: response.accessToken,
      user: normalizeAuthUser(response.user),
      credits: normalizeAuthCredits(response.credits),
    };
  },

  async loginWithApple(payload: {
    identityToken: string;
    nonce?: string;
    fullName?: { givenName?: string | null; familyName?: string | null } | null;
    email?: string | null;
  }): Promise<AuthResponse> {
    const response = await http.post<RawAuthResponse, typeof payload>(
      endpoints.auth.apple,
      payload,
    );

    return {
      accessToken: response.accessToken,
      user: normalizeAuthUser(response.user),
      credits: normalizeAuthCredits(response.credits),
    };
  },

  async me(): Promise<MeResponse> {
    const response = await http.get<RawMeResponse>(endpoints.auth.me);
    const isNestedResponse =
      'user' in response &&
      typeof response.user !== 'undefined' &&
      response.user !== null;
    const userSource = isNestedResponse ? response.user : (response as RawAuthUser);
    const creditsSource = response.credits;

    return {
      user: normalizeAuthUser(userSource),
      credits: normalizeAuthCredits(creditsSource),
    };
  },

  logout() {
    return http.post<void>(endpoints.auth.logout);
  },
};
