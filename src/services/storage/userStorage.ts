import AsyncStorage from '@react-native-async-storage/async-storage';

import { AUTH_ME_KEY } from '../../constants/storage';
import type { MeResponse } from '../auth/types';

export async function saveMe(data: MeResponse): Promise<void> {
  await AsyncStorage.setItem(AUTH_ME_KEY, JSON.stringify(data));
}

export async function removeMe(): Promise<void> {
  await AsyncStorage.removeItem(AUTH_ME_KEY);
}
