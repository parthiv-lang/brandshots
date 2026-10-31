import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ImageSourcePropType,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AppIcon from '../components/AppIcon';
import HeaderBackButton from '../components/HeaderBackButton';
import ProductFlowStepper from '../components/ProductFlowStepper';

import {
  ADS_CREATIVE_PRESETS,
  ADS_CREATIVE_SUB_CATEGORIES,
  getAdsCreativePresetsBySubCategory,
  getProductShootPresetsBySubCategory,
  getSocialPostPresetsBySubCategory,
  PRODUCT_SHOOT_PRESETS,
  PRODUCT_SHOOT_SUB_CATEGORIES,
  SOCIAL_POST_PRESETS,
  SOCIAL_POST_SUB_CATEGORIES,
  type AdsCreativeSubCategory,
  type ProductShootSubCategory,
  type SocialPostSubCategory,
} from '../constants/presets';
import {
  ADS_CREATIVE_PLATFORMS,
  getAdsCreativeSpecsForPlatform,
  getProductShootSpecsForPlatform,
  getSocialPosterSpecsForPlatform,
  PRODUCT_SHOOT_PLATFORMS,
  SOCIAL_POSTER_PLATFORMS,
} from '../constants/platformSpecs';
import {
  getPlatformFallbackIconName,
  getPlatformIconSource,
  isColoredPlatformIcon,
} from '../constants/platformIcons';
import ShootDetailsModal from '../components/ShootDetailsModal';
import CompactSelectDropdown from '../components/CompactSelectDropdown';
import GenerationProgressOverlay, {
  type GenerationProgressStep,
} from '../components/GenerationProgressOverlay';
import { brandsApi } from '../services/brands';
import {
  CREATE_QUALITY_RATES,
  createShotCredits,
  useCreditPricing,
} from '../services/credits/creditPricing';
import { productsApi } from '../services/products';
import type { ProductAnalysis } from '../services/products/types';
import {
  buildGenerateFormData,
  buildGenerateSetupFromScreenState,
  generateApi,
} from '../services/generations';
import type { ApiError } from '../services/api';
import {
  EMPTY_PRODUCT_SHOOT_DETAILS,
  EMPTY_SOCIAL_AD_SHOOT_DETAILS,
  getDetailsSummaryPreview,
  type ProductShootDetails,
  type ShootType,
  type SocialAdShootDetails,
} from '../types/shootDetails';
import type { BrandKitRecord } from '../services/brands/types';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import { useAppDispatch } from '../store/hooks';
import { setCreditsBalance } from '../store/slices/authSlice';
import { inferJewelrySubtype, isJewelryProduct } from '../utils/jewelry';

const electricityIcon = require('../assets/electricity-svgrepo-com.png');
const CUSTOM_DIMENSION_MIN = 256;
const CUSTOM_DIMENSION_MAX = 4096;
const CUSTOM_DIMENSION_DEFAULT = 1080;

const STANDARD_ASPECT_RATIOS: Array<{ label: string; value: number }> = [
  { label: '1:1', value: 1 },
  { label: '4:5', value: 4 / 5 },
  { label: '9:16', value: 9 / 16 },
  { label: '16:9', value: 16 / 9 },
];

type Props = NativeStackScreenProps<RootStackParamList, 'ProductShoot'>;

type QualityId = 'std' | 'hd' | 'ultra';

const SHOOT_TYPES: Array<{ id: ShootType; label: string }> = [
  { id: 'product', label: 'Product shoot' },
  { id: 'social', label: 'Social' },
  { id: 'ad', label: 'Ads' },
];

const PRESET_CARD_DARK: Record<string, boolean> = {
  ecommerce_hero_plus: false,
};

const QUALITY_OPTIONS: Array<{ id: QualityId; label: string }> = [
  { id: 'std', label: 'STD' },
  { id: 'hd', label: 'HD' },
  { id: 'ultra', label: 'ULTRA' },
];

const QUALITY_PROGRESS_LABELS: Record<QualityId, string> = {
  std: 'Standard',
  hd: 'HD',
  ultra: 'Ultra',
};

const QUANTITY_OPTIONS = [1, 2, 3] as const;

const QUANTITY_SELECT_OPTIONS = QUANTITY_OPTIONS.map(count => ({
  value: String(count),
  label: String(count),
}));

const HORIZONTAL_PADDING = 22;
const SECTION_SPACING = 28;
const SECTION_TITLE_GAP = 12;
const STYLE_CARD_GAP = 14;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const STYLE_CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const STYLE_CARD_HEIGHT = 300;
const STYLE_CARD_SNAP_INTERVAL = STYLE_CARD_WIDTH + STYLE_CARD_GAP;

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif' });
const monospaceFont = Platform.select({ ios: 'Menlo', android: 'monospace' });

