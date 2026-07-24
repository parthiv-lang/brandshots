import AsyncStorage from '@react-native-async-storage/async-storage';

import { resetTokenCache } from './tokenStorage';

export async function clearAllAsyncStorage(): Promise<void> {
  resetTokenCache();
  await AsyncStorage.clear();
}
