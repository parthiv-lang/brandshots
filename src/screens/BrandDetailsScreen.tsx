import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable as RNPressable,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Asset,
  ImagePickerResponse,
  launchImageLibrary,
} from 'react-native-image-picker';

import HeaderBackButton from '../components/HeaderBackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import ColorPicker from 'react-native-wheel-color-picker';

import BlockingLoadingOverlay from '../components/BlockingLoadingOverlay';
import type { ApiError } from '../services/api';
import { brandsApi } from '../services/brands';
import { colors } from '../theme/colors';
import {
  getContrastTextColor,
  isValidHexColor,
  normalizeHexColor,
} from '../utils/brandColors';
import { ensurePhotoLibraryPermission } from '../utils/permissions';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'BrandDetails'>;

const MAX_LOGO_BYTES = 3 * 1024 * 1024;

const COLOR_SLOTS = [
  { id: 'primary', label: 'PRIMARY', optional: false },
  { id: 'secondary', label: 'SECONDARY', optional: true },
  { id: 'accent', label: 'ACCENT', optional: true },
] as const;
const defaultStarIcon = require('../assets/star-sharp-svgrepo-com.png');

type ColorSlotId = (typeof COLOR_SLOTS)[number]['id'];

function buildInitialColorValues(colors?: string[]): Record<ColorSlotId, string> {
  return {
    primary: colors?.[0] ?? '',
    secondary: colors?.[1] ?? '',
    accent: colors?.[2] ?? '',
  };
}

