import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { authApi } from '../../services/auth/authApi';
import type { AuthCredits, AuthUser } from '../../services/auth/types';
import {
  signInWithApple,
  AppleSignInCancelledError,
} from '../../services/auth/appleAuth';
import {
  signInWithGoogle,
  signOutFromGoogle,
  GoogleSignInCancelledError,
} from '../../services/auth/googleAuth';
import {
  hydrateTokenCache,
  removeToken,
  saveToken,
} from '../../services/storage/tokenStorage';
import { clearAllAsyncStorage } from '../../services/storage/appStorage';
import { removeMe, saveMe } from '../../services/storage/userStorage';
import {
  identifyRevenueCatUser,
  logoutRevenueCatUser,
} from '../../services/purchases/revenueCat';

export type AuthStatus = 'idle' | 'bootstrapping' | 'authenticating' | 'ready';

export type AuthState = {
  status: AuthStatus;
  isAuthenticated: boolean;
  accessToken: string | null;
  user: AuthUser | null;
  credits: AuthCredits | null;
  error: string | null;
  pendingProvider: 'google' | 'apple' | null;
};

const initialState: AuthState = {
  status: 'idle',
  isAuthenticated: false,
  accessToken: null,
  user: null,
  credits: null,
  error: null,
  pendingProvider: null,
};

export const bootstrapAuth = createAsyncThunk<
  { accessToken: string; user: AuthUser; credits: AuthCredits } | null,
  void,
  { rejectValue: string }
>('auth/bootstrap', async (_, { rejectWithValue }) => {
  try {
    const token = await hydrateTokenCache();

    if (!token) {
      return null;
    }

    const response = await authApi.me();
    await saveMe(response);
    await identifyRevenueCatUser(response.user.id);

    return {
      accessToken: token,
      user: response.user,
      credits: response.credits,
    };
  } catch (error) {
    await removeToken();
    await removeMe();
    return rejectWithValue(
      (error as { message?: string })?.message ?? 'Session expired.',
    );
  }
});

export const loginWithGoogleThunk = createAsyncThunk<
  { accessToken: string; user: AuthUser; credits: AuthCredits },
  void,
  { rejectValue: string }
>('auth/loginWithGoogle', async (_, { rejectWithValue }) => {
  try {
    const idToken = await signInWithGoogle();
    const response = await authApi.loginWithGoogle(idToken);

    await saveToken(response.accessToken);
    await saveMe({ user: response.user, credits: response.credits });
    await identifyRevenueCatUser(response.user.id);

    return {
      accessToken: response.accessToken,
      user: response.user,
      credits: response.credits,
    };
  } catch (error) {
    if (error instanceof GoogleSignInCancelledError) {
      return rejectWithValue('');
    }
    return rejectWithValue(
      (error as { message?: string })?.message ?? 'Google sign-in failed.',
    );
  }
});

export const loginWithAppleThunk = createAsyncThunk<
  { accessToken: string; user: AuthUser; credits: AuthCredits },
  void,
  { rejectValue: string }
>('auth/loginWithApple', async (_, { rejectWithValue }) => {
  try {
    const apple = await signInWithApple();

    const response = await authApi.loginWithApple({
      identityToken: apple.identityToken,
      nonce: apple.nonce,
      email: apple.email,
      fullName: apple.fullName,
    });

    await saveToken(response.accessToken);
    await saveMe({ user: response.user, credits: response.credits });
    await identifyRevenueCatUser(response.user.id);

    return {
      accessToken: response.accessToken,
      user: response.user,
      credits: response.credits,
    };
  } catch (error) {
    if (error instanceof AppleSignInCancelledError) {
      return rejectWithValue('');
    }
    return rejectWithValue(
      (error as { message?: string })?.message ?? 'Apple sign-in failed.',
    );
  }
});

export const refreshMeThunk = createAsyncThunk<
  { user: AuthUser; credits: AuthCredits },
  void,
  { rejectValue: string }
