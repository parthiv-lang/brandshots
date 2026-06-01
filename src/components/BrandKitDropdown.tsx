import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { BrandKitRecord } from '../services/brands/types';
import { colors } from '../theme/colors';

import AppIcon from './AppIcon';

const brandPlaceholderIcon = require('../assets/brand-dribbble-svgrepo-com.png');

type BrandKitDropdownProps = {
  brands: BrandKitRecord[];
  selectedBrandId?: string;
  onChange: (brandId: string | undefined) => void;
  direction?: 'up' | 'down';
};

function formatBrandColors(brand: BrandKitRecord): string {
  const palette = brand.colors?.length
    ? brand.colors
    : brand.color
      ? [brand.color]
      : [];

  return palette
    .slice(0, 2)
    .map(color => color.trim())
    .filter(Boolean)
    .join(' · ');
}

function BrandKitDropdown({
  brands,
  selectedBrandId,
  onChange,
  direction = 'down',
}: BrandKitDropdownProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const defaultBrandId = brands.find(brand => brand.isDefault)?.id ?? brands[0]?.id;
  const activeBrandId = selectedBrandId ?? defaultBrandId;

  const selectedBrand = useMemo(
    () => brands.find(brand => brand.id === activeBrandId) ?? brands[0],
    [activeBrandId, brands],
  );

  if (brands.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyText}>No brand kits yet. Add one in Brand tab.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setMenuOpen(prev => !prev)}
        style={[styles.trigger, menuOpen && styles.triggerOpen]}
      >
        <View style={styles.triggerLeft}>
          {selectedBrand?.logoUrl ? (
            <Image
              resizeMode="contain"
              source={{ uri: selectedBrand.logoUrl }}
              style={styles.logo}
            />
          ) : (
            <Image
              resizeMode="contain"
              source={brandPlaceholderIcon}
              style={styles.logoPlaceholder}
            />
          )}
          <View style={styles.triggerText}>
            <Text numberOfLines={1} style={styles.brandTitle}>
              {selectedBrand?.title ?? 'Select brand'}
            </Text>
            {selectedBrand ? (
              <Text numberOfLines={1} style={styles.brandColors}>
                {formatBrandColors(selectedBrand) || 'Brand colors'}
              </Text>
            ) : null}
          </View>
        </View>
        <AppIcon
          color={colors.textMuted}
          name="chevron-down"
          size={12}
          style={[styles.chevron, menuOpen && styles.chevronOpen]}
        />
      </Pressable>

      {menuOpen ? (
        <View
          style={[
            styles.menu,
            direction === 'up' ? styles.menuUp : styles.menuDown,
          ]}
        >
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.menuScroll}
          >
            {brands.map(brand => {
              const isSelected = brand.id === activeBrandId;
              return (
                <Pressable
                  key={brand.id}
                  onPress={() => {
                    onChange(brand.id);
                    setMenuOpen(false);
                  }}
                  style={[styles.menuItem, isSelected && styles.menuItemSelected]}
                >
                  {brand.logoUrl ? (
                    <Image
                      resizeMode="contain"
                      source={{ uri: brand.logoUrl }}
                      style={styles.menuLogo}
                    />
                  ) : (
                    <Image
                      resizeMode="contain"
                      source={brandPlaceholderIcon}
                      style={styles.menuLogoPlaceholder}
                    />
                  )}
                  <View style={styles.menuText}>
                    <Text numberOfLines={1} style={styles.menuTitle}>
                      {brand.title}
                      {brand.isDefault ? ' · Default' : ''}
                    </Text>
                    <Text numberOfLines={1} style={styles.menuColors}>
                      {formatBrandColors(brand)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  brandColors: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  brandTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  chevron: {},
  chevronOpen: {
    transform: [{ rotate: '180deg' }],
  },
  emptyCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  logo: {
    borderRadius: 8,
    height: 36,
    width: 36,
  },
  logoPlaceholder: {
    height: 28,
    tintColor: colors.textMuted,
    width: 28,
  },
  menu: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    left: 0,
    maxHeight: 220,
    position: 'absolute',
    right: 0,
    zIndex: 30,
  },
  menuColors: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  menuDown: {
    top: '100%',
    marginTop: 6,
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemSelected: {
    backgroundColor: '#F6E8DE',
  },
  menuLogo: {
    borderRadius: 6,
    height: 28,
    width: 28,
  },
  menuLogoPlaceholder: {
    height: 22,
    tintColor: colors.textMuted,
    width: 22,
  },
  menuScroll: {
    maxHeight: 220,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  menuUp: {
    bottom: '100%',
    marginBottom: 6,
  },
  menuWrap: {},
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    marginRight: 8,
  },
  triggerOpen: {
    borderColor: colors.primary,
  },
  triggerText: {
    flex: 1,
  },
  wrap: {
    position: 'relative',
    zIndex: 20,
  },
});

export default BrandKitDropdown;
