import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppIcon from './AppIcon';

import { brandsApi } from '../services/brands';
import type { BrandKitRecord } from '../services/brands/types';
import { colors } from '../theme/colors';
import BrandKitDropdown from './BrandKitDropdown';
import CompactSelectDropdown from './CompactSelectDropdown';
import {
  AD_CTA_OPTIONS,
  AD_TONE_OPTIONS,
  AUDIENCE_STAGE_OPTIONS,
  CAMPAIGN_GOAL_OPTIONS,
} from '../types/shootDetails';
import type {
  PhysicalDimensionUnit,
  PhysicalDimensions,
  ProductShootDetails,
  ShootType,
  SocialAdShootDetails,
} from '../types/shootDetails';
import { ensurePhotoLibraryPermission } from '../utils/permissions';

const starIcon = require('../assets/star-sharp-svgrepo-com.png');

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif' });
const monospaceFont = Platform.select({ ios: 'Menlo', android: 'monospace' });
const WINDOW_HEIGHT = Dimensions.get('window').height;

const UNIT_OPTIONS: PhysicalDimensionUnit[] = ['cm', 'in', 'mm'];

const UNIT_SELECT_OPTIONS = UNIT_OPTIONS.map(unit => ({
  value: unit,
  label: unit,
}));

const EMPTY_PHYSICAL_DIMENSIONS: PhysicalDimensions = {
  width: 0,
  height: 0,
  unit: 'cm',
};

function getPhysicalDimensions(
  details: ProductShootDetails,
): PhysicalDimensions {
  return details.physicalDimensions ?? EMPTY_PHYSICAL_DIMENSIONS;
}

type ShootDetailsModalProps = {
  visible: boolean;
  shootType: ShootType;
  productDetails: ProductShootDetails;
  socialAdDetails: SocialAdShootDetails;
  onClose: () => void;
  onSave: (payload: {
    productDetails: ProductShootDetails;
    socialAdDetails: SocialAdShootDetails;
  }) => void;
};

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  filled?: boolean;
  rect?: boolean;
};

