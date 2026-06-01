import React from 'react';
import { Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandKitsScreen from '../screens/BrandKitsScreen';
import CreativesScreen from '../screens/CreativesScreen';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProductsScreen from '../screens/ProductsScreen';
import { colors } from '../theme/colors';

type TabParamList = {
  Create: undefined;
  Products: undefined;
  Brand: undefined;
  Creatives: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const BASE_TAB_BAR_HEIGHT = 64;

const TAB_ICON_SOURCES: Record<keyof TabParamList, ImageSourcePropType> = {
  Create: require('../assets/create-svgrepo-com.png'),
  Products: require('../assets/ad-product-svgrepo-com.png'),
  Brand: require('../assets/brand-dribbble-svgrepo-com.png'),
  Creatives: require('../assets/gallery-svgrepo-com (1).png'),
  Settings: require('../assets/settings-svgrepo-com.png'),
};

function getScreenOptions({
  route,
  bottomInset,
}: {
  route: {
    name: keyof TabParamList;
  };
  bottomInset: number;
}) {
  return {
    headerShown: false,
    sceneStyle: styles.scene,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.tabInactive,
    tabBarHideOnKeyboard: true,
    tabBarIcon: ({
      color,
      size,
    }: {
      color: string;
      size: number;
    }) => (
      <Image
        resizeMode="contain"
        source={TAB_ICON_SOURCES[route.name]}
        style={[
          styles.tabIcon,
          {
            height: size - 1,
            tintColor: color,
            width: size - 1,
          },
        ]}
      />
    ),
    tabBarItemStyle: styles.tabBarItem,
    tabBarLabelStyle: styles.tabLabel,
    tabBarStyle: [
      styles.tabBar,
      {
        height: BASE_TAB_BAR_HEIGHT + bottomInset,
        paddingBottom: bottomInset,
      },
    ],
  };
}

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      initialRouteName="Create"
      screenOptions={({ route }) => getScreenOptions({ route, bottomInset })}
    >
      <Tab.Screen name="Create" component={HomeScreen} />
      <Tab.Screen name="Products" component={ProductsScreen} />
      <Tab.Screen name="Brand" component={BrandKitsScreen} />
      <Tab.Screen name="Creatives" component={CreativesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  scene: {
    backgroundColor: colors.background,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.borderSoft,
    paddingTop: 8,
  },
  tabBarItem: {
    paddingVertical: 4,
  },
  tabIcon: {
    alignSelf: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default MainTabNavigator;
