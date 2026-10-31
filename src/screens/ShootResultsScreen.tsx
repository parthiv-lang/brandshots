import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Clipboard from '@react-native-clipboard/clipboard';
import { useFocusEffect } from '@react-navigation/native';
import AppIcon from '../components/AppIcon';

import type {
  BatchGeneration,
  BatchResultItem,
  GenerationCopy,
  RefineImageQuality,
} from '../services/generations/types';
import { generationsApi } from '../services/generations';
import {
  refineShotCredits,
  useCreditPricing,
  type CreditPricing,
} from '../services/credits/creditPricing';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import { downloadImageToGallery } from '../utils/downloadImage';
import { shareRemoteImage } from '../utils/shareImage';
import {
  formatGenerationMode,
  getGenerationCopyFields,
  getGenerationStyleBadge,
  refineResponseToBatchGeneration,
  type CopyField,
} from '../utils/generationDisplay';
import { isJewelleryGeneration } from '../utils/jewelry';

const electricityIcon = require('../assets/electricity-svgrepo-com.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const IMAGE_HORIZONTAL_INSET = 14;
const IMAGE_MAX_WIDTH = SCREEN_WIDTH - IMAGE_HORIZONTAL_INSET * 2;
const CAROUSEL_PEEK_WIDTH = 44;
const CAROUSEL_ITEM_GAP = 12;
const CAROUSEL_INACTIVE_OPACITY = 0.38;
const DEFAULT_AMBIENT_COLOR = '#1A1410';
const SERIF_FONT = Platform.select({ ios: 'Georgia', android: 'serif' });
const SHEET_TOP_OFFSET = 56;
const SHEET_COLLAPSED_HEIGHT = 252;
const IMAGE_MAX_HEIGHT = Math.min(
  SCREEN_HEIGHT * 0.46,
  SCREEN_HEIGHT - SHEET_COLLAPSED_HEIGHT - 100,
);

const REFINE_SUGGESTIONS = [
  'Warmer lighting',
  'Cleaner background',
  'More vibrant colors',
  'Softer shadows',
  'Closer crop on product',
  'Remove text overlay',
] as const;

const REFINE_QUALITY_OPTIONS: Array<{
  id: RefineImageQuality;
  label: string;
}> = [
  { id: 'low', label: 'Fast' },
  { id: 'medium', label: 'Balanced' },
  { id: 'high', label: 'Refined' },
];

type SheetSnapPoints = {
  collapsedOffset: number;
  expandedOffset: number;
  maxHeight: number;
};

function getSheetSnapPoints(bottomInset: number): SheetSnapPoints {
  const maxHeight = SCREEN_HEIGHT - SHEET_TOP_OFFSET;
  const collapsedHeight = SHEET_COLLAPSED_HEIGHT + bottomInset;

  return {
    collapsedOffset: maxHeight - collapsedHeight,
    expandedOffset: 0,
    maxHeight,
  };
}

type CarouselLayout = {
  contentPadding: number;
  imageMaxWidth: number;
  itemWidth: number;
  snapInterval: number;
  usePeek: boolean;
};

function getCarouselLayout(variantCount: number): CarouselLayout {
  if (variantCount <= 1) {
    return {
      contentPadding: 0,
      imageMaxWidth: IMAGE_MAX_WIDTH,
      itemWidth: SCREEN_WIDTH,
      snapInterval: SCREEN_WIDTH,
      usePeek: false,
    };
  }

  const imageMaxWidth =
    SCREEN_WIDTH - CAROUSEL_PEEK_WIDTH * 2 - CAROUSEL_ITEM_GAP;
  const itemWidth = imageMaxWidth + CAROUSEL_ITEM_GAP;

  return {
    contentPadding: CAROUSEL_PEEK_WIDTH,
    imageMaxWidth,
    itemWidth,
    snapInterval: itemWidth,
    usePeek: true,
  };
}

type Props = NativeStackScreenProps<RootStackParamList, 'ShootResults'>;

type InfoSheetMode = 'menu' | 'details' | 'failed';

type DetailRow = {
  id: string;
  label: string;
  value: string;
  icon: React.ComponentProps<typeof AppIcon>['name'];
};

function buildDetailRows(
  generation: BatchGeneration,
  activeIndex: number,
  totalCount: number,
): DetailRow[] {
  const styleBadge = getGenerationStyleBadge(generation);
  const rows: Array<DetailRow | null> = [
    {
      id: 'variant',
      label: 'Variation',
      value: `${activeIndex + 1} of ${totalCount}`,
      icon: 'layers',
    },
    {
      id: 'mode',
      label: 'Shoot type',
      value: formatGenerationMode(generation.mode),
      icon: 'camera',
    },
    styleBadge
      ? {
          id: 'style',
          label: 'Style',
          value: styleBadge,
          icon: 'aperture',
        }
      : null,
    {
      id: 'aspect',
      label: 'Format',
      value: formatAspectRatioLabel(generation.aspectRatio),
      icon: 'maximize',
    },
    {
      id: 'dimensions',
      label: 'Size',
      value: `${generation.width} × ${generation.height}px`,
      icon: 'crop',
    },
    {
      id: 'quality',
      label: 'Quality',
      value: generation.imageSize,
      icon: 'zap',
    },
    {
      id: 'credits',
      label: 'Credits used',
      value: `${generation.creditsUsed} ${generation.creditsUsed === 1 ? 'credit' : 'credits'}`,
      icon: 'battery-charging',
    },
    generation.platformLabel?.trim()
      ? {
          id: 'platform',
          label: 'Platform',
          value: generation.platformLabel.trim(),
          icon: 'monitor',
        }
      : null,
    generation.nicheLabel?.trim()
      ? {
          id: 'niche',
          label: 'Niche',
          value: generation.nicheLabel.trim(),
          icon: 'tag',
        }
      : null,
    generation.vibeLabel?.trim()
      ? {
          id: 'vibe',
          label: 'Vibe',
          value: generation.vibeLabel.trim(),
          icon: 'sun',
        }
      : null,
    generation.brandTitle?.trim()
      ? {
          id: 'brand',
          label: 'Brand',
          value: generation.brandTitle.trim(),
          icon: 'briefcase',
        }
      : null,
  ];

  return rows.filter((row): row is DetailRow => row != null);
}

function getSuccessfulResults(results: BatchResultItem[]): BatchResultItem[] {
  return results.filter(
    item => item.ok && Boolean(item.generation?.imageUrl?.trim()),
  );
}

function formatAspectRatioLabel(aspectRatio: string): string {
  const normalized = aspectRatio.trim();
  switch (normalized) {
    case '1:1':
      return 'Square';
    case '4:5':
      return 'Portrait';
    case '9:16':
      return 'Story';
    case '16:9':
      return 'Landscape';
    default:
      return normalized;
  }
}

function resolveImageAspectRatio(
  aspectRatio: string,
  pixelWidth?: number,
  pixelHeight?: number,
): number {
  if (pixelWidth && pixelHeight && pixelWidth > 0 && pixelHeight > 0) {
    return pixelWidth / pixelHeight;
  }

  const parts = aspectRatio.split(':').map(Number);
  const ratioW = parts[0];
  const ratioH = parts[1];

  if (ratioW && ratioH) {
    return ratioW / ratioH;
  }

  return 1;
}

function getImageDimensions(
  aspectRatio: string,
  maxWidth: number,
  maxHeight: number,
  pixelWidth?: number,
  pixelHeight?: number,
): { width: number; height: number } {
  const ratio = resolveImageAspectRatio(aspectRatio, pixelWidth, pixelHeight);
  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return { width, height };
}

type AmbientBackgroundProps = {
  imageUrl: string;
  tintColor: string;
};

function AmbientBackground({ imageUrl, tintColor }: AmbientBackgroundProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: tintColor }]}
      />
      <Image
        blurRadius={Platform.select({ ios: 72, android: 36, default: 36 })}
        resizeMode="cover"
        source={{ uri: imageUrl }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, styles.ambientOverlay]} />
    </View>
  );
}

