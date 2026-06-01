import { configureStore } from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import generationsReducer from './slices/generationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    generations: generationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