function Chip({ label, selected, onPress, filled, rect }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        rect ? styles.chipRect : styles.chip,
        selected && (filled ? styles.chipFilled : styles.chipSelected),
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          selected && (filled ? styles.chipLabelFilled : styles.chipLabelSelected),
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function parseOptionalNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function ProductShootDetailsForm({
  brands,
  draft,
  onChange,
  variant = 'default',
}: {
  brands: BrandKitRecord[];
  draft: ProductShootDetails;
  onChange: (next: ProductShootDetails) => void;
  variant?: 'default' | 'ads';
}) {
  const isAdsVariant = variant === 'ads';
  const physical = getPhysicalDimensions(draft);
  const unit = physical.unit ?? 'cm';
  const [widthText, setWidthText] = useState(
    physical.width && physical.width > 0 ? String(physical.width) : '',
  );
  const [heightText, setHeightText] = useState(
    physical.height && physical.height > 0 ? String(physical.height) : '',
  );
  const [depthText, setDepthText] = useState(
    physical.depth && physical.depth > 0 ? String(physical.depth) : '',
  );

  useEffect(() => {
    const nextPhysical = getPhysicalDimensions(draft);
    setWidthText(
      nextPhysical.width > 0 ? String(nextPhysical.width) : '',
    );
    setHeightText(
      nextPhysical.height > 0 ? String(nextPhysical.height) : '',
    );
    setDepthText(
      nextPhysical.depth && nextPhysical.depth > 0
        ? String(nextPhysical.depth)
        : '',
    );
  }, [
    draft.physicalDimensions?.width,
    draft.physicalDimensions?.height,
    draft.physicalDimensions?.depth,
  ]);

  const updatePhysical = (patch: Partial<PhysicalDimensions>) => {
    onChange({
      ...draft,
      physicalDimensions: {
        ...physical,
        ...patch,
      },
    });
  };

  const pickReference = async (field: 'styleReferenceUri' | 'backgroundReferenceUri') => {
    const allowed = await ensurePhotoLibraryPermission();
    if (!allowed) {
      return;
    }

    launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 1 }, response => {
      const uri = response.assets?.[0]?.uri;
      if (uri) {
        onChange({ ...draft, [field]: uri });
      }
    });
  };

  return (
    <>
      <View style={styles.sectionBlock}>
        {isAdsVariant ? (
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTag}>BRAND</Text>
            <Text style={styles.sectionHint}>Optional</Text>
          </View>
        ) : (
          <Text style={styles.sectionTag}>BRAND</Text>
        )}
        <BrandKitDropdown
          brands={brands}
          onChange={brandId =>
            onChange({
              ...draft,
              useBrandKit: Boolean(brandId),
              brandId,
            })
          }
          selectedBrandId={draft.brandId}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionBlock}>
        {isAdsVariant ? (
          <View style={styles.sectionHeadingRow}>
            <Text style={styles.sectionTag}>REFERENCES</Text>
            <Text style={styles.sectionHint}>Optional image cues</Text>
          </View>
        ) : (
          <Text style={styles.sectionTag}>REFERENCE IMAGES</Text>
        )}
        <View style={styles.referenceRow}>
          <View style={styles.referenceColumn}>
            <View style={styles.referenceHeader}>
              <Image resizeMode="contain" source={starIcon} style={styles.referenceIcon} />
              <Text style={styles.referenceTitle}>Style reference</Text>
            </View>
            <Pressable
              onPress={() => pickReference('styleReferenceUri')}
              style={styles.uploadBox}
            >
              {draft.styleReferenceUri ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: draft.styleReferenceUri }}
                  style={styles.uploadPreview}
                />
              ) : (
                <Text style={styles.uploadLabel}>+ Upload</Text>
              )}
            </Pressable>
            <Text style={styles.referenceHint}>
              Mood, lighting, color cue. Subject not copied.
            </Text>
          </View>

          <View style={styles.referenceColumn}>
            <View style={styles.referenceHeader}>
              <AppIcon color={colors.text} name="layout" size={15} />
              <Text style={styles.referenceTitle}>Background reference</Text>
            </View>
            <Pressable
              onPress={() => pickReference('backgroundReferenceUri')}
              style={styles.uploadBox}
            >
              {draft.backgroundReferenceUri ? (
                <Image
                  resizeMode="cover"
                  source={{ uri: draft.backgroundReferenceUri }}
                  style={styles.uploadPreview}
                />
              ) : (
                <Text style={styles.uploadLabel}>+ Upload</Text>
              )}
            </Pressable>
            <Text style={styles.referenceHint}>
              The model places the product INTO this scene.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionBlock}>
        <View style={styles.physicalHeaderRow}>
          <Text style={styles.physicalTitle}>PRODUCT DIMENSIONS</Text>
          <Text style={styles.physicalSubtitle}>
            {isAdsVariant
              ? '· Real-world size — for proportional scale'
              : '· REAL-WORLD SIZE, HELPS THE MODEL RENDER AT PROPORTIONAL SCALE'}
          </Text>
        </View>

        <View style={styles.physicalInputCard}>
          <View style={styles.physicalInputRow}>
            <View style={styles.physicalInputField}>
              <Text style={styles.fieldLabel}>WIDTH</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={value => {
                  setWidthText(value);
                  updatePhysical({ width: parseOptionalNumber(value) ?? 0 });
                }}
                placeholder=""
                placeholderTextColor={colors.textSoft}
                style={styles.physicalInputValue}
                value={widthText}
              />
              <View style={styles.physicalInputUnderline} />
            </View>

            <View style={styles.physicalInputField}>
              <Text style={styles.fieldLabel}>HEIGHT</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={value => {
                  setHeightText(value);
                  updatePhysical({ height: parseOptionalNumber(value) ?? 0 });
                }}
                placeholder=""
                placeholderTextColor={colors.textSoft}
                style={styles.physicalInputValue}
                value={heightText}
              />
              <View style={styles.physicalInputUnderline} />
            </View>

            <View style={styles.physicalInputField}>
              <Text style={styles.fieldLabel}>DEPTH (OPT)</Text>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={value => {
                  setDepthText(value);
                  updatePhysical({ depth: parseOptionalNumber(value) });
                }}
                placeholder=""
                placeholderTextColor={colors.textSoft}
                style={styles.physicalInputValue}
                value={depthText}
              />
              <View style={styles.physicalInputUnderline} />
            </View>
          </View>

          <Text style={[styles.fieldLabel, styles.unitLabel]}>UNIT</Text>
          <View style={styles.unitDropdownWrap}>
            <CompactSelectDropdown
              direction="up"
              minWidth={88}
              onChange={nextUnit =>
                updatePhysical({ unit: nextUnit as PhysicalDimensionUnit })
              }
              options={UNIT_SELECT_OPTIONS}
              triggerStyle={styles.unitDropdown}
              value={unit}
              valueStyle={styles.unitDropdownText}
            />
          </View>
        </View>
      </View>
    </>
  );
}