type PageIndicatorProps = {
  count: number;
  activeIndex: number;
};

function PageIndicator({ count, activeIndex }: PageIndicatorProps) {
  if (count <= 1) {
    return null;
  }

  return (
    <View style={styles.pageIndicatorRow}>
      {Array.from({ length: count }).map((_, index) => {
        const isActive = index === activeIndex;
        return (
          <View
            key={`page-dot-${index}`}
            style={[styles.pageDot, isActive && styles.pageDotActive]}
          />
        );
      })}
    </View>
  );
}

type ResultsHeaderProps = {
  activeIndex: number;
  totalCount: number;
  generation: BatchGeneration;
  onClose: () => void;
  onMenuPress: () => void;
};

function ResultsHeader({
  activeIndex,
  totalCount,
  generation,
  onClose,
  onMenuPress,
}: ResultsHeaderProps) {
  const styleBadge = getGenerationStyleBadge(generation);
  const aspectLabel = formatAspectRatioLabel(generation.aspectRatio);
  const badgeParts = [
    `${activeIndex + 1} / ${totalCount}`,
    styleBadge,
    aspectLabel,
  ].filter(Boolean);

  return (
    <View style={styles.headerBar}>
      <Pressable hitSlop={10} onPress={onClose} style={styles.headerIconButton}>
        <AppIcon color={colors.white} name="x" size={18} />
      </Pressable>

      <View style={styles.headerBadge}>
        <Text numberOfLines={1} style={styles.headerBadgeText}>
          {badgeParts.join(' · ')}
        </Text>
      </View>

      <Pressable hitSlop={10} onPress={onMenuPress} style={styles.headerIconButton}>
        <AppIcon color={colors.white} name="more-vertical" size={18} />
      </Pressable>
    </View>
  );
}

type CopyFieldCardProps = {
  field: CopyField;
};

