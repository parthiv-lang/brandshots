import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { configureGoogleSignIn } from './src/services/auth/googleAuth';
import {
  configureRevenueCat,
  identifyRevenueCatUser,
  logoutRevenueCatUser,
} from './src/services/purchases/revenueCat';
import { setUnauthorizedHandler } from './src/services/api/client';
import { loadMe } from './src/services/storage/userStorage';
import {
  bootstrapAuth,
  forceSignOut,
  selectAuthStatus,
} from './src/store/slices/authSlice';
import { store, type AppDispatch } from './src/store';
import { useAppSelector } from './src/store/hooks';
import { colors } from './src/theme/colors';

function RootGate() {
  const dispatch = useDispatch<AppDispatch>();
  const status = useAppSelector(selectAuthStatus);

  useEffect(() => {
    configureGoogleSignIn();
    configureRevenueCat();

    void loadMe().then(cached => {
      if (cached?.user?.id) {
        void identifyRevenueCatUser(cached.user.id);
      }
    });

    setUnauthorizedHandler(() => {
      void logoutRevenueCatUser();
      store.dispatch(forceSignOut());
    });
    dispatch(bootstrapAuth());

    return () => {
      setUnauthorizedHandler(null);
    };
  }, [dispatch]);

  if (status !== 'ready') {
    return null;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <RootNavigator />
    </NavigationContainer>
  );
}

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar
          backgroundColor={colors.background}
          barStyle="dark-content"
        />
        <RootGate />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
