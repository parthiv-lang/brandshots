import AsyncStorage from '@react-native-async-storage/async-storage';

import { ONBOARDING_COMPLETED_KEY } from '../../constants/storage';

export async function loadOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
  return value === 'true';
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
}