function CopyFieldCard({ field }: CopyFieldCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    Clipboard.setString(field.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [field.value]);

  return (
    <View style={styles.copyCard}>
      <View style={styles.copyCardHeader}>
        <Text style={styles.copyCardLabel}>{field.label}</Text>
        <Pressable hitSlop={8} onPress={handleCopy} style={styles.copyCardAction}>
          <AppIcon
            color={copied ? colors.primarySoft : 'rgba(255,255,255,0.7)'}
            name={copied ? 'check' : 'copy'}
            size={14}
          />
          <Text style={[styles.copyCardActionText, copied && styles.copyCardActionTextDone]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </Pressable>
      </View>
      <Text selectable style={styles.copyCardValue}>
        {field.value}
      </Text>
    </View>
  );
}

type MenuOptionProps = {
  description: string;
  icon: React.ComponentProps<typeof AppIcon>['name'];
  onPress: () => void;
  title: string;
};

function MenuOption({ description, icon, onPress, title }: MenuOptionProps) {
  return (
    <Pressable onPress={onPress} style={styles.menuOption}>
      <View style={styles.menuOptionIconWrap}>
        <AppIcon color={colors.primarySoft} name={icon} size={18} />
      </View>
      <View style={styles.menuOptionTextWrap}>
        <Text style={styles.menuOptionTitle}>{title}</Text>
        <Text style={styles.menuOptionDescription}>{description}</Text>
      </View>
      <AppIcon color="rgba(255,255,255,0.45)" name="chevron-right" size={18} />
    </Pressable>
  );
}

type DetailRowCardProps = {
  row: DetailRow;
};

function DetailRowCard({ row }: DetailRowCardProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailRowIconWrap}>
        <AppIcon color={colors.primarySoft} name={row.icon} size={16} />
      </View>
      <View style={styles.detailRowTextWrap}>
        <Text style={styles.detailRowLabel}>{row.label}</Text>
        <Text style={styles.detailRowValue}>{row.value}</Text>
      </View>
    </View>
  );
}

type ResultsInfoSheetProps = {
  activeIndex: number;
  failedResults: BatchResultItem[];
  generation: BatchGeneration;
  mode: InfoSheetMode;
  onClose: () => void;
  onModeChange: (mode: InfoSheetMode) => void;
  totalCount: number;
  visible: boolean;
};