function parseDimensionInput(value: string) {
  const parsed = Number.parseInt(value.replace(/\D/g, ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return CUSTOM_DIMENSION_DEFAULT;
  }

  return Math.min(CUSTOM_DIMENSION_MAX, Math.max(CUSTOM_DIMENSION_MIN, parsed));
}

function getSnapAspectRatio(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return '—';
  }

  const ratio = width / height;
  let closest = STANDARD_ASPECT_RATIOS[0];

  for (const item of STANDARD_ASPECT_RATIOS) {
    if (Math.abs(ratio - item.value) < Math.abs(ratio - closest.value)) {
      closest = item;
    }
  }

  return closest.label;
}

function shortBlurb(text: string) {
  const firstSentence = text.split('.')[0] ?? text;
  if (firstSentence.length <= 42) {
    return firstSentence.replace(/ with.*/i, '').trim();
  }
  return `${firstSentence.slice(0, 39).trim()}…`;
}

function getPresetCardImage(
  preset: { previewImage?: ImageSourcePropType },
  productImageUrl: string,
): ImageSourcePropType {
  if (preset.previewImage) {
    return preset.previewImage;
  }

  return { uri: productImageUrl };
}

function renderPlatformToggleIcon(platform: string, isActive: boolean) {
  const activeColor = colors.primary;
  const inactiveColor = colors.textMuted;
  const iconSource = getPlatformIconSource(platform);

  if (iconSource) {
    const isColored = isColoredPlatformIcon(platform);

    return (
      <View
        style={[
          styles.platformIconBadge,
          isColored && !isActive && styles.platformIconBadgeInactive,
        ]}
      >
        <Image
          resizeMode="contain"
          source={iconSource}
          style={[
            isColored ? styles.platformToggleIconColored : styles.platformToggleIcon,
            !isColored && {
              tintColor: isActive ? activeColor : inactiveColor,
            },
          ]}
        />
      </View>
    );
  }

  return (
    <AppIcon
      color={isActive ? activeColor : inactiveColor}
      name={getPlatformFallbackIconName(platform)}
      size={16}
    />
  );
}

type SizeIconProps = {
  aspect: 'square' | 'portrait' | 'story' | 'landscape';
  active?: boolean;
};

function SizeIcon({ aspect, active }: SizeIconProps) {
  const fill = active ? colors.primary : colors.textMuted;
  const shapes: Record<SizeIconProps['aspect'], { width: number; height: number }> =
    {
      square: { width: 18, height: 18 },
      portrait: { width: 14, height: 18 },
      story: { width: 11, height: 20 },
      landscape: { width: 22, height: 13 },
    };
  const { width, height } = shapes[aspect];

  return (
    <View
      style={[
        styles.sizeIconShape,
        {
          backgroundColor: fill,
          borderRadius: aspect === 'square' ? 3 : 2,
          height,
          width,
        },
      ]}
    />
  );
}