function formatFileSize(bytes?: number) {
  if (!bytes) {
    return '';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BrandDetailsScreen({ navigation, route }: Props) {
  const [editingBrandId, setEditingBrandId] = useState<string | null>(
    route.params?.brandId ?? null,
  );
  const [title, setTitle] = useState(route.params?.title ?? '');
  const [website, setWebsite] = useState(route.params?.website ?? '');
  const [description, setDescription] = useState(route.params?.description ?? '');
  const [logoDescription, setLogoDescription] = useState(
    route.params?.logoDescription ?? '',
  );
  const [colorValues, setColorValues] = useState<Record<ColorSlotId, string>>(
    buildInitialColorValues(route.params?.colors),
  );
  const [isDefault, setIsDefault] = useState(route.params?.isDefault ?? false);
  const [logoUri, setLogoUri] = useState<string | null>(
    route.params?.logoUrl ?? null,
  );
  const [logoFileName, setLogoFileName] = useState<string | undefined>(
    route.params?.logoUrl ? 'brand-logo.png' : undefined,
  );
  const [logoMime, setLogoMime] = useState<string | undefined>(
    route.params?.logoMime ?? undefined,
  );
  const [logoFileSize, setLogoFileSize] = useState<number | undefined>();
  const [isSaving, setSaving] = useState(false);
  const [activeColorSlot, setActiveColorSlot] = useState<ColorSlotId | null>(null);
  const [pickerColor, setPickerColor] = useState('#CC4A24');
  const [pickerInitialColor, setPickerInitialColor] = useState('#CC4A24');
  const actionButtonLabel = editingBrandId ? 'UPDATE BRAND KIT' : 'SAVE BRAND KIT';

  const headerTitle = title.trim() || 'New brand kit';

  const resolvedColors = useMemo(() => {
    return COLOR_SLOTS.map(slot => normalizeHexColor(colorValues[slot.id])).filter(
      (color): color is string => Boolean(color),
    );
  }, [colorValues]);

  const palettePreview = useMemo(
    () =>
      COLOR_SLOTS.map(slot => ({
        ...slot,
        hex: normalizeHexColor(colorValues[slot.id]),
      })).filter(entry => entry.hex),
    [colorValues],
  );

  const updateColorValue = (slotId: ColorSlotId, value: string) => {
    setColorValues(prev => ({ ...prev, [slotId]: value }));
  };

  const normalizeColorValue = (slotId: ColorSlotId) => {
    const normalized = normalizeHexColor(colorValues[slotId]);
    if (!normalized) {
      return;
    }

    setColorValues(prev => ({ ...prev, [slotId]: normalized }));
  };

  const openColorPicker = (slotId: ColorSlotId) => {
    const currentColor = normalizeHexColor(colorValues[slotId]) || '#CC4A24';
    setPickerColor(currentColor);
    setPickerInitialColor(currentColor);
    setActiveColorSlot(slotId);
  };

  const handleCancelColorPicker = () => {
    setPickerColor(pickerInitialColor);
    setActiveColorSlot(null);
  };

  const handleDoneColorPicker = () => {
    if (activeColorSlot) {
      updateColorValue(activeColorSlot, pickerColor);
    }
    setActiveColorSlot(null);
  };

  const clearColorValue = (slotId: ColorSlotId) => {
    setColorValues(prev => ({ ...prev, [slotId]: '' }));
  };

  const handlePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert(
        'Unable to continue',
        response.errorMessage || 'Could not open your photo library.',
      );
      return;
    }

    const asset: Asset | undefined = response.assets?.[0];
    if (!asset?.uri) {
      Alert.alert('No image selected', 'Please choose a valid image and try again.');
      return;
    }

    if (asset.fileSize && asset.fileSize > MAX_LOGO_BYTES) {
      Alert.alert('File too large', 'Brand logos must be 3 MB or smaller.');
      return;
    }

    setLogoUri(asset.uri);
    setLogoFileName(asset.fileName ?? undefined);
    setLogoMime(asset.type ?? undefined);
    setLogoFileSize(asset.fileSize ?? undefined);
  };

  const handlePickLogo = async () => {
    if (!(await ensurePhotoLibraryPermission())) {
      return;
    }

    launchImageLibrary(
      { mediaType: 'photo', quality: 1, selectionLimit: 1 },
      handlePickerResponse,
    );
  };

  const validateForm = () => {
    if (!title.trim()) {
      return 'Enter a brand or campaign name.';
    }

    if (!website.trim()) {
      return 'Enter a website URL.';
    }

    if (!description.trim()) {
      return 'Enter a short description for this brand.';
    }

    if (!normalizeHexColor(colorValues.primary)) {
      return 'Add at least a primary brand color.';
    }

    const invalidSlot = COLOR_SLOTS.find(slot => {
      const raw = colorValues[slot.id].trim();
      return raw.length > 0 && !isValidHexColor(raw);
    });

    if (invalidSlot) {
      return `Enter a valid hex color for ${invalidSlot.label.toLowerCase()}.`;
    }

    return null;
  };

  const handleSave = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      Alert.alert('Missing details', validationMessage);
      return;
    }

    setSaving(true);

    try {
      const shouldUploadLogo =
        !!logoUri &&
        (/^data:/i.test(logoUri) ||
          /^file:/i.test(logoUri) ||
          /^content:/i.test(logoUri) ||
          /^ph:|^assets-library:/i.test(logoUri));

      const payload = {
        title: title.trim(),
        website: website.trim(),
        description: description.trim(),
        colors: resolvedColors,
        logoDescription: logoDescription.trim() || undefined,
        isDefault: isDefault || undefined,
        logoUri: shouldUploadLogo ? logoUri : undefined,
        fileName: logoFileName,
        mimeType: logoMime,
      };

      const savedBrand = editingBrandId
        ? await brandsApi.update({
            id: editingBrandId,
            ...payload,
          })
        : await brandsApi.create(payload);

      if (!editingBrandId && savedBrand.id) {
        setEditingBrandId(savedBrand.id);
        Alert.alert('Saved', 'Brand kit created. You can update it now.');
      } else {
        Alert.alert('Saved', 'Brand kit updated successfully.');
      }
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        'Could not save',
        apiError?.message || 'Something went wrong while saving your brand kit.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerBar}>
        <HeaderBackButton onPress={() => navigation.goBack()} style={styles.headerBack} />

        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>NEW KIT</Text>
          <Text numberOfLines={1} style={styles.headerTitle}>
            {headerTitle}
          </Text>
        </View>

        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>BRAND OR CAMPAIGN</Text>
          <TextInput
            onChangeText={setTitle}
            placeholder="Kinfolk Coffee"
            placeholderTextColor={colors.textSoft}
            style={styles.underlineInput}
            value={title}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>WEBSITE</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={setWebsite}
            placeholder="https://kinfolk.co"
            placeholderTextColor={colors.textSoft}
            style={styles.underlineInput}
            value={website}
          />
        </View>

        <View style={styles.defaultCard}>
          <View style={styles.defaultIconWrap}>
            <Image source={defaultStarIcon} style={styles.defaultIconImage} />
          </View>
          <View style={styles.defaultCopy}>
            <Text style={styles.defaultTitle}>Default kit</Text>
            <Text style={styles.defaultSubtitle}>
              Auto-applied to new creatives
            </Text>
          </View>
          <Switch
            onValueChange={setIsDefault}
            thumbColor={colors.white}
            trackColor={{
              false: colors.border,
              true: colors.primary,
            }}
            value={isDefault}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Logo</Text>
          <Text style={styles.sectionHint}>
            {logoFileSize ? formatFileSize(logoFileSize) : 'PNG · up to 3 MB'}
          </Text>
        </View>

        <View style={styles.logoCard}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => void handlePickLogo()}
            style={styles.logoUploadBox}
          >
            {logoUri ? (
              <Image resizeMode="contain" source={{ uri: logoUri }} style={styles.logoPreview} />
            ) : (
              <Text style={styles.logoPlus}>+</Text>
            )}
          </TouchableOpacity>

          <View style={styles.logoMeta}>
            <Text style={styles.logoMetaTitle}>
              {logoUri ? logoFileName || 'brand-logo.png' : 'Upload brand logo'}
            </Text>
            <Text style={styles.logoMetaSubtitle}>
              PNG with transparent bg works best · up to 3 MB
            </Text>
            {logoUri ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => void handlePickLogo()}
                style={styles.replaceButton}
              >
                <Text style={styles.replaceButtonText}>REPLACE</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Palette</Text>
          <Text style={styles.sectionHint}>Tap to edit</Text>
        </View>

        {palettePreview.length > 0 ? (
          <View style={styles.palettePreviewRow}>
            {palettePreview.map(entry => (
              <View
                key={entry.id}
                style={[styles.paletteSwatch, { backgroundColor: entry.hex! }]}
              >
                <Text
                  style={[
                    styles.paletteSwatchHex,
                    { color: getContrastTextColor(entry.hex!) },
                  ]}
                >
                  {entry.hex}
                </Text>
                <Text
                  style={[
                    styles.paletteSwatchLabel,
                    { color: getContrastTextColor(entry.hex!) },
                  ]}
                >
                  {entry.label}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.colorFields}>
          {COLOR_SLOTS.map(slot => {
            const normalized = normalizeHexColor(colorValues[slot.id]);
            const showClear = colorValues[slot.id].trim().length > 0;

            return (
              <View key={slot.id} style={styles.colorRow}>
                <Text style={styles.colorRowLabel}>{slot.label}</Text>
                <View style={styles.colorRowInputs}>
                  <Pressable
                    hitSlop={8}
                    onPress={() => openColorPicker(slot.id)}
                    style={[
                      styles.colorSwatchBox,
                      normalized
                        ? { backgroundColor: normalized, borderColor: normalized }
                        : null,
                    ]}
                  />
                  <TextInput
                    autoCapitalize="characters"
                    autoCorrect={false}
                    onChangeText={value => updateColorValue(slot.id, value)}
                    onBlur={() => normalizeColorValue(slot.id)}
                    placeholder={slot.optional ? '(OPTIONAL)' : '#CC4A24'}
                    placeholderTextColor={colors.textSoft}
                    style={styles.colorHexInput}
                    value={colorValues[slot.id]}
                  />
                  {showClear ? (
                    <Pressable
                      hitSlop={8}
                      onPress={() => clearColorValue(slot.id)}
                      style={styles.colorClearButton}
                    >
                      <Text style={styles.colorClearText}>×</Text>
                    </Pressable>
                  ) : (
                    <View style={styles.colorClearSpacer} />
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>LOGO DESCRIPTION</Text>
          <TextInput
            multiline
            onChangeText={setLogoDescription}
            placeholder="Wordmark in serif on cream with a small leaf glyph above."
            placeholderTextColor={colors.textSoft}
            style={[styles.underlineInput, styles.multilineInput]}
            value={logoDescription}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>SHORT DESCRIPTION</Text>
          <TextInput
            multiline
            onChangeText={setDescription}
            placeholder="Small-batch specialty coffee · warm editorial tone · earthy palette."
            placeholderTextColor={colors.textSoft}
            style={[styles.underlineInput, styles.multilineInput]}
            textAlignVertical="top"
            value={description}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.88}
          disabled={isSaving}
          onPress={() => void handleSave()}
          style={[styles.footerSaveButton, isSaving && styles.saveButtonDisabled]}
        >
          <Text style={styles.footerSaveButtonText}>{actionButtonLabel}</Text>
        </TouchableOpacity>
      </View>

      <BlockingLoadingOverlay
        message="Saving your brand kit…"
        visible={isSaving}
      />

      <Modal
        animationType="fade"
        onRequestClose={handleCancelColorPicker}
        transparent
        visible={activeColorSlot !== null}
      >
        <RNPressable onPress={handleCancelColorPicker} style={styles.pickerBackdrop}>
          <RNPressable onPress={() => undefined} style={styles.pickerCard}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Pick a color</Text>
              <Text style={styles.pickerSubtitle}>
                {activeColorSlot ? activeColorSlot.toUpperCase() : ''}
              </Text>
            </View>
            <View style={styles.pickerWheelHost}>
              <ColorPicker
                color={pickerColor}
                gapSize={6}
                noSnap={false}
                onColorChangeComplete={selected => {
                  const normalized = normalizeHexColor(selected);
                  if (!normalized) {
                    return;
                  }
                  setPickerColor(normalized);
                }}
                onColorChange={selected => {
                  const normalized = normalizeHexColor(selected);
                  if (!normalized) {
                    return;
                  }
                  setPickerColor(normalized);
                }}
                row={false}
                sliderSize={0}
                swatches={false}
                thumbSize={22}
              />
            </View>
            <View style={styles.pickerSelectionRow}>
              <View
                style={[
                  styles.pickerSelectionSwatch,
                  { backgroundColor: pickerColor, borderColor: pickerColor },
                ]}
              />
              <Text style={styles.pickerHex}>{pickerColor}</Text>
            </View>
            <View style={styles.pickerActions}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleCancelColorPicker}
                style={styles.pickerCancelButton}
              >
                <Text style={styles.pickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleDoneColorPicker}
                style={styles.pickerDoneButton}
              >
                <Text style={styles.pickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          </RNPressable>
        </RNPressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  colorClearButton: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  colorClearSpacer: {
    width: 28,
  },
  colorClearText: {
    color: colors.textSoft,
    fontSize: 22,
    lineHeight: 24,
  },
  colorFields: {
    gap: 14,
    marginBottom: 22,
  },
  colorHexInput: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 36,
    paddingBottom: 6,
    paddingTop: 4,
  },
  colorRow: {
    gap: 6,
  },
  colorRowInputs: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  colorRowLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  colorSwatchBox: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 34,
    width: 34,
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  defaultCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(199, 101, 59, 0.10)',
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 24,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  defaultCopy: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  defaultIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  defaultIconImage: {
    height: 16,
    tintColor: colors.white,
    width: 16,
  },
  defaultSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  defaultTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  fieldBlock: {
    marginBottom: 22,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  footerSaveButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
  },
  footerSaveButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    paddingBottom: 22,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  headerBack: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  headerBackText: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 30,
  },
  headerBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 8,
  },
  headerEyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.text,
    fontFamily: 'Georgia',
    fontSize: 22,
    lineHeight: 26,
    marginTop: 2,
    textAlign: 'center',
  },
  headerRightSpacer: {
    width: 68,
  },
  logoCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 24,
    padding: 14,
  },
  logoMeta: {
    flex: 1,
    marginLeft: 14,
  },
  logoMetaSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  logoMetaTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  logoPlus: {
    color: colors.textSoft,
    fontSize: 30,
    lineHeight: 32,
  },
  logoPreview: {
    height: 44,
    width: 44,
  },
  logoUploadBox: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 14,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  multilineInput: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  palettePreviewRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  paletteSwatch: {
    borderRadius: 14,
    flex: 1,
    minHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  paletteSwatchHex: {
    fontSize: 11,
    fontWeight: '600',
  },
  paletteSwatchLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 6,
  },
  pickerBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(25, 18, 14, 0.45)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  pickerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 380,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '100%',
  },
  pickerActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 14,
  },
  pickerCancelButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pickerCancelText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pickerDoneButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pickerDoneText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  pickerSelectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  pickerSelectionSwatch: {
    borderRadius: 4,
    borderWidth: 1,
    height: 16,
    marginRight: 8,
    width: 16,
  },
  pickerHex: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'left',
  },
  pickerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  pickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pickerSubtitle: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  pickerWheelHost: {
    alignItems: 'center',
    height: 280,
    justifyContent: 'center',
    marginTop: 6,
    overflow: 'hidden',
    width: '100%',
  },
  replaceButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  replaceButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHint: {
    color: colors.textSoft,
    fontSize: 12,
  },
  sectionTitle: {
    color: colors.primary,
    fontFamily: 'Georgia',
    fontSize: 22,
    lineHeight: 26,
  },
  underlineInput: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    color: colors.text,
    fontSize: 16,
    minHeight: 40,
    paddingBottom: 8,
    paddingTop: 2,
  },
});

export default BrandDetailsScreen;