function ResultsInfoSheet({
  activeIndex,
  failedResults,
  generation,
  mode,
  onClose,
  onModeChange,
  totalCount,
  visible,
}: ResultsInfoSheetProps) {
  const insets = useSafeAreaInsets();
  const detailRows = useMemo(
    () => buildDetailRows(generation, activeIndex, totalCount),
    [activeIndex, generation, totalCount],
  );

  const sheetTitle =
    mode === 'menu'
      ? 'More options'
      : mode === 'details'
        ? 'Shoot details'
        : 'Failed variants';

  const sheetSubtitle =
    mode === 'menu'
      ? 'Everything about this result in one place'
      : mode === 'details'
        ? 'How this creative was generated'
        : `${failedResults.length} variant${failedResults.length === 1 ? '' : 's'} could not be created`;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.sheetOverlay}>
        <Pressable onPress={onClose} style={styles.sheetBackdrop} />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            {mode !== 'menu' ? (
              <Pressable
                hitSlop={10}
                onPress={() => onModeChange('menu')}
                style={styles.sheetBackButton}
              >
                <AppIcon color={colors.white} name="arrow-left" size={18} />
              </Pressable>
            ) : (
              <View style={styles.sheetBackButtonSpacer} />
            )}

            <View style={styles.sheetHeaderTextWrap}>
              <Text style={styles.sheetTitle}>{sheetTitle}</Text>
              <Text style={styles.sheetSubtitle}>{sheetSubtitle}</Text>
            </View>

            <Pressable hitSlop={10} onPress={onClose} style={styles.sheetCloseButton}>
              <AppIcon color={colors.white} name="x" size={18} />
            </Pressable>
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            {mode === 'menu' ? (
              <View style={styles.menuOptionsWrap}>
                <MenuOption
                  description="Style, format, size & credits"
                  icon="info"
                  onPress={() => onModeChange('details')}
                  title="Shoot details"
                />
                {failedResults.length > 0 ? (
                  <MenuOption
                    description="See why some variations did not generate"
                    icon="alert-circle"
                    onPress={() => onModeChange('failed')}
                    title="Failed variants"
                  />
                ) : null}
              </View>
            ) : null}

            {mode === 'details' ? (
              <View style={styles.detailRowsWrap}>
                {detailRows.map(row => (
                  <DetailRowCard key={row.id} row={row} />
                ))}
              </View>
            ) : null}

            {mode === 'failed' ? (
              <View style={styles.failedRowsWrap}>
                {failedResults.map(result => (
                  <View
                    key={`failed-${result.variantIndex}-${result.jobId ?? 'unknown'}`}
                    style={styles.failedCard}
                  >
                    <View style={styles.failedCardHeader}>
                      <AppIcon color="#F2A08D" name="alert-circle" size={16} />
                      <Text style={styles.failedCardTitle}>
                        Variation {result.variantIndex + 1}
                      </Text>
                    </View>
                    <Text style={styles.failedCardBody}>
                      {result.error?.trim() || 'Generation failed for this variation.'}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type ResultsBottomSheetProps = {
  activeIndex: number;
  batchCopy?: GenerationCopy | null;
  bottomInset: number;
  collapseToken: number;
  generation: BatchGeneration;
  imageQuality: RefineImageQuality;
  imageUrl: string;
  isRefining: boolean;
  pricing: CreditPricing | null;
  onImageQualityChange: (quality: RefineImageQuality) => void;
  onRefineChange: (value: string) => void;
  onRefineSubmit: () => void;
  productName: string;
  refineText: string;
  totalCount: number;
};

function ResultsBottomSheet({
  activeIndex,
  batchCopy,
  bottomInset,
  collapseToken,
  generation,
  imageQuality,
  imageUrl,
  isRefining,
  pricing,
  onImageQualityChange,
  onRefineChange,
  onRefineSubmit,
  productName,
  refineText,
  totalCount,
}: ResultsBottomSheetProps) {
  const copyFields = useMemo(
    () => getGenerationCopyFields(generation, batchCopy),
    [batchCopy, generation],
  );
  const styleBadge = getGenerationStyleBadge(generation);
  const aspectLabel = formatAspectRatioLabel(generation.aspectRatio);
  const metaParts = [
    styleBadge,
    aspectLabel,
    `${activeIndex + 1} / ${totalCount}`,
  ].filter(Boolean);

  const snapPoints = useMemo(
    () => getSheetSnapPoints(bottomInset),
    [bottomInset],
  );
  const snapPointsRef = useRef(snapPoints);
  snapPointsRef.current = snapPoints;

  const translateY = useRef(
    new Animated.Value(getSheetSnapPoints(bottomInset).collapsedOffset),
  ).current;
  const dragStartY = useRef(snapPoints.collapsedOffset);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [refineFocused, setRefineFocused] = useState(false);

  const snapTo = useCallback(
    (expanded: boolean) => {
      const points = snapPointsRef.current;
      const toValue = expanded ? points.expandedOffset : points.collapsedOffset;

      Animated.spring(translateY, {
        damping: 24,
        stiffness: 220,
        toValue,
        useNativeDriver: true,
      }).start();
      dragStartY.current = toValue;
      setIsExpanded(expanded);
    },
    [translateY],
  );

  const expandSheet = useCallback(() => {
    snapTo(true);
  }, [snapTo]);

  const collapseSheet = useCallback(() => {
    Keyboard.dismiss();
    snapTo(false);
    setRefineFocused(false);
  }, [snapTo]);

  useEffect(() => {
    if (collapseToken > 0) {
      collapseSheet();
    }
  }, [collapseToken, collapseSheet]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        translateY.stopAnimation(value => {
          dragStartY.current = value;
        });
      },
      onPanResponderMove: (_, gesture) => {
        const points = snapPointsRef.current;
        const nextY = Math.min(
          points.collapsedOffset,
          Math.max(points.expandedOffset, dragStartY.current + gesture.dy),
        );
        translateY.setValue(nextY);
      },
      onPanResponderRelease: (_, gesture) => {
        const points = snapPointsRef.current;
        const currentY = dragStartY.current + gesture.dy;
        const midPoint = points.collapsedOffset * 0.45;
        const shouldExpand = gesture.vy < -0.35 || currentY < midPoint;
        const toValue = shouldExpand
          ? points.expandedOffset
          : points.collapsedOffset;

        Animated.spring(translateY, {
          damping: 24,
          stiffness: 220,
          toValue,
          useNativeDriver: true,
        }).start();
        dragStartY.current = toValue;
        setIsExpanded(shouldExpand);
      },
      onStartShouldSetPanResponder: () => true,
    }),
  ).current;

  const handleDownload = useCallback(async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    try {
      await downloadImageToGallery(imageUrl);
    } finally {
      setIsDownloading(false);
    }
  }, [imageUrl, isDownloading]);

  const handleShare = useCallback(async () => {
    await shareRemoteImage(imageUrl);
  }, [imageUrl]);

  const handleRefineFocus = useCallback(() => {
    setRefineFocused(true);
    expandSheet();
  }, [expandSheet]);

  const handleSuggestionPress = useCallback(
    (suggestion: string) => {
      onRefineChange(suggestion);
    },
    [onRefineChange],
  );

  const canSubmitRefine = refineText.trim().length > 0 && !isRefining;
  const isJewellery = isJewelleryGeneration(generation);

  const handleCopyAllFormatted = useCallback(() => {
    if (copyFields.length === 0) {
      return;
    }

    Clipboard.setString(
      copyFields
        .map(field => `${field.label.toUpperCase()}\n${field.value}`)
        .join('\n\n'),
    );
  }, [copyFields]);

  return (
    <Animated.View
      style={[
        styles.resultsBottomSheet,
        {
          height: snapPoints.maxHeight,
          paddingBottom: bottomInset,
          transform: [{ translateY }],
        },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetKeyboardAvoid}
      >
        <View {...panResponder.panHandlers} style={styles.sheetDragZone}>
          <View style={styles.bottomSheetHandle} />
          <Text numberOfLines={2} style={styles.productTitle}>
            {productName}
          </Text>
          <Text style={styles.productMeta}>{metaParts.join(' · ')}</Text>
        </View>

        <View style={styles.sheetFixedActions}>
          <View style={styles.refineBar}>
            <Image
              resizeMode="contain"
              source={electricityIcon}
              style={styles.refineBarBolt}
            />
            <TextInput
              blurOnSubmit
              editable={!isRefining}
              multiline={false}
              onChangeText={onRefineChange}
              onFocus={handleRefineFocus}
              onSubmitEditing={onRefineSubmit}
              placeholder="warmer light, less background..."
              placeholderTextColor="rgba(255, 255, 255, 0.72)"
              returnKeyType="send"
              style={styles.refineBarInput}
              value={refineText}
            />
            <Pressable
              disabled={!canSubmitRefine}
              hitSlop={8}
              onPress={onRefineSubmit}
              style={[
                styles.refineBarSubmit,
                !canSubmitRefine && styles.refineBarSubmitDisabled,
              ]}
            >
              {isRefining ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <AppIcon color={colors.primary} name="arrow-up" size={18} />
              )}
            </Pressable>
          </View>

          {refineFocused ? (
            <View style={styles.refinePanel}>
              <View style={styles.refineSuggestions}>
                {REFINE_SUGGESTIONS.map(suggestion => {
                  const isSelected = refineText.trim() === suggestion;
                  return (
                    <Pressable
                      key={suggestion}
                      onPress={() => handleSuggestionPress(suggestion)}
                      style={[
                        styles.refineChip,
                        isSelected && styles.refineChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.refineChipText,
                          isSelected && styles.refineChipTextSelected,
                        ]}
                      >
                        {suggestion}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.qualityHeader}>
                <Text style={styles.qualityLabel}>
                  {isJewellery ? 'RESOLUTION' : 'QUALITY'}
                </Text>
                <Text style={styles.qualityHint}>
                  {isJewellery ? 'Jewellery · 4K only' : 'Default · cheapest'}
                </Text>
              </View>

              <View style={styles.qualityRow}>
                {isJewellery ? (
                  <Pressable style={[styles.qualityOption, styles.qualityOptionSelected]}>
                    <Text
                      style={[
                        styles.qualityOptionLabel,
                        styles.qualityOptionLabelSelected,
                      ]}
                    >
                      4K
                    </Text>
                    <Text
                      style={[
                        styles.qualityOptionCredits,
                        styles.qualityOptionCreditsSelected,
                      ]}
                    >
                      {refineShotCredits(pricing, 'high', '4K', true)}cr
                    </Text>
                  </Pressable>
                ) : (
                  REFINE_QUALITY_OPTIONS.map(option => {
                      const isSelected = imageQuality === option.id;
                      const credits = refineShotCredits(
                        pricing,
                        option.id,
                        generation.imageSize,
                        false,
                      );
                      return (
                        <Pressable
                          key={option.id}
                          onPress={() => onImageQualityChange(option.id)}
                          style={[
                            styles.qualityOption,
                            isSelected && styles.qualityOptionSelected,
                          ]}
                        >
                          <Text
                            style={[
                              styles.qualityOptionLabel,
                              isSelected && styles.qualityOptionLabelSelected,
                            ]}
                          >
                            {option.label}
                          </Text>
                          <Text
                            style={[
                              styles.qualityOptionCredits,
                              isSelected && styles.qualityOptionCreditsSelected,
                            ]}
                          >
                            {credits}cr
                          </Text>
                        </Pressable>
                      );
                    })
                )}
              </View>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable
              disabled={isDownloading}
              onPress={() => void handleDownload()}
              style={styles.actionButton}
            >
              {isDownloading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <AppIcon color={colors.white} name="download" size={18} />
              )}
              <Text style={styles.actionButtonText}>Download</Text>
            </Pressable>

            <Pressable
              onPress={() => void handleShare()}
              style={styles.actionButton}
            >
              <AppIcon color={colors.white} name="share-2" size={18} />
              <Text style={styles.actionButtonText}>Share</Text>
            </Pressable>
          </View>
        </View>

        {isExpanded ? (
          <ScrollView
            bounces
            contentContainerStyle={styles.sheetScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.sheetScroll}
          >
            {copyFields.length > 0 ? (
              <>
                <View style={styles.copyKitHeader}>
                  <Text style={styles.copyKitTitle}>Copy kit</Text>
                  <Text style={styles.copyKitHint}>TAP ANY TO COPY</Text>
                </View>
                {copyFields.map(field => (
                  <CopyFieldCard field={field} key={field.id} />
                ))}
                <Pressable
                  onPress={handleCopyAllFormatted}
                  style={styles.copyAllFormattedButton}
                >
                  <AppIcon color={colors.white} name="copy" size={16} />
                  <Text style={styles.copyAllFormattedText}>
                    COPY ALL FORMATTED
                  </Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.sheetEmptyCard}>
                <AppIcon color="rgba(255,255,255,0.45)" name="type" size={28} />
                <Text style={styles.sheetEmptyTitle}>No copy generated</Text>
                <Text style={styles.sheetEmptyBody}>
                  This shoot did not include headlines, captions, or other text.
                </Text>
              </View>
            )}
          </ScrollView>
        ) : copyFields.length > 0 ? (
          <Pressable onPress={expandSheet} style={styles.copyKitTeaser}>
            <AppIcon
              color="rgba(255, 255, 255, 0.55)"
              name="chevron-up"
              size={16}
            />
            <Text style={styles.copyKitTeaserText}>Copy kit</Text>
            <View style={styles.copyKitBadge}>
              <Text style={styles.copyKitBadgeText}>{copyFields.length}</Text>
            </View>
          </Pressable>
        ) : null}
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

function ShootResultsScreen({ navigation, route }: Props) {
  const { productName, response } = route.params;
  const insets = useSafeAreaInsets();
  const [results, setResults] = useState(response.results);
  const successfulResults = useMemo(
    () => getSuccessfulResults(results),
    [results],
  );
  const failedResults = useMemo(
    () => results.filter(item => !item.ok),
    [results],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [refineText, setRefineText] = useState('');
  const [refineQuality, setRefineQuality] = useState<RefineImageQuality>('low');
  const pricing = useCreditPricing();
  const [isRefining, setIsRefining] = useState(false);
  const [sheetCollapseToken, setSheetCollapseToken] = useState(0);
  const [infoSheetVisible, setInfoSheetVisible] = useState(false);
  const [infoSheetMode, setInfoSheetMode] = useState<InfoSheetMode>('menu');
  const carouselRef = useRef<ScrollView>(null);
  const tintFade = useRef(new Animated.Value(1)).current;

  const activeResult =
    successfulResults[selectedIndex] ?? successfulResults[0] ?? null;
  const activeGeneration = activeResult?.generation ?? null;
  const variantCount = successfulResults.length;
  const carouselLayout = useMemo(
    () => getCarouselLayout(variantCount),
    [variantCount],
  );
  const carouselSnapOffsets = useMemo(
    () =>
      carouselLayout.usePeek
        ? successfulResults.map((_, index) => index * carouselLayout.snapInterval)
        : undefined,
    [carouselLayout.snapInterval, carouselLayout.usePeek, successfulResults],
  );

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      if (Platform.OS === 'android') {
        StatusBar.setBackgroundColor('transparent');
        StatusBar.setTranslucent(true);
      }

      return () => {
        StatusBar.setBarStyle('dark-content');
        if (Platform.OS === 'android') {
          StatusBar.setBackgroundColor(colors.background);
          StatusBar.setTranslucent(false);
        }
      };
    }, []),
  );

  const updateAmbientForImage = useCallback(
    (imageUrl: string) => {
      Animated.timing(tintFade, {
        duration: 180,
        toValue: 0.72,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }

        Image.prefetch(imageUrl).finally(() => {
          Animated.timing(tintFade, {
            duration: 220,
            toValue: 1,
            useNativeDriver: true,
          }).start();
        });
      });
    },
    [tintFade],
  );

  const handleCarouselScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / carouselLayout.snapInterval,
      );
      const clampedIndex = Math.max(0, Math.min(nextIndex, variantCount - 1));

      if (clampedIndex === selectedIndex) {
        return;
      }

      setSelectedIndex(clampedIndex);
      const nextImageUrl =
        successfulResults[clampedIndex]?.generation?.imageUrl ?? '';
      if (nextImageUrl) {
        updateAmbientForImage(nextImageUrl);
      }
    },
    [
      carouselLayout.snapInterval,
      selectedIndex,
      successfulResults,
      updateAmbientForImage,
      variantCount,
    ],
  );

  const handleDone = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'MainTabs',
          params: { screen: 'Creatives' },
        },
      ],
    });
  }, [navigation]);

  const handleMenuPress = useCallback(() => {
    if (!activeGeneration) {
      return;
    }

    setInfoSheetMode('menu');
    setInfoSheetVisible(true);
  }, [activeGeneration]);

  const handleInfoSheetClose = useCallback(() => {
    setInfoSheetVisible(false);
    setInfoSheetMode('menu');
  }, []);

  const handleRefineSubmit = useCallback(async () => {
    const feedback = refineText.trim();
    if (!feedback || !activeGeneration || isRefining) {
      return;
    }

    setIsRefining(true);
    try {
      const jewellery = isJewelleryGeneration(activeGeneration);
      const refined = await generationsApi.refine(
        activeGeneration.id,
        jewellery
          ? { feedback, jewelryWorkflow: 'preset' }
          : { feedback, imageQuality: refineQuality },
      );
      const batchGeneration = refineResponseToBatchGeneration(refined);
      const newResult: BatchResultItem = {
        ok: true,
        variantIndex: successfulResults.length,
        generation: batchGeneration,
      };

      setResults(current => [...current, newResult]);
      const newIndex = successfulResults.length;
      setSelectedIndex(newIndex);
      setRefineText('');
      setSheetCollapseToken(token => token + 1);
      updateAmbientForImage(refined.imageUrl);

      const layout = getCarouselLayout(successfulResults.length + 1);
      requestAnimationFrame(() => {
        carouselRef.current?.scrollTo({
          animated: true,
          x: newIndex * layout.snapInterval,
        });
      });
    } catch (error) {
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String(error.message)
          : 'Could not refine this image. Please try again.';
      Alert.alert('Refine failed', message);
    } finally {
      setIsRefining(false);
    }
  }, [
    activeGeneration,
    isRefining,
    refineQuality,
    refineText,
    successfulResults.length,
    updateAmbientForImage,
  ]);

  if (!activeGeneration) {
    return (
      <View style={styles.screenRoot}>
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: DEFAULT_AMBIENT_COLOR }]}
        />
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.headerBar}>
            <Pressable
              hitSlop={10}
              onPress={() => navigation.goBack()}
              style={styles.headerIconButton}
            >
              <AppIcon color={colors.white} name="x" size={18} />
            </Pressable>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>No results</Text>
            </View>
            <View style={styles.headerIconButton} />
          </View>

          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No images generated</Text>
            <Text style={styles.emptyBody}>
              {failedResults.length > 0
                ? 'All variants failed. Please try again with different settings.'
                : 'Something went wrong and no results were returned.'}
            </Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.emptyButton}
            >
              <Text style={styles.emptyButtonText}>Try again</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: tintFade }]}>
        <AmbientBackground
          imageUrl={activeGeneration.imageUrl}
          tintColor={DEFAULT_AMBIENT_COLOR}
        />
      </Animated.View>

      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.flex}>
          <ResultsHeader
            activeIndex={selectedIndex}
            generation={activeGeneration}
            onClose={handleDone}
            onMenuPress={handleMenuPress}
            totalCount={variantCount}
          />

          <View
            style={[
              styles.carouselSection,
              { paddingBottom: SHEET_COLLAPSED_HEIGHT + insets.bottom },
            ]}
          >
            <ScrollView
              ref={carouselRef}
              horizontal
              bounces={variantCount > 1}
              contentContainerStyle={
                carouselLayout.usePeek
                  ? { paddingHorizontal: carouselLayout.contentPadding }
                  : undefined
              }
              decelerationRate="fast"
              disableIntervalMomentum
              onMomentumScrollEnd={handleCarouselScrollEnd}
              pagingEnabled={false}
              scrollEnabled={variantCount > 1}
              showsHorizontalScrollIndicator={false}
              snapToAlignment="start"
              snapToOffsets={carouselSnapOffsets}
              style={styles.carouselScroll}
            >
              {successfulResults.map((result, index) => {
                const generation = result.generation!;
                const frame = getImageDimensions(
                  generation.aspectRatio,
                  carouselLayout.imageMaxWidth,
                  IMAGE_MAX_HEIGHT,
                  generation.width,
                  generation.height,
                );
                const isActive = index === selectedIndex;

                return (
                  <View
                    key={generation.id}
                    style={[
                      styles.carouselPage,
                      { width: carouselLayout.itemWidth },
                    ]}
                  >
                    <View
                      style={[
                        styles.imageFrame,
                        {
                          height: frame.height,
                          width: frame.width,
                          opacity:
                            carouselLayout.usePeek && !isActive
                              ? CAROUSEL_INACTIVE_OPACITY
                              : 1,
                        },
                      ]}
                    >
                      <Image
                        resizeMode="contain"
                        source={{ uri: generation.imageUrl }}
                        style={styles.resultImage}
                      />
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <PageIndicator activeIndex={selectedIndex} count={variantCount} />
          </View>
        </View>
      </SafeAreaView>

      <ResultsBottomSheet
        activeIndex={selectedIndex}
        batchCopy={response.copy}
        bottomInset={insets.bottom}
        collapseToken={sheetCollapseToken}
        generation={activeGeneration}
        imageQuality={refineQuality}
        imageUrl={activeGeneration.imageUrl}
        isRefining={isRefining}
        pricing={pricing}
        onImageQualityChange={setRefineQuality}
        onRefineChange={setRefineText}
        onRefineSubmit={() => void handleRefineSubmit()}
        productName={productName}
        refineText={refineText}
        totalCount={variantCount}
      />

      <ResultsInfoSheet
        activeIndex={selectedIndex}
        failedResults={failedResults}
        generation={activeGeneration}
        mode={infoSheetMode}
        onClose={handleInfoSheetClose}
        onModeChange={setInfoSheetMode}
        totalCount={variantCount}
        visible={infoSheetVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  ambientOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
  },
  carouselScroll: {
    backgroundColor: 'transparent',
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  bottomSheetHandle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 999,
    height: 4,
    marginBottom: 10,
    width: 42,
  },
  carouselPage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselSection: {
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
  },
  emptyBody: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginTop: 24,
    minWidth: 140,
    paddingHorizontal: 20,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  flex: {
    flex: 1,
  },
  headerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
    maxWidth: SCREEN_WIDTH * 0.58,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 4,
  },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  imageFrame: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 18,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pageDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  pageDotActive: {
    backgroundColor: colors.white,
    width: 22,
  },
  pageIndicatorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 12,
  },
  productMeta: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    marginTop: 2,
  },
  productTitle: {
    color: colors.white,
    fontFamily: SERIF_FONT,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  refineBar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    flexDirection: 'row',
    minHeight: 46,
    paddingLeft: 14,
    paddingRight: 5,
    paddingVertical: 5,
  },
  refineBarBolt: {
    height: 16,
    marginRight: 10,
    tintColor: colors.white,
    width: 16,
  },
  refineBarInput: {
    color: colors.white,
    flex: 1,
    fontFamily: SERIF_FONT,
    fontSize: 15,
    fontStyle: 'italic',
    paddingVertical: 0,
  },
  refineBarSubmit: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  refineBarSubmitDisabled: {
    opacity: 0.55,
  },
  refineChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refineChipSelected: {
    backgroundColor: 'rgba(199, 101, 59, 0.22)',
    borderColor: colors.primarySoft,
  },
  refineChipText: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 13,
    fontWeight: '500',
  },
  refineChipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  refinePanel: {
    marginTop: 12,
  },
  refineSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  qualityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 14,
  },
  qualityHint: {
    color: 'rgba(255, 255, 255, 0.42)',
    fontSize: 11,
    fontWeight: '500',
  },
  qualityLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  qualityOption: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  qualityOptionCredits: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  qualityOptionCreditsSelected: {
    color: 'rgba(255, 255, 255, 0.82)',
  },
  qualityOptionLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  qualityOptionLabelSelected: {
    color: colors.white,
  },
  qualityOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qualityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  resultsBottomSheet: {
    backgroundColor: 'rgba(18, 14, 12, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  sheetDragZone: {
    paddingBottom: 2,
  },
  sheetFixedActions: {
    paddingTop: 4,
  },
  sheetKeyboardAvoid: {
    flex: 1,
  },
  sheetScroll: {
    flex: 1,
    marginTop: 16,
  },
  sheetScrollContent: {
    paddingBottom: 12,
  },
  resultImage: {
    height: '100%',
    width: '100%',
  },
  safeArea: {
    flex: 1,
  },
  screenRoot: {
    backgroundColor: DEFAULT_AMBIENT_COLOR,
    flex: 1,
  },
  copyAllFormattedButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    height: 50,
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  copyAllFormattedText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  copyKitBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    minWidth: 22,
    paddingHorizontal: 6,
  },
  copyKitBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  copyKitHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  copyKitHint: {
    color: 'rgba(255, 255, 255, 0.42)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  copyKitTeaser: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 2,
  },
  copyKitTeaserText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 14,
    fontWeight: '600',
  },
  copyKitTitle: {
    color: colors.primarySoft,
    fontFamily: SERIF_FONT,
    fontSize: 22,
    fontWeight: '700',
  },
  copyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  copyCardAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  copyCardActionText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '700',
  },
  copyCardActionTextDone: {
    color: colors.primarySoft,
  },
  copyCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  copyCardLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  copyCardValue: {
    color: colors.white,
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  detailRowIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(199, 101, 59, 0.18)',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  detailRowLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  detailRowTextWrap: {
    flex: 1,
    gap: 2,
  },
  detailRowValue: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  detailRowsWrap: {
    gap: 0,
  },
  failedCard: {
    backgroundColor: 'rgba(242, 160, 141, 0.1)',
    borderColor: 'rgba(242, 160, 141, 0.28)',
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  failedCardBody: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  failedCardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  failedCardTitle: {
    color: '#F2A08D',
    fontSize: 14,
    fontWeight: '700',
  },
  failedRowsWrap: {
    gap: 0,
  },
  menuOption: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuOptionDescription: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  menuOptionIconWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(199, 101, 59, 0.18)',
    borderRadius: 12,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  menuOptionTextWrap: {
    flex: 1,
  },
  menuOptionTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  menuOptionsWrap: {
    gap: 0,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetBackButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sheetBackButtonSpacer: {
    width: 36,
  },
  sheetCloseButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sheetContainer: {
    backgroundColor: '#1C1612',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: SCREEN_HEIGHT * 0.78,
    paddingTop: 8,
  },
  sheetContent: {
    paddingBottom: 8,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 4,
  },
  sheetEmptyBody: {
    color: 'rgba(255, 255, 255, 0.58)',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  sheetEmptyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  sheetEmptyTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 999,
    height: 4,
    marginBottom: 12,
    width: 42,
  },
  sheetHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 12,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  sheetHeaderTextWrap: {
    flex: 1,
    paddingTop: 2,
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetSubtitle: {
    color: 'rgba(255, 255, 255, 0.58)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  sheetTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
});

export default ShootResultsScreen;
