import { Alert, Platform } from 'react-native';
import {
  check,
  openSettings,
  PERMISSIONS,
  type Permission,
  request,
  RESULTS,
} from 'react-native-permissions';

type PermissionMessages = {
  blockedMessage: string;
  blockedTitle: string;
  deniedMessage?: string;
  deniedTitle?: string;
  unavailableMessage?: string;
  unavailableTitle?: string;
};

function getAndroidApiLevel(): number {
  if (typeof Platform.Version === 'number') {
    return Platform.Version;
  }

  return Number.parseInt(Platform.Version, 10);
}

function promptOpenSettings(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Open settings',
      onPress: () => {
        openSettings().catch(() => {
          Alert.alert(
            'Unable to open settings',
            'Please open Settings manually and allow permission.',
          );
        });
      },
    },
  ]);
}

export async function requestPermission(
  permission: Permission,
  messages: PermissionMessages,
): Promise<boolean> {
  const {
    blockedMessage,
    blockedTitle,
    deniedMessage = 'Permission is required to continue. Please allow it and try again.',
    deniedTitle = 'Permission denied',
    unavailableMessage = 'This permission is unavailable on this device.',
    unavailableTitle = 'Feature unavailable',
  } = messages;

  const currentStatus = await check(permission);
  if (currentStatus === RESULTS.GRANTED || currentStatus === RESULTS.LIMITED) {
    return true;
  }

  if (currentStatus === RESULTS.BLOCKED) {
    promptOpenSettings(blockedTitle, blockedMessage);
    return false;
  }

  if (currentStatus === RESULTS.UNAVAILABLE) {
    Alert.alert(unavailableTitle, unavailableMessage);
    return false;
  }

  const requestedStatus = await request(permission);
  if (
    requestedStatus === RESULTS.GRANTED ||
    requestedStatus === RESULTS.LIMITED
  ) {
    return true;
  }

  if (requestedStatus === RESULTS.BLOCKED) {
    promptOpenSettings(blockedTitle, blockedMessage);
    return false;
  }

  Alert.alert(deniedTitle, deniedMessage);
  return false;
}

const cameraMessages: PermissionMessages = {
  blockedMessage: 'Enable Camera access in settings to take product photos.',
  blockedTitle: 'Camera permission needed',
};

const photoLibraryMessages: PermissionMessages = {
  blockedMessage: 'Enable Photos access in settings to pick product images.',
  blockedTitle: 'Photos permission needed',
};

export function ensureCameraPermission() {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.CAMERA
      : PERMISSIONS.ANDROID.CAMERA;

  return requestPermission(permission, cameraMessages);
}

export function ensurePhotoLibraryPermission() {
  if (Platform.OS === 'ios') {
    return requestPermission(PERMISSIONS.IOS.PHOTO_LIBRARY, photoLibraryMessages);
  }

  const permission =
    getAndroidApiLevel() >= 33
      ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
      : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

  return requestPermission(permission, {
    ...photoLibraryMessages,
    blockedTitle:
      permission === PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
        ? 'Storage permission needed'
        : photoLibraryMessages.blockedTitle,
    blockedMessage:
      permission === PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
        ? 'Enable Storage access in settings to pick product images.'
        : photoLibraryMessages.blockedMessage,
  });
}
