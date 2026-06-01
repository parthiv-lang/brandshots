import { Alert, Share } from 'react-native';

import { downloadImage } from './downloadImage';

export async function shareRemoteImage(remoteUrl: string): Promise<void> {
  try {
    const path = await downloadImage(remoteUrl);

    await Share.share({
      url: `file://${path}`,
    });
  } catch (error) {
    console.log('Share error:', error);
    Alert.alert('Share failed', 'Could not share this image.');
  }
}
