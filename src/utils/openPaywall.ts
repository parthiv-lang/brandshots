import { store } from '../store';
import { selectIsAuthenticated } from '../store/slices/authSlice';
import type { RootStackParamList } from '../navigation/types';

type PaywallNavigation = {
  navigate: <RouteName extends keyof RootStackParamList>(
    screen: RouteName,
    params?: RootStackParamList[RouteName],
  ) => void;
};

export function openPaywall(navigation: PaywallNavigation): void {
  const isAuthenticated = selectIsAuthenticated(store.getState());

  if (!isAuthenticated) {
    navigation.navigate('SignIn', { redirectTo: 'Paywall' });
    return;
  }

  navigation.navigate('Paywall');
}
