import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { PublicGeneration } from '../services/generations';
import { colors } from '../theme/colors';
import { formatRelativeTime } from '../utils/formatRelativeTime';
import ProductPreviewPlaceholder, {
  type ProductPreviewVariant,
} from './ProductPreviewPlaceholder';

const deleteIcon = require('../assets/delete-svgrepo-com.png');

const PREVIEW_HEIGHT_RATIO = 0.92;
const META_MIN_HEIGHT = 68;

type GenerationCardProps = {
  generation: PublicGeneration;
  previewVariant?: ProductPreviewVariant;
  width: number;
  isDeleting?: boolean;
  onDelete?: () => void;
  onPress?: () => void;
};

function getGenerationTitle(generation: PublicGeneration): string {
  return (
    generation.headline?.trim() ||
    generation.brandTitle?.trim() ||
    generation.nicheLabel?.trim() ||
    generation.mode?.trim().toUpperCase() ||
    'Untitled'
  );
}

function getGenerationMeta(generation: PublicGeneration): string {
  const label = (
    generation.platform?.trim() ||
    generation.platformLabel?.trim() ||
    generation.mode?.trim() ||
    'CREATIVE'
  ).toUpperCase();
  const time = formatRelativeTime(generation.createdAt);

  return time ? `${label} · ${time}` : label;
}

function getGenerationBadge(generation: PublicGeneration): string | null {
  const explicit =
    generation.lookLabel?.trim() ||
    generation.treatmentLabel?.trim() ||
    generation.categoryLabel?.trim();

  if (explicit) {
    return explicit;
  }

  const mode = generation.mode?.trim().toUpperCase();
  if (mode === 'PRODUCT_SHOOT') {
    return 'Studio';
  }
  if (mode === 'ADS_CREATIVE') {
    return 'Ad';
  }
  if (mode === 'SOCIAL_POSTER') {
    return 'Social';
  }

  return null;
}

type PreviewContentProps = {
  generation: PublicGeneration;
  hasImage: boolean;
  previewVariant: ProductPreviewVariant;
};

function PreviewContent({
  generation,
  hasImage,
  previewVariant,
}: PreviewContentProps) {
  if (hasImage) {
    return (
      <Image
        resizeMode="cover"
        source={{ uri: generation.imageUrl }}
        style={styles.previewImage}
      />
    );
  }

  return <ProductPreviewPlaceholder variant={previewVariant} />;
}

function GenerationCard({
  generation,
  previewVariant = 'bag',
  width,
  isDeleting = false,
  onDelete,
  onPress,
}: GenerationCardProps) {
  const hasImage = Boolean(generation.imageUrl?.trim());
  const badge = getGenerationBadge(generation);
  const previewHeight = Math.round(width * PREVIEW_HEIGHT_RATIO);
  const CardContainer = onPress ? TouchableOpacity : View;
  const cardContainerProps = onPress
    ? { activeOpacity: 0.85, onPress, disabled: isDeleting }
    : {};

  const title = getGenerationTitle(generation);
  const meta = getGenerationMeta(generation);

  return (
    <CardContainer
      {...cardContainerProps}
      style={[styles.card, { width }]}
    >
      <View style={[styles.previewArea, { height: previewHeight }]}>
        <PreviewContent
          generation={generation}
          hasImage={hasImage}
          previewVariant={previewVariant}
        />

        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}

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
      </View>

      <View style={styles.meta}>
        <Text numberOfLines={2} style={styles.title}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.metaText}>
          {meta}
        </Text>
      </View>
    </CardContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: colors.white,
    borderRadius: 8,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    top: 10,
    zIndex: 1,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
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
    zIndex: 3,
  },
  deleteIcon: {
    height: 14,
    tintColor: colors.textMuted,
    width: 14,
  },
  meta: {
    backgroundColor: colors.white,
    minHeight: META_MIN_HEIGHT,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  previewArea: {
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
  },
  previewImage: {
    ...StyleSheet.absoluteFill,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
});

export default GenerationCard;
