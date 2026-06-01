import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { ProductRecord } from '../services/products';
import { colors } from '../theme/colors';
import {
  formatJustUploaded,
  getAngleImageUrls,
  getProductDetails,
  isProductPending,
} from '../utils/productDisplay';

const deleteIcon = require('../assets/delete-svgrepo-com.png');

const PREVIEW_HEIGHT_RATIO = 0.92;
const META_MIN_HEIGHT = 68;

type ProductGridCardProps = {
  width: number;
  product?: ProductRecord;
  variant?: 'add' | 'product';
  isDeleting?: boolean;
  onPress: () => void;
  onDelete?: () => void;
};

function ProductGridCard({
  width,
  product,
  variant = 'product',
  isDeleting = false,
  onPress,
  onDelete,
}: ProductGridCardProps) {
  const previewHeight = Math.round(width * PREVIEW_HEIGHT_RATIO);

  if (variant === 'add') {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[styles.card, styles.addCard, { width }]}
      >
        <View
          style={[styles.addInner, { minHeight: previewHeight + META_MIN_HEIGHT }]}
        >
          <View style={styles.addIconCircle}>
            <Text style={styles.addIcon}>+</Text>
          </View>
          <Text style={styles.addLabel}>ADD PRODUCT</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (!product) {
    return null;
  }

  const pending = isProductPending(product);
  const angleUrls = getAngleImageUrls(product.angleImages);
  const showQuadPreview = angleUrls.length >= 2;
  const subtitle =
    product.analysis?.category?.trim() ||
    product.analysis?.productType?.trim() ||
    '';
  const details = getProductDetails(product);

  return (
    <View style={[styles.card, { width }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isDeleting}
        onPress={onPress}
        style={[styles.previewArea, { height: previewHeight }]}
      >
        {showQuadPreview ? (
          <View style={styles.quadGrid}>
            {Array.from({ length: 4 }).map((_, index) => {
              const uri = angleUrls[index] || product.imageUrl;
              return (
                <View key={index} style={styles.quadCell}>
                  {uri ? (
                    <Image
                      resizeMode="cover"
                      source={{ uri }}
                      style={styles.quadImage}
                    />
                  ) : (
                    <View style={styles.quadPlaceholder} />
                  )}
                </View>
              );
            })}
          </View>
        ) : product.imageUrl ? (
          <Image
            resizeMode="cover"
            source={{ uri: product.imageUrl }}
            style={styles.previewImage}
          />
        ) : (
          <View style={styles.previewPlaceholder} />
        )}

        {onDelete ? (
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={isDeleting}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            onPress={onDelete}
            style={styles.deleteButton}
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.textMuted} size="small" />
            ) : (
              <Image
                resizeMode="contain"
                source={deleteIcon}
                style={styles.deleteIcon}
              />
            )}
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        disabled={isDeleting}
        onPress={onPress}
        style={styles.meta}
      >
        {pending ? (
          <>
            <Text numberOfLines={1} style={styles.pendingTitle}>
              Pending analysis
            </Text>
            <Text numberOfLines={1} style={styles.pendingMeta}>
              {formatJustUploaded(product.createdAt)}
            </Text>
          </>
        ) : (
          <>
            <Text numberOfLines={1} style={styles.title}>
              {product.name}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} style={styles.subtitle}>
                {subtitle}
              </Text>
            ) : null}
            {details ? (
              <Text numberOfLines={1} style={styles.details}>
                {details}
              </Text>
            ) : null}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  addCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  addIcon: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  addIconCircle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  addInner: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  addLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginTop: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 8,
    overflow: 'hidden',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 8,
    top: 8,
    width: 28,
    zIndex: 2,
  },
  deleteIcon: {
    height: 14,
    tintColor: colors.textMuted,
    width: 14,
  },
  details: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
    textTransform: 'lowercase',
  },
  meta: {
    backgroundColor: colors.white,
    minHeight: META_MIN_HEIGHT,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pendingMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  pendingTitle: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  previewArea: {
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  previewImage: {
    height: '100%',
    width: '100%',
  },
  previewPlaceholder: {
    backgroundColor: colors.surfaceMuted,
    flex: 1,
  },
  quadCell: {
    backgroundColor: colors.darkCard,
    height: '50%',
    overflow: 'hidden',
    width: '50%',
  },
  quadGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quadImage: {
    height: '100%',
    width: '100%',
  },
  quadPlaceholder: {
    backgroundColor: colors.darkCard,
    flex: 1,
  },
  subtitle: {
    color: colors.text,
    fontSize: 13,
    marginTop: 2,
    textTransform: 'lowercase',
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
});

export default ProductGridCard;
