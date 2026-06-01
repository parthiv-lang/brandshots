import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme/colors';

export type ProductPreviewVariant = 'bag' | 'bottle';

type ProductPreviewPlaceholderProps = {
  variant: ProductPreviewVariant;
};

function ProductPreviewPlaceholder({ variant }: ProductPreviewPlaceholderProps) {
  return (
    <View style={styles.previewWrap}>
      {variant === 'bag' ? (
        <>
          <View style={styles.bagHandle} />
          <View style={styles.bagBody} />
        </>
      ) : (
        <>
          <View style={styles.bottleCap} />
          <View style={styles.bottleBody} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bagBody: {
    backgroundColor: '#16110E',
    borderRadius: 5,
    height: 74,
    width: 58,
  },
  bagHandle: {
    alignSelf: 'center',
    borderColor: '#2A211C',
    borderRadius: 5,
    borderWidth: 2,
    borderBottomWidth: 0,
    height: 8,
    marginBottom: 4,
    width: 28,
  },
  bottleBody: {
    backgroundColor: colors.white,
    borderRadius: 4,
    height: 64,
    width: 46,
  },
  bottleCap: {
    backgroundColor: '#8B7A6A',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    height: 6,
    marginBottom: 2,
    width: 18,
  },
  previewWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

export default ProductPreviewPlaceholder;
