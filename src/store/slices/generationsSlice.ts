import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { generationsApi } from '../../services/generations/generationsApi';
import type {
  ListGenerationsParams,
  PublicGeneration,
} from '../../services/generations/types';
import { deleteAccountThunk, logoutThunk } from './authSlice';

export const HOME_RECENT_LIMIT = 4;

export type GenerationsStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type GenerationsState = {
  items: PublicGeneration[];
  nextCursor: string | undefined;
  status: GenerationsStatus;
  error: string | null;
};

const initialState: GenerationsState = {
  items: [],
  nextCursor: undefined,
  status: 'idle',
  error: null,
};

export const fetchGenerations = createAsyncThunk<
  { items: PublicGeneration[]; nextCursor?: string },
  ListGenerationsParams | void,
  { rejectValue: string }
>('generations/fetch', async (params, { rejectWithValue }) => {
  try {
    const response = await generationsApi.list(params ?? undefined);
    return {
      items: response.items,
      nextCursor: response.nextCursor,
    };
  } catch (error) {
    return rejectWithValue(
      (error as { message?: string })?.message ??
        'Failed to load generations.',
    );
  }
});

const generationsSlice = createSlice({
  name: 'generations',
  initialState,
  reducers: {
    resetGenerations(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchGenerations.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchGenerations.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload.items;
        state.nextCursor = action.payload.nextCursor;
      })
      .addCase(fetchGenerations.rejected, (state, action) => {
        state.status = 'failed';
        state.items = [];
        state.nextCursor = undefined;
        state.error = action.payload ?? null;
      })
      .addCase(logoutThunk.fulfilled, state => {
        Object.assign(state, initialState);
      })
      .addCase(deleteAccountThunk.fulfilled, state => {
        Object.assign(state, initialState);
      });
  },
});

export const { resetGenerations } = generationsSlice.actions;

export default generationsSlice.reducer;

type SliceState = { generations: GenerationsState };

export const selectGenerationsItems = (state: SliceState) =>
  state.generations.items;
export const selectGenerationsStatus = (state: SliceState) =>
  state.generations.status;
export const selectGenerationsError = (state: SliceState) =>
  state.generations.error;
export const selectGenerationsNextCursor = (state: SliceState) =>
  state.generations.nextCursor;
export const selectShowHomeRecentWork = (state: SliceState) =>
  state.generations.status === 'succeeded' && state.generations.items.length > 0;
