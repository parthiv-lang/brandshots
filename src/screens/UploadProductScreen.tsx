import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import AppIcon from '../components/AppIcon';
import BlockingLoadingOverlay from '../components/BlockingLoadingOverlay';
import HeaderBackButton from '../components/HeaderBackButton';
import ProductFlowStepper from '../components/ProductFlowStepper';
import { productsApi } from '../services/products';
import type {
  ProductAnalysis,
  ProductRecord,
  UpdateProductPayload,
} from '../services/products';
import type { ApiError } from '../services/api';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

const PRODUCT_CATEGORIES = [
  'BEAUTY',
  'BEVERAGE',
  'FOOD',
  'FASHION',
  'TECH',
  'HOME',
  'FITNESS',
  'SUPPLEMENT',
  'JEWELRY',
  'OTHER',
] as const;

const PROCESSED_IMAGE_NAME = 'product.png';
const AUTO_SAVE_DEBOUNCE_MS = 600;

type Props = NativeStackScreenProps<RootStackParamList, 'UploadProduct'>;

const STATUS_PILLS = [
  { id: 'uploaded', label: 'Uploaded' },
  { id: 'polished', label: 'Polished' },
  { id: 'analyzed', label: 'Analyzed' },
  { id: 'brand', label: 'Brand lookup' },
] as const;

type StatusPillId = (typeof STATUS_PILLS)[number]['id'];

type StatusFlags = Record<StatusPillId, boolean>;

const INITIAL_STATUS: StatusFlags = {
  uploaded: false,
  polished: false,
  analyzed: false,
  brand: false,
};

const CHECKER_TILE = 18;
const CHECKER_LIGHT = '#F4ECDF';
const CHECKER_DARK = '#E8DCC4';

type CheckerboardProps = {
  width: number;
  height: number;
};

