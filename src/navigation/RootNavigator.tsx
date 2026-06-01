import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MainTabNavigator from './MainTabNavigator';
import BrandDetailsScreen from '../screens/BrandDetailsScreen';
import ProductShootScreen from '../screens/ProductShootScreen';
import ShootResultsScreen from '../screens/ShootResultsScreen';
import UploadProductScreen from '../screens/UploadProductScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{ headerShown: false }}
    >
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
    </Stack.Navigator>
  );
}

export default RootNavigator;