function ProductShootScreen({ navigation, route }: Props) {
  const { productId, productName, imageUrl } = route.params;
  const dispatch = useAppDispatch();

  const [shootType, setShootType] = useState<ShootType>('product');
  const [productSubCategory, setProductSubCategory] =
    useState<ProductShootSubCategory>('studio');
  const [socialSubCategory, setSocialSubCategory] =
    useState<SocialPostSubCategory>('show_product');
  const [adSubCategory, setAdSubCategory] =
    useState<AdsCreativeSubCategory>('awareness');
  const [selectedPresetId, setSelectedPresetId] = useState('minimal_studio');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('Catalog');
  const [selectedSizeId, setSelectedSizeId] = useState('catalog_square');
  const [customWidthText, setCustomWidthText] = useState(String(CUSTOM_DIMENSION_DEFAULT));
  const [customHeightText, setCustomHeightText] = useState(String(CUSTOM_DIMENSION_DEFAULT));
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [quality, setQuality] = useState<QualityId>('std');
  const [styleCardIndex, setStyleCardIndex] = useState(0);
  const [quantityMenuOpen, setQuantityMenuOpen] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [brandKits, setBrandKits] = useState<BrandKitRecord[]>([]);
  const [productShootDetails, setProductShootDetails] =
    useState<ProductShootDetails>(EMPTY_PRODUCT_SHOOT_DETAILS);
  const [socialAdDetails, setSocialAdDetails] = useState<SocialAdShootDetails>(
    EMPTY_SOCIAL_AD_SHOOT_DETAILS,
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis | null>(null);
  const pricing = useCreditPricing();
  const allowLeaveRef = useRef(false);

  const styleScrollRef = useRef<ScrollView>(null);

  const isProductShoot = shootType === 'product';
  const isSocialShoot = shootType === 'social';
  const isAdShoot = shootType === 'ad';
  const isSetupReady = isProductShoot || isSocialShoot || isAdShoot;

  const styleSubCategories = isProductShoot
    ? PRODUCT_SHOOT_SUB_CATEGORIES
    : isAdShoot
      ? ADS_CREATIVE_SUB_CATEGORIES
      : SOCIAL_POST_SUB_CATEGORIES;

  const activeSubCategory = isProductShoot
    ? productSubCategory
    : isAdShoot
      ? adSubCategory
      : socialSubCategory;

  const categoryPresets = useMemo(() => {
    if (isProductShoot) {
      return getProductShootPresetsBySubCategory(productSubCategory);
    }

    if (isAdShoot) {
      return getAdsCreativePresetsBySubCategory(adSubCategory);
    }

    return getSocialPostPresetsBySubCategory(socialSubCategory);
  }, [isProductShoot, isAdShoot, productSubCategory, adSubCategory, socialSubCategory]);

  const platformOptions = isProductShoot
    ? PRODUCT_SHOOT_PLATFORMS
    : isAdShoot
      ? ADS_CREATIVE_PLATFORMS
      : SOCIAL_POSTER_PLATFORMS;

  const platformSpecs = useMemo(() => {
    if (isProductShoot) {
      return getProductShootSpecsForPlatform(selectedPlatform);
    }

    if (isAdShoot) {
      return getAdsCreativeSpecsForPlatform(selectedPlatform);
    }

    return getSocialPosterSpecsForPlatform(selectedPlatform);
  }, [isProductShoot, isAdShoot, selectedPlatform]);

  const customWidth = useMemo(
    () => parseDimensionInput(customWidthText),
    [customWidthText],
  );

  const customHeight = useMemo(
    () => parseDimensionInput(customHeightText),
    [customHeightText],
  );

  const snapAspectRatio = useMemo(
    () => getSnapAspectRatio(customWidth, customHeight),
    [customWidth, customHeight],
  );

  const isCustomPlatform = selectedPlatform === 'Custom';

  const selectedPreset = useMemo(() => {
    if (isProductShoot) {
      return (
        PRODUCT_SHOOT_PRESETS.find(preset => preset.id === selectedPresetId) ??
        PRODUCT_SHOOT_PRESETS[0]
      );
    }

    if (isAdShoot) {
      return (
        ADS_CREATIVE_PRESETS.find(preset => preset.id === selectedPresetId) ??
        ADS_CREATIVE_PRESETS[0]
      );
    }

    return (
      SOCIAL_POST_PRESETS.find(preset => preset.id === selectedPresetId) ??
      SOCIAL_POST_PRESETS[0]
    );
  }, [isProductShoot, isAdShoot, selectedPresetId]);

  const styleSectionTitle = isProductShoot ? 'Category' : 'Style';

  const jewelleryProduct = isJewelryProduct(productAnalysis);
  const isJewelleryShoot = jewelleryProduct && isProductShoot;
  const visibleQualityOptions = jewelleryProduct
    ? QUALITY_OPTIONS.filter(option => option.id === 'ultra')
    : QUALITY_OPTIONS;
  const totalCredits =
    quantity * createShotCredits(pricing, quality, isJewelleryShoot);

  const handleSubCategoryChange = useCallback(
    (
      nextSubCategory:
        | ProductShootSubCategory
        | SocialPostSubCategory
        | AdsCreativeSubCategory,
    ) => {
      let presets;
      if (isProductShoot) {
        setProductSubCategory(nextSubCategory as ProductShootSubCategory);
        presets = getProductShootPresetsBySubCategory(
          nextSubCategory as ProductShootSubCategory,
        );
      } else if (isAdShoot) {
        setAdSubCategory(nextSubCategory as AdsCreativeSubCategory);
        presets = getAdsCreativePresetsBySubCategory(
          nextSubCategory as AdsCreativeSubCategory,
        );
      } else {
        setSocialSubCategory(nextSubCategory as SocialPostSubCategory);
        presets = getSocialPostPresetsBySubCategory(
          nextSubCategory as SocialPostSubCategory,
        );
      }

      const firstPresetId = presets[0]?.id;
      if (firstPresetId) {
        setSelectedPresetId(firstPresetId);
        setStyleCardIndex(0);
        styleScrollRef.current?.scrollTo({ animated: false, x: 0 });
      }
    },
    [isProductShoot, isAdShoot],
  );

  const handleShootTypeChange = useCallback((nextShootType: ShootType) => {
    setShootType(nextShootType);

    if (nextShootType === 'product') {
      setProductSubCategory('studio');
      setSelectedPresetId('minimal_studio');
      setSelectedPlatform('Catalog');
      setSelectedSizeId('catalog_square');
      setStyleCardIndex(0);
      styleScrollRef.current?.scrollTo({ animated: false, x: 0 });
      return;
    }

    if (nextShootType === 'social') {
      setSocialSubCategory('show_product');
      setSelectedPresetId('product_highlight');
      setSelectedPlatform('Instagram');
      setSelectedSizeId('instagram_square');
      setStyleCardIndex(0);
      styleScrollRef.current?.scrollTo({ animated: false, x: 0 });
      return;
    }

    if (nextShootType === 'ad') {
      setAdSubCategory('awareness');
      setSelectedPresetId('brand_awareness');
      setSelectedPlatform('Meta Ads');
      setSelectedSizeId('meta_feed_ad');
      setStyleCardIndex(0);
      styleScrollRef.current?.scrollTo({ animated: false, x: 0 });
    }
  }, []);

  useEffect(() => {
    if (isCustomPlatform || platformSpecs.length === 0) {
      return;
    }

    const hasSelectedSize = platformSpecs.some(spec => spec.id === selectedSizeId);
    if (!hasSelectedSize) {
      setSelectedSizeId(platformSpecs[0].id);
    }
  }, [isCustomPlatform, platformSpecs, selectedSizeId]);

  const handleStyleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.min(
        categoryPresets.length - 1,
        Math.max(
          0,
          Math.round(
            event.nativeEvent.contentOffset.x / STYLE_CARD_SNAP_INTERVAL,
          ),
        ),
      );
      const preset = categoryPresets[index];
      if (!preset) {
        return;
      }

      setStyleCardIndex(prev => (prev === index ? prev : index));
      setSelectedPresetId(prev => (prev === preset.id ? prev : preset.id));
    },
    [categoryPresets],
  );

  const selectStylePresetAtIndex = useCallback(
    (index: number) => {
      const preset = categoryPresets[index];
      if (!preset) {
        return;
      }

      setSelectedPresetId(preset.id);
      setStyleCardIndex(index);
      styleScrollRef.current?.scrollTo({
        animated: true,
        x: Math.max(0, index) * STYLE_CARD_SNAP_INTERVAL,
      });
    },
    [categoryPresets],
  );

  const presetCategoryIndex = categoryPresets.findIndex(
    preset => preset.id === selectedPreset.id,
  );

  useEffect(() => {
    if (jewelleryProduct) {
      setQuality(current => (current === 'ultra' ? current : 'ultra'));
    }
  }, [jewelleryProduct]);

  useEffect(() => {
    let cancelled = false;

    productsApi
      .getById(productId)
      .then(product => {
        if (!cancelled) {
          setProductAnalysis(product.analysis ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProductAnalysis(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  useEffect(() => {
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
  }, []);

  const detailsPreview = useMemo(() => {
    const brandTitle = brandKits.find(
      brand => brand.id === productShootDetails.brandId,
    )?.title;
    return getDetailsSummaryPreview(shootType, brandTitle);
  }, [brandKits, productShootDetails.brandId, shootType]);

  const activeBrandKitName = useMemo(() => {
    const brandId =
      productShootDetails.brandId ??
      brandKits.find(kit => kit.isDefault)?.id;
    return brandKits.find(kit => kit.id === brandId)?.title;
  }, [brandKits, productShootDetails.brandId]);

  const generationSteps = useMemo((): GenerationProgressStep[] => {
    const steps: GenerationProgressStep[] = [];

    if (productShootDetails.useBrandKit !== false && activeBrandKitName) {
      steps.push({
        id: 'brand-kit',
        label: `Brand kit applied · ${activeBrandKitName}`,
      });
    }

    steps.push(
      { id: 'subject', label: 'Subject locked' },
      { id: 'render', label: 'Rendering variants' },
      { id: 'copy', label: 'Crafting copy' },
    );

    return steps;
  }, [activeBrandKitName, productShootDetails.useBrandKit]);

  useEffect(() => {
    if (!isGenerating) {
      return;
    }

    const unsubscribe = navigation.addListener('beforeRemove', event => {
      if (!allowLeaveRef.current) {
        event.preventDefault();
      }
    });

    return unsubscribe;
  }, [isGenerating, navigation]);

  const handleGenerate = useCallback(async () => {
    if (isGenerating) {
      return;
    }

    allowLeaveRef.current = false;
    setIsGenerating(true);
    setGenerationComplete(false);
    try {
      const [product, brandsResponse] = await Promise.all([
        productsApi.getById(productId),
        brandsApi.list(),
      ]);

      const defaultBrand = brandsResponse.items.find(kit => kit.isDefault);
      let brandId: string | undefined;

      if (productShootDetails.useBrandKit !== false) {
        brandId = productShootDetails.brandId ?? defaultBrand?.id;
      }

      const jewelleryProductShoot = isJewelryProduct(product.analysis);
      const jewelleryShoot = jewelleryProductShoot && shootType === 'product';
      const setup = buildGenerateSetupFromScreenState({
        shootType,
        productId,
        selectedPresetId,
        selectedSizeId,
        isCustomPlatform,
        customWidth,
        customHeight,
        snapAspectRatio,
        quantity,
        quality: jewelleryProductShoot ? 'ultra' : quality,
        notes,
        productShootDetails,
        socialAdDetails,
        analysis: product.analysis,
        brandId,
        jewelryWorkflow: jewelleryShoot ? 'preset' : undefined,
        jewelrySubtype: jewelleryShoot
          ? inferJewelrySubtype(product.analysis?.productType)
          : undefined,
        jewelryPieceCount: jewelleryShoot ? 1 : undefined,
      });
      const formData = buildGenerateFormData(setup);

      const response = await generateApi.generate(formData);

      if (response.credits?.balance != null) {
        dispatch(setCreditsBalance(response.credits.balance));
      }

      setGenerationComplete(true);
      await new Promise<void>(resolve => {
        setTimeout(resolve, 1000);
      });

      allowLeaveRef.current = true;
      navigation.replace('ShootResults', {
        productName,
        presetName: selectedPreset.name,
        imageUrl,
        response,
      });
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        'Generation failed',
        apiError?.message ?? 'Could not start generation. Please try again.',
      );
      setIsGenerating(false);
      setGenerationComplete(false);
      allowLeaveRef.current = false;
    }
  }, [
    customHeight,
    customWidth,
    dispatch,
    imageUrl,
    isCustomPlatform,
    isGenerating,
    navigation,
    notes,
    productId,
    productName,
    productShootDetails,
    quality,
    quantity,
    selectedPreset.name,
    selectedPresetId,
    selectedSizeId,
    shootType,
    snapAspectRatio,
    socialAdDetails,
  ]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerBar}>
        <HeaderBackButton
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
        />

        <View style={styles.headerStepperWrap}>
          <ProductFlowStepper activeStep={2} />
        </View>

        <Pressable hitSlop={12} style={styles.headerIconButton}>
          <AppIcon color={colors.text} name="more-vertical" size={18} />
        </Pressable>
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
        <View style={styles.segmentTrack}>
          {SHOOT_TYPES.map(tab => {
            const isActive = shootType === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => handleShootTypeChange(tab.id)}
                style={[styles.segmentItem, isActive && styles.segmentItemActive]}
              >
                <Text
                  style={[
                    styles.segmentLabel,
                    isActive && styles.segmentLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isSetupReady ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionScript}>{styleSectionTitle}</Text>
              <Text style={styles.sectionMeta}>
                {selectedPreset.name} · {presetCategoryIndex + 1} of{' '}
                {categoryPresets.length}
              </Text>
            </View>

            <ScrollView
              horizontal
              contentContainerStyle={styles.styleTabsRow}
              showsHorizontalScrollIndicator={false}
            >
              {styleSubCategories.map(category => {
                const isActive = activeSubCategory === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => handleSubCategoryChange(category.id)}
                    style={styles.styleTab}
                  >
                    <Text
                      style={[
                        styles.styleTabLabel,
                        isActive && styles.styleTabLabelActive,
                      ]}
                    >
                      {category.label}
                    </Text>
                    {isActive ? <View style={styles.styleTabUnderline} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>

            <ScrollView
              ref={styleScrollRef}
              horizontal
              decelerationRate="fast"
              onMomentumScrollEnd={handleStyleScroll}
              onScroll={handleStyleScroll}
              onScrollEndDrag={handleStyleScroll}
              pagingEnabled={false}
              scrollEventThrottle={16}
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              snapToInterval={STYLE_CARD_SNAP_INTERVAL}
              contentContainerStyle={styles.styleCardsRow}
            >
              {categoryPresets.map(preset => {
                const isSelected = preset.id === selectedPresetId;
                const isDark = PRESET_CARD_DARK[preset.id] ?? true;
                const cardImage = getPresetCardImage(preset, imageUrl);
                const hasPresetPreview = Boolean(preset.previewImage);

                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => {
                      const index = categoryPresets.findIndex(
                        item => item.id === preset.id,
                      );
                      selectStylePresetAtIndex(index >= 0 ? index : 0);
                    }}
                    style={[
                      styles.styleCard,
                      { width: STYLE_CARD_WIDTH },
                      isSelected && styles.styleCardSelected,
                    ]}
                  >
                    <View style={styles.styleCardInner}>
                      <View style={styles.styleCardImageFrame}>
                        <Image
                          resizeMode={
                            hasPresetPreview ? 'cover' : 'contain'
                          }
                          source={cardImage}
                          style={styles.styleCardImage}
                        />
                      </View>

                      <View
                        pointerEvents="box-none"
                        style={styles.styleCardOverlay}
                      >
                        <View style={styles.styleCardTopRow}>
                          <Text
                            style={[
                              styles.styleCardBadge,
                              !isDark && styles.styleCardBadgeLight,
                            ]}
                          >
                            DEFINED
                          </Text>
                          {isSelected ? (
                            <View style={styles.styleCardCheck}>
                              <AppIcon
                                color={colors.white}
                                name="check"
                                size={14}
                              />
                            </View>
                          ) : (
                            <View style={styles.styleCardCheckPlaceholder} />
                          )}
                        </View>

                        <View style={styles.styleCardFooter}>
                          <View
                            pointerEvents="none"
                            style={[
                              styles.styleCardFooterScrim,
                              !isDark && styles.styleCardFooterScrimLight,
                            ]}
                          />
                          <Text
                            style={[
                              styles.styleCardTitle,
                              !isDark && styles.styleCardTitleLight,
                            ]}
                          >
                            {preset.name}
                          </Text>
                          <Text
                            style={[
                              styles.styleCardBlurb,
                              !isDark && styles.styleCardBlurbLight,
                            ]}
                          >
                            {shortBlurb(preset.blurb)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.paginationRow}>
              {categoryPresets.map((preset, index) => (
                <View
                  key={preset.id}
                  style={[
                    styles.paginationDot,
                    index === styleCardIndex && styles.paginationDotActive,
                  ]}
                />
              ))}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionScript}>Size</Text>
              <Text style={styles.sectionMetaMuted}>Where this lives</Text>
            </View>

            <View style={styles.platformToggleRow}>
              {platformOptions.map(platform => {
                const isActive = selectedPlatform === platform;
                return (
                  <Pressable
                    key={platform}
                    onPress={() => setSelectedPlatform(platform)}
                    style={[
                      styles.platformToggleButton,
                      isActive && styles.platformToggleButtonActive,
                    ]}
                  >
                    {renderPlatformToggleIcon(platform, isActive)}
                    <Text
                      style={[
                        styles.platformToggleLabel,
                        isActive && styles.platformToggleLabelActive,
                      ]}
                    >
                      {platform}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {isCustomPlatform ? (
              <>
                <View style={styles.customDimensionsCard}>
                  <View style={styles.customDimensionsIconWrap}>
                    <SizeIcon active aspect="square" />
                  </View>
                  <View style={styles.customDimensionsText}>
                    <Text style={styles.customDimensionsTitle}>
                      Custom dimensions
                    </Text>
                    <Text style={styles.customDimensionsValue}>
                      {customWidth}×{customHeight}
                    </Text>
                  </View>
                  <View style={styles.customDimensionsCheck}>
                    <AppIcon color={colors.white} name="check" size={13} />
                  </View>
                </View>

                <View style={styles.customInputCard}>
                  <View style={styles.customInputRow}>
                    <View style={styles.customInputField}>
                      <Text style={styles.customInputLabel}>WIDTH (PX)</Text>
                      <TextInput
                        keyboardType="number-pad"
                        maxLength={4}
                        onChangeText={setCustomWidthText}
                        style={styles.customInputValue}
                        value={customWidthText}
                      />
                      <View style={styles.customInputUnderline} />
                    </View>

                    <View style={styles.customInputField}>
                      <Text style={styles.customInputLabel}>HEIGHT (PX)</Text>
                      <TextInput
                        keyboardType="number-pad"
                        maxLength={4}
                        onChangeText={setCustomHeightText}
                        style={styles.customInputValue}
                        value={customHeightText}
                      />
                      <View style={styles.customInputUnderline} />
                    </View>
                  </View>

                  <Text style={styles.customInputHint}>
                    Snaps to{' '}
                    <Text style={styles.customInputHintStrong}>
                      {snapAspectRatio}
                    </Text>{' '}
                    for generation; final image is exported at exactly{' '}
                    <Text style={styles.customInputHintStrong}>
                      {customWidth}×{customHeight}
                    </Text>
                    .
                  </Text>
                </View>
              </>
            ) : platformSpecs.length > 0 ? (
              <ScrollView
                horizontal
                contentContainerStyle={styles.sizeRow}
                showsHorizontalScrollIndicator={false}
              >
                {platformSpecs.map(spec => {
                  const isActive = selectedSizeId === spec.id;
                  const aspect =
                    spec.aspectRatio === '1:1'
                      ? 'square'
                      : spec.aspectRatio === '4:5'
                        ? 'portrait'
                        : spec.aspectRatio === '9:16'
                          ? 'story'
                          : 'landscape';
                  const sizeLabel =
                    spec.exportWidth === spec.exportHeight
                      ? `${spec.exportWidth}²`
                      : `${spec.exportWidth}×${spec.exportHeight}`;

                  return (
                    <Pressable
                      key={spec.id}
                      onPress={() => setSelectedSizeId(spec.id)}
                      style={[styles.sizeCard, isActive && styles.sizeCardActive]}
                    >
                      {isActive ? (
                        <View style={styles.sizeCardCheck}>
                          <AppIcon color={colors.primary} name="check" size={11} />
                        </View>
                      ) : null}
                      <SizeIcon active={isActive} aspect={aspect} />
                      <Text
                        style={[
                          styles.sizeCardLabel,
                          isActive && styles.sizeCardLabelActive,
                        ]}
                      >
                        {spec.label.toUpperCase()}
                      </Text>
                      <Text
                        style={[
                          styles.sizeCardDims,
                          isActive && styles.sizeCardDimsActive,
                        ]}
                      >
                        {sizeLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyPlatformCard}>
                <Text style={styles.emptyPlatformText}>
                  No sizes for {selectedPlatform} yet.
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.comingSoonCard}>
            <Text style={styles.comingSoonTitle}>Ad setup</Text>
            <Text style={styles.comingSoonText}>
              Ad creative presets and platform sizes are coming next.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionScript}>Notes</Text>
          <Text style={styles.sectionMetaMuted}>optional</Text>
        </View>

        <View style={styles.notesField}>
          <TextInput
            multiline
            onChangeText={setNotes}
            placeholder="Make it feel premium..."
            placeholderTextColor={colors.textSoft}
            style={styles.notesInput}
            value={notes}
          />
          <Pressable hitSlop={8} style={styles.notesMic}>
            <AppIcon color={colors.textSoft} name="mic" size={18} />
          </Pressable>
        </View>

        <Pressable
          onPress={() => setDetailsModalVisible(true)}
          style={styles.detailsCard}
        >
          <View style={styles.detailsHeaderDot} />
          <View style={styles.detailsTextWrap}>
            <Text style={styles.detailsTitle}>
              More <Text style={styles.detailsTitleAccent}>details</Text>
            </Text>
            <Text numberOfLines={1} style={styles.detailsSubtitle}>
              {detailsPreview}
            </Text>
          </View>
          <AppIcon color={colors.textSoft} name="chevron-down" size={18} />
        </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>

      <ShootDetailsModal
        onClose={() => setDetailsModalVisible(false)}
        onSave={({ productDetails, socialAdDetails: savedSocialAdDetails }) => {
          setProductShootDetails(productDetails);
          setSocialAdDetails(savedSocialAdDetails);
        }}
        productDetails={productShootDetails}
        shootType={shootType}
        socialAdDetails={socialAdDetails}
        visible={detailsModalVisible}
      />

      <SafeAreaView
        edges={['bottom']}
        style={[styles.bottomBarSafe, quantityMenuOpen && styles.bottomBarSafeOpen]}
      >
        <View style={styles.bottomBar}>
          <Pressable
            onPress={() => setQuantityMenuOpen(open => !open)}
            style={[styles.bottomLeft, quantityMenuOpen && styles.bottomLeftOpen]}
          >
            <View style={styles.variantTrack}>
              <Text style={styles.qualityLabel}>VARIANT</Text>
              <CompactSelectDropdown
                direction="up"
                matchContainerWidth
                onChange={nextValue => setQuantity(Number(nextValue))}
                onOpenChange={setQuantityMenuOpen}
                open={quantityMenuOpen}
                options={QUANTITY_SELECT_OPTIONS}
                triggerStyle={styles.variantButton}
                triggerless
                value={String(quantity)}
                valueStyle={styles.variantValue}
              />
            </View>
            <Text style={styles.quantityMultiply}>×</Text>
          </Pressable>

          <View style={styles.qualityTrack}>
            {visibleQualityOptions.map(option => {
              const isActive = quality === option.id;
              const size = CREATE_QUALITY_RATES[option.id].size;
              const credits = createShotCredits(pricing, option.id, isJewelleryShoot);
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setQuality(option.id)}
                  style={[
                    styles.qualityItem,
                    isActive && styles.qualityItemActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.qualityLabel,
                      isActive && styles.qualityLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.qualityCredits,
                      isActive && styles.qualityCreditsActive,
                    ]}
                  >
                    {size} · {credits}cr
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            disabled={isGenerating}
            onPress={() => void handleGenerate()}
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
          >
            <Image
              resizeMode="contain"
              source={electricityIcon}
              style={styles.generateIcon}
            />
            <Text style={styles.generateText}>{totalCredits}CR</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <GenerationProgressOverlay
        generationComplete={generationComplete}
        qualityLabel={QUALITY_PROGRESS_LABELS[quality]}
        quantity={quantity}
        stepIntervalMs={5000}
        steps={generationSteps}
        visible={isGenerating}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    overflow: 'visible',
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  bottomBarSafe: {
    backgroundColor: colors.background,
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    overflow: 'visible',
    zIndex: 10,
  },
  bottomBarSafeOpen: {
    elevation: 20,
    zIndex: 50,
  },
  bottomLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'visible',
    position: 'relative',
    zIndex: 1,
  },
  bottomLeftOpen: {
    zIndex: 40,
  },
  customDimensionsCard: {
    alignItems: 'center',
    backgroundColor: '#F6E8DE',
    borderColor: colors.primary,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: SECTION_TITLE_GAP,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  customDimensionsCheck: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  customDimensionsIconWrap: {
    alignItems: 'center',
    backgroundColor: '#F6E8DE',
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  customDimensionsText: {
    flex: 1,
    marginLeft: 12,
  },
  customDimensionsTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  customDimensionsValue: {
    color: colors.textMuted,
    fontFamily: monospaceFont,
    fontSize: 12,
    marginTop: 3,
  },
  customInputCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: SECTION_TITLE_GAP,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  customInputField: {
    flex: 1,
  },
  customInputHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
  },
  customInputHintStrong: {
    color: colors.text,
    fontFamily: monospaceFont,
    fontWeight: '700',
  },
  customInputLabel: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  customInputRow: {
    flexDirection: 'row',
    gap: 18,
  },
  customInputUnderline: {
    backgroundColor: colors.border,
    height: 1,
    marginTop: 6,
  },
  customInputValue: {
    color: colors.text,
    fontFamily: monospaceFont,
    fontSize: 22,
    fontWeight: '600',
    marginTop: 8,
    paddingVertical: 0,
  },
  comingSoonCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: SECTION_SPACING,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  comingSoonText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  comingSoonTitle: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 18,
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 6,
  },
  detailsCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    marginTop: SECTION_SPACING,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  detailsHeaderDot: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 8,
    width: 8,
  },
  detailsSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  detailsTextWrap: {
    flex: 1,
  },
  detailsTitle: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 17,
    fontWeight: '700',
  },
  detailsTitleAccent: {
    color: colors.primary,
  },
  platformIconBadge: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.borderSoft,
    borderRadius: 8,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  platformIconBadgeInactive: {
    opacity: 0.72,
  },
  platformToggleIconColored: {
    height: 20,
    width: 20,
  },
  emptyPlatformCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: SECTION_TITLE_GAP,
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  emptyPlatformText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  generateButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    minWidth: 92,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateIcon: {
    height: 16,
    tintColor: colors.white,
    width: 16,
  },
  generateText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerBack: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
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
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  notesField: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 96,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  notesInput: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 72,
    paddingRight: 28,
    textAlignVertical: 'top',
  },
  notesMic: {
    bottom: 12,
    position: 'absolute',
    right: 12,
  },
  platformToggleButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    minWidth: '47%',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  platformToggleButtonActive: {
    backgroundColor: '#F6E8DE',
    borderColor: colors.primary,
  },
  platformToggleIcon: {
    height: 18,
    width: 18,
  },
  platformToggleLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  platformToggleLabelActive: {
    color: colors.primaryDark,
  },
  platformToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paginationDot: {
    backgroundColor: colors.border,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 6,
    width: 18,
  },
  paginationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: SECTION_TITLE_GAP,
  },
  qualityCredits: {
    color: colors.textSoft,
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  qualityCreditsActive: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
  qualityItem: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    paddingVertical: 6,
  },
  qualityItemActive: {
    backgroundColor: colors.primary,
  },
  qualityLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  qualityLabelActive: {
    color: colors.white,
  },
  qualityTrack: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    padding: 3,
  },
  quantityMultiply: {
    color: colors.textSoft,
    fontSize: 14,
    marginLeft: 6,
  },
  variantButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    gap: 1,
    minWidth: 36,
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  variantTrack: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 52,
    paddingHorizontal: 3,
    paddingVertical: 9,
  },
  variantValue: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
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
  sectionHeader: {
    alignItems: 'baseline',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SECTION_TITLE_GAP,
    marginTop: SECTION_SPACING,
  },
  sectionMeta: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  sectionMetaMuted: {
    color: colors.textSoft,
    fontSize: 11,
  },
  sectionScript: {
    color: colors.primary,
    fontFamily: serifFont,
    fontSize: 26,
    fontStyle: 'italic',
    lineHeight: 30,
  },
  segmentItem: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    paddingVertical: 10,
  },
  segmentItemActive: {
    backgroundColor: colors.white,
    shadowColor: colors.shadow,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
  },
  segmentLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },
  segmentTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 14,
    flexDirection: 'row',
    marginTop: 8,
    padding: 4,
  },
  sizeCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    borderWidth: 1,
    minWidth: 92,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  sizeCardActive: {
    backgroundColor: '#F6E8DE',
    borderColor: colors.primary,
  },
  sizeCardCheck: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  sizeCardDims: {
    color: colors.textSoft,
    fontSize: 9,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  sizeCardDimsActive: {
    color: colors.primaryDark,
  },
  sizeCardLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginTop: 8,
  },
  sizeCardLabelActive: {
    color: colors.primaryDark,
  },
  sizeIconShape: {
    opacity: 0.9,
  },
  sizeRow: {
    gap: 10,
    marginTop: SECTION_TITLE_GAP,
    paddingRight: 4,
  },
  styleCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  styleCardBadge: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  styleCardBadgeLight: {
    color: colors.textMuted,
  },
  styleCardBlurb: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
    zIndex: 1,
  },
  styleCardBlurbLight: {
    color: colors.textMuted,
  },
  styleCardCheck: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  styleCardCheckPlaceholder: {
    height: 26,
    width: 26,
  },
  styleCardFooter: {
    paddingBottom: 14,
    paddingHorizontal: 14,
    paddingTop: 10,
    position: 'relative',
  },
  styleCardFooterScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  styleCardFooterScrimLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  styleCardImage: {
    height: '100%',
    width: '100%',
  },
  styleCardImageFrame: {
    ...StyleSheet.absoluteFill,
    height: STYLE_CARD_HEIGHT,
    width: '100%',
  },
  styleCardInner: {
    height: STYLE_CARD_HEIGHT,
    overflow: 'hidden',
  },
  styleCardOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  styleCardSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  styleCardTitle: {
    color: colors.white,
    fontFamily: serifFont,
    fontSize: 22,
    lineHeight: 26,
    zIndex: 1,
  },
  styleCardTitleLight: {
    color: colors.text,
  },
  styleCardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  styleCardsRow: {
    gap: STYLE_CARD_GAP,
    marginTop: SECTION_TITLE_GAP,
    paddingRight: 4,
  },
  styleTab: {
    marginRight: 18,
    paddingBottom: 8,
  },
  styleTabLabel: {
    color: colors.textSoft,
    fontSize: 14,
    fontWeight: '600',
  },
  styleTabLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },
  styleTabUnderline: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 2,
    marginTop: 6,
    width: '100%',
  },
  styleTabsRow: {
    paddingRight: 8,
  },
});

export default ProductShootScreen;
