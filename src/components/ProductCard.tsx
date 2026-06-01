import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppIcon from './AppIcon';
import type { ProductRecord } from '../services/products';
import { colors } from '../theme/colors';

type ProductCardProps = {
  product: ProductRecord;
  onPress: () => void;
};

function ProductCard({ product, onPress }: ProductCardProps) {
  const category = product.analysis?.category?.trim();
  const subtitle = category
    ? `${product.name} · ${category}`
    : product.name;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.thumb}>
        <Image
          resizeMode="contain"
          source={{ uri: product.imageUrl }}
          style={styles.image}
        />
      </View>

      <View style={styles.meta}>
        <Text numberOfLines={2} style={styles.title}>
          {product.name}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {subtitle}
        </Text>
      </View>

      <AppIcon color={colors.textSoft} name="chevron-right" size={20} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  chevron: {
    marginLeft: 8,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  meta: {
    flex: 1,
    marginLeft: 12,
    marginRight: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  thumb: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    height: 72,
    overflow: 'hidden',
    width: 72,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ProductCard;
