import { Alert, PermissionsAndroid, Platform } from 'react-native';
import * as RNFS from 'react-native-fs';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { PERMISSIONS } from 'react-native-permissions';

import { requestPermission } from './permissions';

const getImageExtensionFromUrl = (url: string): string => {
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  if (clean.endsWith('.png')) return 'png';
  if (clean.endsWith('.webp')) return 'webp';
  if (clean.endsWith('.gif')) return 'gif';
  if (clean.endsWith('.bmp')) return 'bmp';
  if (clean.endsWith('.heic')) return 'heic';
  if (clean.endsWith('.heif')) return 'heif';
  if (clean.endsWith('.avif')) return 'avif';
  if (clean.endsWith('.jpeg') || clean.endsWith('.jpg')) return 'jpg';
  return 'jpg';
};

export async function downloadImage(url: string): Promise<string> {
  const ext = getImageExtensionFromUrl(url);
  const path = `${RNFS.CachesDirectoryPath}/Brandshots_${Date.now()}.${ext}`;

  const result = await RNFS.downloadFile({
    fromUrl: url,
    toFile: path,
    headers: {
      Accept: 'image/*',
      'User-Agent': 'Mozilla/5.0',
    },
    background: true,
    discretionary: true,
  }).promise;

  if (result.statusCode !== 200) {
    throw new Error('Download failed');
  }

  const resultWithHeaders = result as typeof result & {
    headers?: Record<string, string> | undefined;
  };
  const contentType =
    resultWithHeaders.headers?.['Content-Type'] ??
    resultWithHeaders.headers?.['content-type'];
  if (contentType && !contentType.toLowerCase().startsWith('image/')) {
    throw new Error(
      `Downloaded file is not an image (received ${contentType})`,
    );
  }

  return path;
}

async function ensureSaveToPhotosPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return requestPermission(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY, {
      blockedTitle: 'Photos permission needed',
      blockedMessage:
        'Enable Photos access in settings to save generated images.',
    });
  }

  const version = Platform.Version as number;
  let permission: string;

  if (version >= 33) {
    permission = PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES;
  } else if (version >= 29) {
    return true;
  } else {
    permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  }

  const granted = await PermissionsAndroid.request(
    permission as Parameters<typeof PermissionsAndroid.request>[0],
  );

  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    Alert.alert(
      'Permission denied',
      'Storage permission is required to save the image.',
    );
    return false;
  }

  return true;
}

export async function downloadImageToGallery(
  imageUrl: string,
): Promise<boolean> {
  const trimmedUrl = imageUrl.trim();
  if (!trimmedUrl) {
    return false;
  }

  const hasPermission = await ensureSaveToPhotosPermission();
  if (!hasPermission) {
    return false;
  }

  try {
    const path = await downloadImage(trimmedUrl);
    const fileUri = path.startsWith('file://') ? path : `file://${path}`;
    await CameraRoll.save(fileUri, { type: 'photo' });
    Alert.alert('Saved', 'Image saved to your photo library.');
    return true;
  } catch (error) {
    console.log('Download error:', error);
    Alert.alert(
      'Download failed',
      'Could not save this image. Please try again.',
    );
    return false;
  }
}