export function AdStrategyDetailsForm({
  draft,
  onChange,
}: {
  draft: SocialAdShootDetails;
  onChange: (next: SocialAdShootDetails) => void;
}) {
  const [ctaMenuOpen, setCtaMenuOpen] = useState(false);

  const ctaLabel = useMemo(() => {
    return (
      AD_CTA_OPTIONS.find(option => option.id === (draft.cta ?? 'auto'))?.label ??
      'Auto-select'
    );
  }, [draft.cta]);

  return (
    <>
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTag}>AUDIENCE</Text>
          <Text style={styles.sectionHint}>Who is this ad for?</Text>
        </View>

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>TARGET AUDIENCE</Text>
        <TextInput
          onChangeText={targetAudience => onChange({ ...draft, targetAudience })}
          placeholder="e.g. Young professionals 25–40, fragrance & grooming"
          placeholderTextColor={colors.textSoft}
          style={styles.underlineField}
          value={draft.targetAudience ?? ''}
        />
        <View style={styles.underlineFieldLine} />

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>STAGE</Text>
        <View style={styles.chipRow}>
          {AUDIENCE_STAGE_OPTIONS.map(option => (
            <Chip
              key={option.id}
              label={option.label.toUpperCase()}
              onPress={() => onChange({ ...draft, stage: option.id })}
              rect
              selected={draft.stage === option.id}
            />
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTag}>CREATIVE</Text>
          <Text style={styles.sectionHint}>How it should feel and read</Text>
        </View>

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>TONE</Text>
        <View style={styles.chipRow}>
          {AD_TONE_OPTIONS.map(option => (
            <Chip
              key={option.id}
              label={option.label.toUpperCase()}
              onPress={() => onChange({ ...draft, tone: option.id })}
              rect
              selected={draft.tone === option.id}
            />
          ))}
        </View>

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
          OFFER · OPTIONAL
        </Text>
        <TextInput
          onChangeText={offer => onChange({ ...draft, offer })}
          placeholder="20% off · free shipping · bundle deal"
          placeholderTextColor={colors.textSoft}
          style={styles.underlineField}
          value={draft.offer ?? ''}
        />
        <View style={styles.underlineFieldLine} />

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>CTA</Text>
        <Pressable
          onPress={() => setCtaMenuOpen(prev => !prev)}
          style={styles.dropdownField}
        >
          <Text style={styles.dropdownText}>{ctaLabel}</Text>
          <AppIcon color={colors.textMuted} name="chevron-down" size={14} />
        </Pressable>
        {ctaMenuOpen ? (
          <View style={styles.dropdownMenu}>
            {AD_CTA_OPTIONS.map(option => (
              <Pressable
                key={option.id}
                onPress={() => {
                  onChange({ ...draft, cta: option.id });
                  setCtaMenuOpen(false);
                }}
                style={styles.dropdownMenuItem}
              >
                <Text style={styles.dropdownMenuText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
          SOCIAL PROOF · REAL NUMBERS ONLY — WE WON'T INVENT ANY
        </Text>
        <View style={styles.socialProofField}>
          <AppIcon color={colors.textMuted} name="star" size={14} />
          <TextInput
            onChangeText={socialProof => onChange({ ...draft, socialProof })}
            placeholder="4.9 · 10,000+ customers · dermatologist tested"
            placeholderTextColor={colors.textSoft}
            style={styles.socialProofInput}
            value={draft.socialProof ?? ''}
          />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTag}>STRATEGY</Text>
          <Text style={styles.sectionHint}>Campaign overrides</Text>
        </View>

        <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>
          CAMPAIGN GOAL · OPTIONAL
        </Text>
        <View style={styles.chipRow}>
          {CAMPAIGN_GOAL_OPTIONS.map(option => (
            <Chip
              key={option.id}
              label={option.label.toUpperCase()}
              onPress={() =>
                onChange({
                  ...draft,
                  campaignGoal:
                    draft.campaignGoal === option.id ? undefined : option.id,
                })
              }
              rect
              selected={draft.campaignGoal === option.id}
            />
          ))}
        </View>
      </View>
    </>
  );
}

function ShootDetailsModal({
  visible,
  shootType,
  productDetails,
  socialAdDetails,
  onClose,
  onSave,
}: ShootDetailsModalProps) {
  const insets = useSafeAreaInsets();
  const [productDraft, setProductDraft] =
    useState<ProductShootDetails>(productDetails);
  const [socialAdDraft, setSocialAdDraft] =
    useState<SocialAdShootDetails>(socialAdDetails);
  const [brandKits, setBrandKits] = useState<BrandKitRecord[]>([]);

  useEffect(() => {
    if (visible) {
      setProductDraft(productDetails);
      setSocialAdDraft(socialAdDetails);
    }
  }, [visible, productDetails, socialAdDetails]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    brandsApi
      .list()
      .then(response => {
        if (!cancelled) {
          setBrandKits(response.items);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBrandKits([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible, shootType]);

  useEffect(() => {
    if (!visible || brandKits.length === 0) {
      return;
    }

    const defaultBrand = brandKits.find(brand => brand.isDefault) ?? brandKits[0];
    if (!defaultBrand) {
      return;
    }

    setProductDraft(current => {
      if (current.useBrandKit === false || current.brandId) {
        return current;
      }

      return { ...current, useBrandKit: true, brandId: defaultBrand.id };
    });
  }, [brandKits, visible]);

  const handleSave = () => {
    const cleanedProduct: ProductShootDetails = { ...productDraft };

    if (cleanedProduct.physicalDimensions) {
      const { width, height, depth, unit } = cleanedProduct.physicalDimensions;
      const hasSize = (width ?? 0) > 0 || (height ?? 0) > 0 || (depth ?? 0) > 0;

      if (!hasSize) {
        delete cleanedProduct.physicalDimensions;
      } else {
        cleanedProduct.physicalDimensions = {
          width: width ?? 0,
          height: height ?? 0,
          ...(depth && depth > 0 ? { depth } : {}),
          unit: unit ?? 'cm',
        };
      }
    }

    onSave({
      productDetails: cleanedProduct,
      socialAdDetails: socialAdDraft,
    });
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <BlurView
          blurAmount={8}
          blurType="light"
          reducedTransparencyFallbackColor={colors.background}
          style={StyleSheet.absoluteFill}
        />
        <Pressable onPress={onClose} style={styles.backdrop} />

        <View
          style={[
            styles.sheet,
            {
              maxHeight: WINDOW_HEIGHT - insets.top - 12,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <Pressable hitSlop={12} onPress={onClose} style={styles.closeButton}>
              <AppIcon color={colors.text} name="x" size={20} />
            </Pressable>

            <View style={styles.headerTitleWrap}>
              <Text style={styles.title}>
                More <Text style={styles.titleAccent}>details</Text>
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSave}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>SAVE</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {shootType === 'ad' ? (
              <>
                <AdStrategyDetailsForm
                  draft={socialAdDraft}
                  onChange={setSocialAdDraft}
                />
                <View style={styles.divider} />
                <ProductShootDetailsForm
                  brands={brandKits}
                  draft={productDraft}
                  onChange={setProductDraft}
                  variant="ads"
                />
              </>
            ) : (
              <ProductShootDetailsForm
                brands={brandKits}
                draft={productDraft}
                onChange={setProductDraft}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 10, 9, 0.28)',
  },
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipRect: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  chipFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  chipLabelFilled: {
    color: colors.white,
  },
  chipLabelSelected: {
    color: colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chipSelected: {
    backgroundColor: '#F6E8DE',
    borderColor: colors.primary,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: 22,
  },
  dropdownChevron: {
    height: 10,
    tintColor: colors.textMuted,
    width: 10,
  },
  dropdownField: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownMenu: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  dropdownMenuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownMenuText: {
    color: colors.text,
    fontSize: 13,
  },
  dropdownText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 0,
  },
  fieldLabelSpaced: {
    marginTop: 18,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(35, 26, 22, 0.16)',
    borderRadius: 999,
    height: 5,
    marginBottom: 14,
    width: 52,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  headerTitleWrap: {
    flex: 1,
    paddingHorizontal: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  physicalHeaderRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  physicalInputCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 14,
    overflow: 'visible',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  physicalInputField: {
    flex: 1,
  },
  physicalInputRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 12,
  },
  physicalInputUnderline: {
    backgroundColor: colors.border,
    height: 1,
    marginTop: 8,
  },
  physicalInputValue: {
    color: colors.text,
    fontFamily: monospaceFont,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
    paddingVertical: 0,
  },
  physicalSubtitle: {
    color: colors.textSoft,
    flex: 1,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 13,
    marginTop: 2,
  },
  physicalTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  referenceColumn: {
    flex: 1,
  },
  referenceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  referenceRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  referenceHint: {
    color: colors.textSoft,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  referenceIcon: {
    height: 14,
    tintColor: colors.primary,
    width: 14,
  },
  referenceTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: colors.apple,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sheetContent: {
    paddingBottom: 24,
    paddingTop: 4,
  },
  sectionBlock: {
    marginTop: 8,
    paddingTop: 4,
  },
  sectionHeadingRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHint: {
    color: colors.textSoft,
    fontSize: 12,
  },
  sectionTag: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  socialProofField: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  socialProofInput: {
    color: colors.text,
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  splitField: {
    flex: 1,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  textField: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  underlineField: {
    color: colors.text,
    fontSize: 14,
    marginTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 0,
    paddingVertical: 4,
  },
  underlineFieldLine: {
    backgroundColor: colors.border,
    height: 1,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 26,
    lineHeight: 30,
  },
  titleAccent: {
    color: colors.primary,
    fontStyle: 'italic',
  },
  unitDropdownWrap: {
    alignSelf: 'flex-start',
    marginTop: 8,
    overflow: 'visible',
    zIndex: 10,
  },
  unitDropdown: {
    gap: 8,
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  unitDropdownText: {
    color: colors.text,
    fontFamily: monospaceFont,
    fontSize: 14,
    fontWeight: '700',
  },
  unitLabel: {
    marginTop: 18,
  },
  uploadBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1,
    height: 112,
    justifyContent: 'center',
    marginTop: 10,
    overflow: 'hidden',
  },
  uploadLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  uploadPreview: {
    height: '100%',
    width: '100%',
  },
});

export default ShootDetailsModal;
