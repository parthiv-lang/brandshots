import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import type { BrandKitRecord } from '../services/brands';
import { colors } from '../theme/colors';
const defaultStarIcon = require('../assets/star-sharp-svgrepo-com.png');

type BrandKitCardProps = {
  kit: BrandKitRecord;
  onPress?: () => void;
  onDelete?: () => void;
  onToggleDefault?: () => void;
};

function getPrimaryColor(kit: BrandKitRecord) {
  return kit.color?.trim() || kit.colors[0]?.trim() || colors.textMuted;
}

const deleteIcon = require('../assets/delete-svgrepo-com.png');

function BrandKitCard({
  kit,
  onPress,
  onDelete,
  onToggleDefault,
}: BrandKitCardProps) {
  const isDefault = kit.isDefault === true;
  const primaryColor = useMemo(() => getPrimaryColor(kit), [kit]);
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = Boolean(kit.logoUrl) && !logoFailed;
  const paletteColors = kit.colors.length > 0 ? kit.colors : [primaryColor];

  const content = (
    <View
      style={[
        styles.card,
        isDefault ? styles.cardDefault : styles.cardStandard,
      ]}
    >
      <View style={styles.cardActions}>
        {onDelete ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onDelete}
            style={styles.actionButton}
          >
            <Image source={deleteIcon} style={styles.deleteIcon} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={!onToggleDefault}
          onPress={onToggleDefault}
          style={[
            styles.actionButton,
            isDefault && styles.actionButtonDefault,
            !onToggleDefault && styles.actionButtonDisabled,
          ]}
        >
          <Image
            source={defaultStarIcon}
            style={[
              styles.defaultActionIcon,
              isDefault && styles.defaultActionIconActive,
            ]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.colorDots}>
        {paletteColors.map((color, index) => (
          <View
            key={`${kit.id}-color-${index}`}
            style={[styles.colorDot, { backgroundColor: color }]}
          />
        ))}
      </View>

      <View style={styles.body}>
        <View style={styles.logoBox}>
          {showLogo ? (
            <Image
              onError={() => setLogoFailed(true)}
              resizeMode="cover"
              source={{ uri: kit.logoUrl! }}
              style={styles.logoImage}
            />
          ) : (
            <View
              style={[styles.logoFallbackDot, { backgroundColor: primaryColor }]}
            />
          )}
        </View>

        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={styles.title}>
              {kit.title}
            </Text>
            {isDefault ? (
              <View style={styles.defaultBadge}>
                <Image source={defaultStarIcon} style={styles.defaultBadgeIcon} />
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            ) : null}
          </View>

          <Text numberOfLines={1} style={styles.website}>
            {kit.website}
          </Text>

          <Text ellipsizeMode="tail" numberOfLines={1} style={styles.description}>
            {kit.description}
          </Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.88} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    paddingRight: 60,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  cardDefault: {
    borderColor: 'rgba(199, 101, 59, 0.55)',
  },
  cardStandard: {
    borderColor: colors.border,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
    right: 12,
    top: 10,
    zIndex: 2,
  },
  colorDot: {
    borderRadius: 999,
    height: 10,
    width: 10,
  },
  colorDots: {
    flexDirection: 'row',
    gap: 5,
    position: 'absolute',
    right: 16,
    top: 46,
    zIndex: 1,
  },
  copy: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  defaultBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(199, 101, 59, 0.14)',
    borderRadius: 999,
    flexDirection: 'row',
    flexShrink: 0,
    gap: 4,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultBadgeText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  defaultBadgeIcon: {
    height: 10,
    tintColor: colors.primary,
    width: 10,
  },
  defaultActionIcon: {
    height: 12,
    tintColor: colors.textSoft,
    width: 12,
  },
  defaultActionIconActive: {
    tintColor: colors.white,
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  actionButtonDefault: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  deleteIcon: {
    height: 11,
    tintColor: colors.textMuted,
    width: 11,
  },
  logoBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 56,
  },
  logoFallbackDot: {
    borderRadius: 999,
    height: 22,
    width: 22,
  },
  logoImage: {
    height: '100%',
    width: '100%',
  },
  title: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minWidth: 0,
  },
  website: {
    color: colors.textSoft,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
});

export default BrandKitCard;