>('auth/refreshMe', async (_, { rejectWithValue }) => {
  try {
    const response = await authApi.me();
    await saveMe(response);
    return {
      user: response.user,
      credits: response.credits,
    };
  } catch (error) {
    return rejectWithValue(
      (error as { message?: string })?.message ?? 'Could not load profile.',
    );
  }
});

export const logoutThunk = createAsyncThunk<void, void>(
  'auth/logout',
  async () => {
    await signOutFromGoogle();
    await logoutRevenueCatUser();
    await removeToken();
    await removeMe();
  },
);

export const deleteAccountThunk = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/deleteAccount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.deleteAccount();

      if (!response.deleted) {
        return rejectWithValue('Account deletion failed. Please try again.');
      }

      await signOutFromGoogle();
      await logoutRevenueCatUser();
      await clearAllAsyncStorage();
    } catch (error) {
      return rejectWithValue(
        (error as { message?: string })?.message ??
          'Account deletion failed. Please try again.',
      );
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    forceSignOut(state) {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.user = null;
      state.credits = null;
      state.error = null;
      state.pendingProvider = null;
    },
    setCreditsBalance(state, action: PayloadAction<number>) {
      if (state.credits) {
        state.credits.balance = action.payload;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(bootstrapAuth.pending, state => {
        state.status = 'bootstrapping';
        state.error = null;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.status = 'ready';

        if (action.payload) {
          state.isAuthenticated = true;
          state.accessToken = action.payload.accessToken;
          state.user = action.payload.user;
          state.credits = action.payload.credits;
        } else {
          state.isAuthenticated = false;
          state.accessToken = null;
          state.user = null;
          state.credits = null;
        }
      })
      .addCase(bootstrapAuth.rejected, state => {
        state.status = 'ready';
        state.isAuthenticated = false;
        state.accessToken = null;
        state.user = null;
        state.credits = null;
      });

    builder
      .addCase(loginWithGoogleThunk.pending, state => {
        state.status = 'authenticating';
        state.pendingProvider = 'google';
        state.error = null;
      })
      .addCase(loginWithGoogleThunk.fulfilled, (state, action) => {
        state.status = 'ready';
        state.pendingProvider = null;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.credits = action.payload.credits;
      })
      .addCase(loginWithGoogleThunk.rejected, (state, action) => {
        state.status = 'ready';
        state.pendingProvider = null;
        state.error = action.payload || null;
      });

    builder
      .addCase(loginWithAppleThunk.pending, state => {
        state.status = 'authenticating';
        state.pendingProvider = 'apple';
        state.error = null;
      })
      .addCase(loginWithAppleThunk.fulfilled, (state, action) => {
        state.status = 'ready';
        state.pendingProvider = null;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.user = action.payload.user;
        state.credits = action.payload.credits;
      })
      .addCase(loginWithAppleThunk.rejected, (state, action) => {
        state.status = 'ready';
        state.pendingProvider = null;
        state.error = action.payload || null;
      });

    const clearAuthSession = (state: AuthState) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.user = null;
      state.credits = null;
      state.error = null;
      state.pendingProvider = null;
    };

    builder
      .addCase(logoutThunk.fulfilled, clearAuthSession)
      .addCase(deleteAccountThunk.fulfilled, clearAuthSession);

    builder
      .addCase(refreshMeThunk.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.credits = action.payload.credits;
      })
      .addCase(refreshMeThunk.rejected, (state, action) => {
        state.error = action.payload || null;
      });
  },
});

export const { clearAuthError, forceSignOut, setCreditsBalance } =
  authSlice.actions;

export default authSlice.reducer;

type SliceState = { auth: AuthState };

export const selectAuth = (state: SliceState) => state.auth;
export const selectIsAuthenticated = (state: SliceState) =>
  state.auth.isAuthenticated;
export const selectAuthStatus = (state: SliceState) => state.auth.status;
export const selectAuthError = (state: SliceState) => state.auth.error;
export const selectPendingProvider = (state: SliceState) =>
  state.auth.pendingProvider;
export const selectUser = (state: SliceState) => state.auth.user;
export const selectCredits = (state: SliceState) => state.auth.credits;
