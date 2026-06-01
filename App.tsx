import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider, useDispatch } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import RootNavigator from './src/navigation/RootNavigator';
import SignInScreen from './src/screens/SignInScreen';
import { configureGoogleSignIn } from './src/services/auth/googleAuth';
import { setUnauthorizedHandler } from './src/services/api/client';
import {
  bootstrapAuth,
  forceSignOut,
  selectAuthStatus,
  selectIsAuthenticated,
} from './src/store/slices/authSlice';
import { store, type AppDispatch } from './src/store';
import { useAppSelector } from './src/store/hooks';
import { colors } from './src/theme/colors';

function RootGate() {
  const dispatch = useDispatch<AppDispatch>();
  const status = useAppSelector(selectAuthStatus);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    configureGoogleSignIn();
    setUnauthorizedHandler(() => {
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

  if (!isAuthenticated) {
    return <SignInScreen />;
  }

  return (
    <NavigationContainer>
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