function Checkerboard({ width, height }: CheckerboardProps) {
  const tiles = useMemo(() => {
    const colCount = Math.ceil(width / CHECKER_TILE);
    const rowCount = Math.ceil(height / CHECKER_TILE);
    const rows: Array<Array<string>> = [];

    for (let row = 0; row < rowCount; row += 1) {
      const cells: Array<string> = [];
      for (let col = 0; col < colCount; col += 1) {
        cells.push((row + col) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK);
      }
      rows.push(cells);
    }

    return rows;
  }, [width, height]);

  return (
    <View pointerEvents="none" style={styles.checkerWrap}>
      {tiles.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.checkerRow}>
          {row.map((color, colIndex) => (
            <View
              key={`cell-${rowIndex}-${colIndex}`}
              style={{
                backgroundColor: color,
                height: CHECKER_TILE,
                width: CHECKER_TILE,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

type StatusPillProps = {
  label: string;
  completed: boolean;
};

function StatusPill({ label, completed }: StatusPillProps) {
  return (
    <View
      style={[styles.statusPill, !completed && styles.statusPillPending]}
    >
      <View
        style={[styles.statusCheck, !completed && styles.statusCheckPending]}
      >
        {completed ? (
          <AppIcon color={colors.primary} name="check" size={12} />
        ) : (
          <View style={styles.statusDot} />
        )}
      </View>
      <Text
        style={[styles.statusLabel, !completed && styles.statusLabelPending]}
      >
        {label}
      </Text>
    </View>
  );
}

function deriveProductName(fileName?: string) {
  if (!fileName) {
    return '';
  }

  const stripped = fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  return stripped.trim().toLowerCase();
}

function normalizeCategory(category: string) {
  return category.trim().toLowerCase();
}

function applyProductRecord(product: ProductRecord) {
  const { analysis } = product;
  return {
    productId: product.id,
    productName: product.name || analysis.productType || '',
    brandText: analysis.brandText ?? '',
    category: normalizeCategory(analysis.category || 'other'),
    materials: analysis.materials ?? '',
    targetAudience: analysis.targetAudience ?? '',
    packagingNotes: analysis.packagingNotes ?? '',
    displayImageUri: product.imageUrl,
    analysis,
  };
}

function buildUpdatePayload(
  productName: string,
  brandText: string,
  category: string,
  materials: string,
  targetAudience: string,
  packagingNotes: string,
  baseAnalysis: ProductAnalysis,
): UpdateProductPayload {
  const trimmedBrand = brandText.trim();
  const resolvedName = productName.trim() || baseAnalysis.productType;

  return {
    name: resolvedName,
    analysis: {
      ...baseAnalysis,
      productType: resolvedName,
      category: normalizeCategory(category),
      brandText: trimmedBrand === '' ? null : trimmedBrand,
      materials: materials.trim(),
      targetAudience: targetAudience.trim(),
      packagingNotes: packagingNotes.trim(),
    },
  };
}

type CategoryChipProps = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
};

function CategoryChip({ label, selected, disabled, onPress }: CategoryChipProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={disabled}
      onPress={onPress}
      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
    >
      <Text
        style={[
          styles.categoryChipText,
          selected && styles.categoryChipTextSelected,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const COMPLETED_STATUS: StatusFlags = {
  uploaded: true,
  polished: true,
  analyzed: true,
  brand: true,
};

function UploadProductScreen({ navigation, route }: Props) {
  const { imageUri, fileName, mimeType, productId: routeProductId, source } =
    route.params;
  const isSavedProduct = source === 'saved' && Boolean(routeProductId);
  const [productId, setProductId] = useState<string | null>(
    isSavedProduct ? routeProductId ?? null : null,
  );
  const [productName, setProductName] = useState(
    () => deriveProductName(fileName) || '',
  );
  const [brandText, setBrandText] = useState('');
  const [category, setCategory] = useState('fashion');
  const [materials, setMaterials] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [packagingNotes, setPackagingNotes] = useState('');
  const [isDetailsExpanded, setDetailsExpanded] = useState(false);
  const [displayImageUri, setDisplayImageUri] = useState(imageUri ?? '');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [statusFlags, setStatusFlags] = useState<StatusFlags>(
    isSavedProduct ? COMPLETED_STATUS : { ...INITIAL_STATUS, uploaded: true },
  );
  const [baseAnalysis, setBaseAnalysis] = useState<ProductAnalysis | null>(null);
  const [isProcessing, setProcessing] = useState(!isSavedProduct);
  const [loaderMessage, setLoaderMessage] = useState(
    isSavedProduct ? 'Loading product…' : 'Polishing your product…',
  );
  const hasRequestedRef = useRef(false);
  const skipAutoSaveRef = useRef(true);
  const skipNextAutoSaveRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSaveIdRef = useRef(0);

  const summaryLine = productName
    ? `${productName} · ${normalizeCategory(category)}`
    : normalizeCategory(category);

  const heroProductLine = productName
    ? productName.endsWith('.')
      ? productName
      : `${productName}.`
    : 'your product.';

  const heroStatusLabel = statusFlags.analyzed
    ? 'POLISHED & ANALYZED'
    : statusFlags.polished
      ? 'POLISHED'
      : statusFlags.uploaded
        ? 'UPLOADED'
        : null;

  const persistProduct = useCallback(
    async (payload: UpdateProductPayload) => {
      if (!productId) {
        return null;
      }

      const saveId = latestSaveIdRef.current + 1;
      latestSaveIdRef.current = saveId;

      const updated = await productsApi.update(productId, payload);

      if (latestSaveIdRef.current !== saveId) {
        return null;
      }

      setBaseAnalysis(updated.analysis);
      return updated;
    },
    [productId],
  );

  const loadSavedProduct = useCallback(
    async (id: string) => {
      setProcessing(true);
      skipAutoSaveRef.current = true;
      setLoaderMessage('Loading product…');

      try {
        const product = await productsApi.getById(id);
        const formState = applyProductRecord(product);

        setProductId(formState.productId);
        setProductName(formState.productName);
        setBrandText(formState.brandText);
        setCategory(formState.category);
        setMaterials(formState.materials);
        setTargetAudience(formState.targetAudience);
        setPackagingNotes(formState.packagingNotes);
        setDisplayImageUri(formState.displayImageUri);
        setBaseAnalysis(formState.analysis);
        setStatusFlags(COMPLETED_STATUS);
        skipNextAutoSaveRef.current = true;
      } catch (error) {
        const apiError = error as ApiError;
        Alert.alert(
          'Could not load product',
          apiError?.message || 'Please try again.',
          [
            { text: 'Go back', onPress: () => navigation.goBack() },
            {
              text: 'Retry',
              onPress: () => {
                hasRequestedRef.current = false;
                void loadSavedProduct(id);
              },
            },
          ],
        );
      } finally {
        setProcessing(false);
        skipAutoSaveRef.current = false;
      }
    },
    [navigation],
  );

  const runProcessingPipeline = useCallback(async () => {
    if (!imageUri) {
      return;
    }

    setProcessing(true);
    skipAutoSaveRef.current = true;
    setDisplayImageUri(imageUri);

    try {
      setLoaderMessage('Polishing your product…');
      const bgResult = await productsApi.removeBackground({
        imageUri,
        fileName,
        mimeType,
      });

      const processedImageUri = bgResult.imageDataUrl;
      const processedMimeType = bgResult.mimeType || 'image/png';

      setDisplayImageUri(processedImageUri);
      setStatusFlags(prev => ({ ...prev, polished: true }));

      setLoaderMessage('Analyzing your product…');
      const analysis = await productsApi.analyze({
        imageUri: processedImageUri,
        fileName: PROCESSED_IMAGE_NAME,
        mimeType: processedMimeType,
      });

      setStatusFlags(prev => ({ ...prev, analyzed: true }));

      setLoaderMessage('Saving product details…');
      const product = await productsApi.create({
        imageUri: processedImageUri,
        analysis,
        fileName: PROCESSED_IMAGE_NAME,
        mimeType: processedMimeType,
      });

      setProductId(product.id);
      setBaseAnalysis(product.analysis);

      setLoaderMessage('Finalizing product details…');
      const synced = await productsApi.update(product.id, {
        analysis: product.analysis,
      });

      const formState = applyProductRecord(synced);
      setProductName(formState.productName);
      setBrandText(formState.brandText);
      setCategory(formState.category);
      setMaterials(formState.materials);
      setTargetAudience(formState.targetAudience);
      setPackagingNotes(formState.packagingNotes);
      setDisplayImageUri(formState.displayImageUri);
      setBaseAnalysis(formState.analysis);
      setStatusFlags(prev => ({ ...prev, brand: true }));
      skipNextAutoSaveRef.current = true;
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        'Processing failed',
        apiError?.message ||
          "Couldn't process this image. Please try a different photo.",
        [
          { text: 'Go back', onPress: () => navigation.goBack() },
          {
            text: 'Retry',
            onPress: () => {
              hasRequestedRef.current = false;
              setProductId(null);
              setBaseAnalysis(null);
              setStatusFlags({ ...INITIAL_STATUS, uploaded: true });
              void runProcessingPipeline();
            },
          },
        ],
      );
    } finally {
      setProcessing(false);
      skipAutoSaveRef.current = false;
    }
  }, [imageUri, fileName, mimeType, navigation]);

  useEffect(() => {
    if (hasRequestedRef.current) {
      return;
    }
    hasRequestedRef.current = true;

    if (isSavedProduct && routeProductId) {
      void loadSavedProduct(routeProductId);
      return;
    }

    void runProcessingPipeline();
  }, [isSavedProduct, routeProductId, loadSavedProduct, runProcessingPipeline]);

  useEffect(() => {
    if (
      !productId ||
      !baseAnalysis ||
      isProcessing ||
      skipAutoSaveRef.current
    ) {
      return;
    }

    if (skipNextAutoSaveRef.current) {
      skipNextAutoSaveRef.current = false;
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const payload = buildUpdatePayload(
        productName,
        brandText,
        category,
        materials,
        targetAudience,
        packagingNotes,
        baseAnalysis,
      );

      void persistProduct(payload).catch(() => {
        // Silent auto-save — no blocking loader or alert on failure.
      });
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    productId,
    baseAnalysis,
    isProcessing,
    productName,
    brandText,
    category,
    materials,
    targetAudience,
    packagingNotes,
    persistProduct,
  ]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerBar}>
        <HeaderBackButton onPress={() => navigation.goBack()} style={styles.headerBack} />

        <View style={styles.headerStepperWrap}>
          <ProductFlowStepper activeStep={1} />
        </View>

        <View style={styles.headerBack} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
        <View style={styles.heroBlock}>
          {heroStatusLabel ? (
            <View style={styles.heroStatusRow}>
              <AppIcon color={colors.primary} name="check" size={14} />
              <Text style={styles.heroStatus}>{heroStatusLabel}</Text>
            </View>
          ) : null}
          <Text style={styles.heroLead}>Looks like a</Text>
          <Text style={styles.heroProduct}>{heroProductLine}</Text>
        </View>

        <View
          onLayout={event => {
            const { width, height } = event.nativeEvent.layout;
            setCanvasSize(prev =>
              prev.width === width && prev.height === height
                ? prev
                : { width, height },
            );
          }}
          style={styles.canvas}
        >
          {canvasSize.width > 0 && canvasSize.height > 0 ? (
            <>
              <Checkerboard
                height={canvasSize.height}
                width={canvasSize.width}
              />
              <Image
                resizeMode="contain"
                source={{ uri: displayImageUri }}
                style={styles.canvasImage}
              />
            </>
          ) : null}
        </View>

        <View style={styles.canvasFooter}>
          <Text numberOfLines={1} style={styles.canvasFooterName}>
            {productName}
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
            style={styles.changeButton}
          >
            <AppIcon color={colors.primary} name="rotate-cw" size={14} />
            <Text style={styles.changeText}>CHANGE</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusRow}>
          {STATUS_PILLS.map(pill => (
            <StatusPill
              key={pill.id}
              completed={statusFlags[pill.id]}
              label={pill.label}
            />
          ))}
        </View>

        <View style={styles.detailsCard}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setDetailsExpanded(prev => !prev)}
            style={styles.detailsHeader}
          >
            <View style={styles.detailsHeaderLeft}>
              <View style={styles.detailsIcon}>
                <AppIcon color={colors.primary} name="edit-2" size={14} />
              </View>
              <Text style={styles.detailsHeaderLabel}>
                DETECTED DETAILS — TAP TO EDIT
              </Text>
            </View>
            <AppIcon
              color={colors.textMuted}
              name={isDetailsExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
            />
          </TouchableOpacity>

          {isDetailsExpanded ? (
            <View style={styles.detailsBody}>
              <Text style={styles.detailsSummary}>{summaryLine}</Text>

              <View style={styles.detailsDivider} />

              <Text style={styles.detailsFieldLabel}>PRODUCT TYPE</Text>
              <TextInput
                editable={!isProcessing}
                onChangeText={setProductName}
                placeholder="Product type"
                placeholderTextColor={colors.textSoft}
                style={styles.detailsInput}
                value={productName}
              />

              <View style={styles.detailsDivider} />

              <Text style={styles.detailsFieldLabel}>BRAND TEXT ON PRODUCT</Text>
              <TextInput
                editable={!isProcessing}
                onChangeText={setBrandText}
                placeholder="(none)"
                placeholderTextColor={colors.textSoft}
                style={styles.detailsInput}
                value={brandText}
              />

              <View style={styles.detailsDivider} />

              <Text style={styles.detailsFieldLabel}>CATEGORY</Text>
              <View style={styles.categoryGrid}>
                {PRODUCT_CATEGORIES.map(item => {
                  const value = normalizeCategory(item);
                  return (
                    <CategoryChip
                      disabled={isProcessing}
                      key={item}
                      label={item}
                      onPress={() => setCategory(value)}
                      selected={category === value}
                    />
                  );
                })}
              </View>

              <View style={styles.detailsDivider} />

              <Text style={styles.detailsFieldLabel}>MATERIALS</Text>
              <TextInput
                editable={!isProcessing}
                onChangeText={setMaterials}
                placeholder="Materials"
                placeholderTextColor={colors.textSoft}
                style={styles.detailsInput}
                value={materials}
              />

              <View style={styles.detailsDivider} />

              <Text style={styles.detailsFieldLabel}>TARGET AUDIENCE</Text>
              <TextInput
                editable={!isProcessing}
                onChangeText={setTargetAudience}
                placeholder="Target audience"
                placeholderTextColor={colors.textSoft}
                style={styles.detailsInput}
                value={targetAudience}
              />

              <View style={styles.detailsDivider} />

              <Text style={styles.detailsFieldLabel}>PACKAGING NOTES</Text>
              <TextInput
                editable={!isProcessing}
                multiline
                onChangeText={setPackagingNotes}
                placeholder="transparent bottle, gold cap, white label..."
                placeholderTextColor={colors.textSoft}
                style={[styles.detailsInput, styles.detailsInputMultiline]}
                value={packagingNotes}
              />

              {productId ? (
                <View style={styles.autoSaveRow}>
                  <AppIcon color={colors.textMuted} name="check" size={12} />
                  <Text style={styles.autoSaveHint}>Changes save automatically</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.9}
          disabled={isProcessing || !productId}
          onPress={() => {
            if (!productId) {
              return;
            }

            navigation.navigate('ProductShoot', {
              productId,
              productName,
              imageUrl: displayImageUri,
              category,
            });
          }}
          style={[
            styles.nextButton,
            (isProcessing || !productId) && styles.nextButtonDisabled,
          ]}
        >
          <Text style={styles.nextButtonText}>NEXT</Text>
          <AppIcon color={colors.white} name="arrow-right" size={16} style={styles.nextButtonArrow} />
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>

      <BlockingLoadingOverlay
        blur
        blurAmount={3}
        message={loaderMessage}
        visible={isProcessing}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  canvas: {
    aspectRatio: 1,
    backgroundColor: CHECKER_LIGHT,
    borderColor: colors.borderSoft,
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 22,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  canvasFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  canvasFooterName: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    marginRight: 12,
  },
  canvasImage: {
    ...StyleSheet.absoluteFill,
  },
  changeButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  changeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  autoSaveRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  autoSaveHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  categoryChip: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  categoryChipTextSelected: {
    color: colors.white,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  checkerRow: {
    flexDirection: 'row',
  },
  checkerWrap: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'column',
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 22,
    paddingTop: 4,
  },
  detailsBody: {
    paddingBottom: 18,
    paddingHorizontal: 18,
  },
  detailsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 22,
    overflow: 'hidden',
  },
  detailsChevron: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  detailsDivider: {
    backgroundColor: colors.borderSoft,
    height: 1,
    marginBottom: 14,
    marginTop: 14,
  },
  detailsFieldLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  detailsHeaderLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  detailsHeaderLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  detailsIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    height: 26,
    justifyContent: 'center',
    marginRight: 10,
    width: 26,
  },
  detailsIconText: {
    color: colors.text,
    fontSize: 14,
  },
  detailsInput: {
    backgroundColor: colors.white,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailsInputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  detailsSummary: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
  },
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    paddingBottom: 22,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  heroBlock: {
    alignItems: 'flex-start',
    marginTop: 8,
  },
  heroLead: {
    color: colors.text,
    fontFamily: 'Georgia',
    fontSize: 26,
    lineHeight: 30,
    textAlign: 'left',
  },
  heroProduct: {
    color: colors.primary,
    fontFamily: 'Georgia',
    fontSize: 26,
    fontStyle: 'italic',
    lineHeight: 30,
    marginTop: -2,
    textAlign: 'left',
  },
  heroStatus: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'left',
  },
  heroStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
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
  headerStepperWrap: {
    flex: 1,
  },
  nextButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    width: '100%',
  },
  nextButtonArrow: {
    marginLeft: 10,
  },
  nextButtonDisabled: {
    opacity: 0.55,
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  statusCheck: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 14,
    justifyContent: 'center',
    marginRight: 6,
    width: 14,
  },
  statusDot: {
    backgroundColor: colors.textSoft,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  statusCheckPending: {
    opacity: 0.7,
  },
  statusCheckText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusCheckTextPending: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 14,
  },
  statusLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  statusLabelPending: {
    color: colors.textMuted,
  },
  statusPill: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillPending: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
});

export default UploadProductScreen;
