import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabNavigator from './MainTabNavigator';
import BrandDetailsScreen from '../screens/BrandDetailsScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ProductShootScreen from '../screens/ProductShootScreen';
import ShootResultsScreen from '../screens/ShootResultsScreen';
import SignInScreen from '../screens/SignInScreen';
import PaywallScreen from '../screens/PaywallScreen';
import UploadProductScreen from '../screens/UploadProductScreen';
import { useAppSelector } from '../store/hooks';
import {
  selectAuthStatus,
  selectIsAuthenticated,
} from '../store/slices/authSlice';
import { loadOnboardingCompleted } from '../services/storage/onboardingStorage';
import type { RootStackParamList } from './types';
import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthRedirectHandler() {
  const status = useAppSelector(selectAuthStatus);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  useEffect(() => {
    if (status !== 'ready' || isAuthenticated || !navigationRef.isReady()) {
      return;
    }

    const currentRoute = navigationRef.getCurrentRoute();
    if (
      currentRoute?.name !== 'SignIn' &&
      currentRoute?.name !== 'Onboarding'
    ) {
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });
    }
  }, [isAuthenticated, status]);

  return null;
}

function RootNavigator() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    void loadOnboardingCompleted().then(completed => {
      setHasCompletedOnboarding(completed);
      setOnboardingReady(true);
    });
  }, []);

  if (!onboardingReady) {
    return null;
  }

  const initialRouteName = isAuthenticated
    ? 'MainTabs'
    : hasCompletedOnboarding
      ? 'SignIn'
      : 'Onboarding';

  return (
    <>
      <AuthRedirectHandler />
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen
          name="UploadProduct"
          component={UploadProductScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ProductShoot"
          component={ProductShootScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="ShootResults"
          component={ShootResultsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="BrandDetails"
          component={BrandDetailsScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          // options={{ animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </>
  );
}

export default RootNavigator;
