import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
} from '../services/generations/types';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';
import { downloadImageToGallery } from '../utils/downloadImage';
import { shareRemoteImage } from '../utils/shareImage';
import {
  formatGenerationMode,
  getGenerationCopyFields,
  getGenerationStyleBadge,
  type CopyField,
} from '../utils/generationDisplay';

const electricityIcon = require('../assets/electricity-svgrepo-com.png');

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HORIZONTAL_PADDING = 20;
const IMAGE_HORIZONTAL_INSET = 18;
const IMAGE_MAX_WIDTH = SCREEN_WIDTH - IMAGE_HORIZONTAL_INSET * 2;
const IMAGE_MAX_HEIGHT = SCREEN_HEIGHT * 0.64;
const DEFAULT_AMBIENT_COLOR = '#1A1410';

type Props = NativeStackScreenProps<RootStackParamList, 'ShootResults'>;

type InfoSheetMode = 'menu' | 'copy' | 'details' | 'failed';

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
  batchCopy?: GenerationCopy | null;
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
  batchCopy,
  failedResults,
  generation,
  mode,
  onClose,
  onModeChange,
  totalCount,
  visible,
}: ResultsInfoSheetProps) {
  const insets = useSafeAreaInsets();
  const copyFields = useMemo(
    () => getGenerationCopyFields(generation, batchCopy),
    [batchCopy, generation],
  );
  const detailRows = useMemo(
    () => buildDetailRows(generation, activeIndex, totalCount),
    [activeIndex, generation, totalCount],
  );

  const sheetTitle =
    mode === 'menu'
      ? 'More options'
      : mode === 'copy'
        ? 'Copy & messaging'
        : mode === 'details'
          ? 'Shoot details'
          : 'Failed variants';

  const sheetSubtitle =
    mode === 'menu'
      ? 'Everything about this result in one place'
      : mode === 'copy'
        ? 'Tap copy on any field to paste into your post or ad'
        : mode === 'details'
          ? 'How this creative was generated'
          : `${failedResults.length} variant${failedResults.length === 1 ? '' : 's'} could not be created`;

  const handleCopyAll = useCallback(() => {
    if (copyFields.length === 0) {
      return;
    }

    Clipboard.setString(
      copyFields.map(field => `${field.label}: ${field.value}`).join('\n\n'),
    );
  }, [copyFields]);

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
                  description="Headlines, captions, CTAs & hashtags"
                  icon="type"
                  onPress={() => onModeChange('copy')}
                  title="Copy & messaging"
                />
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

            {mode === 'copy' ? (
              copyFields.length > 0 ? (
                <>
                  <Pressable onPress={handleCopyAll} style={styles.copyAllButton}>
                    <AppIcon color={colors.white} name="copy" size={16} />
                    <Text style={styles.copyAllButtonText}>Copy all fields</Text>
                  </Pressable>
                  {copyFields.map(field => (
                    <CopyFieldCard field={field} key={field.id} />
                  ))}
                </>
              ) : (
                <View style={styles.sheetEmptyCard}>
                  <AppIcon color="rgba(255,255,255,0.45)" name="type" size={28} />
                  <Text style={styles.sheetEmptyTitle}>No copy generated</Text>
                  <Text style={styles.sheetEmptyBody}>
                    This shoot did not include headlines, captions, or other text.
                  </Text>
                </View>
              )
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

type BottomActionBarProps = {
  imageUrl: string;
  refineText: string;
  onRefineChange: (value: string) => void;
  onRefineSubmit: () => void;
};

function BottomActionBar({
  imageUrl,
  refineText,
  onRefineChange,
  onRefineSubmit,
}: BottomActionBarProps) {
  const [isDownloading, setIsDownloading] = useState(false);

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

  return (
    <View style={styles.bottomBar}>
      <Pressable
        disabled={isDownloading}
        hitSlop={8}
        onPress={() => void handleDownload()}
        style={styles.bottomSideButton}
      >
        {isDownloading ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <AppIcon color={colors.white} name="bookmark" size={18} />
        )}
      </Pressable>

      <View style={styles.refineFieldWrap}>
        <Image
          resizeMode="contain"
          source={electricityIcon}
          style={styles.refineBoltIcon}
        />
        <TextInput
          blurOnSubmit
          multiline={false}
          onChangeText={onRefineChange}
          onSubmitEditing={onRefineSubmit}
          placeholder='Refine — "warmer light..."'
          placeholderTextColor="rgba(255, 255, 255, 0.42)"
          returnKeyType="send"
          style={styles.refineInput}
          value={refineText}
        />
        <View style={styles.refineCreditBadge}>
          <Text style={styles.refineCreditText}>1 credit used</Text>
        </View>
      </View>

      <Pressable
        hitSlop={8}
        onPress={() => void handleShare()}
        style={styles.bottomShareButton}
      >
        <AppIcon color={colors.white} name="upload" size={18} />
      </Pressable>
    </View>
  );
}

function ShootResultsScreen({ navigation, route }: Props) {
  const { response } = route.params;
  const successfulResults = useMemo(
    () => getSuccessfulResults(response.results),
    [response.results],
  );
  const failedResults = useMemo(
    () => response.results.filter(item => !item.ok),
    [response.results],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [refineText, setRefineText] = useState('');
  const [infoSheetVisible, setInfoSheetVisible] = useState(false);
  const [infoSheetMode, setInfoSheetMode] = useState<InfoSheetMode>('menu');
  const carouselRef = useRef<ScrollView>(null);
  const tintFade = useRef(new Animated.Value(1)).current;

  const activeResult =
    successfulResults[selectedIndex] ?? successfulResults[0] ?? null;
  const activeGeneration = activeResult?.generation ?? null;
  const variantCount = successfulResults.length;

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
        event.nativeEvent.contentOffset.x / SCREEN_WIDTH,
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
    [selectedIndex, successfulResults, updateAmbientForImage, variantCount],
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

  const handleRefineSubmit = useCallback(() => {
    const trimmed = refineText.trim();
    if (!trimmed) {
      return;
    }

    Alert.alert(
      'Refine image',
      'Image refinement uses 1 credit and will be available in a future update.',
      [{ text: 'OK' }],
    );
  }, [refineText]);

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

      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <ResultsHeader
            activeIndex={selectedIndex}
            generation={activeGeneration}
            onClose={handleDone}
            onMenuPress={handleMenuPress}
            totalCount={variantCount}
          />

          <View style={styles.carouselSection}>
            <ScrollView
              ref={carouselRef}
              horizontal
              bounces={variantCount > 1}
              decelerationRate="fast"
              disableIntervalMomentum
              onMomentumScrollEnd={handleCarouselScrollEnd}
              pagingEnabled={variantCount > 1}
              scrollEnabled={variantCount > 1}
              showsHorizontalScrollIndicator={false}
              snapToAlignment="center"
              snapToInterval={SCREEN_WIDTH}
              style={styles.carouselScroll}
            >
              {successfulResults.map(result => {
                const generation = result.generation!;
                const frame = getImageDimensions(
                  generation.aspectRatio,
                  IMAGE_MAX_WIDTH,
                  IMAGE_MAX_HEIGHT,
                  generation.width,
                  generation.height,
                );

                return (
                  <View
                    key={generation.id}
                    style={[styles.carouselPage, { width: SCREEN_WIDTH }]}
                  >
                    <View
                      style={[
                        styles.imageFrame,
                        { height: frame.height, width: frame.width },
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

          <View style={styles.bottomBarWrap}>
            <BottomActionBar
              imageUrl={activeGeneration.imageUrl}
              onRefineChange={setRefineText}
              onRefineSubmit={handleRefineSubmit}
              refineText={refineText}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ResultsInfoSheet
        activeIndex={selectedIndex}
        batchCopy={response.copy}
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
  bottomBar: {
    alignItems: 'center',
    backgroundColor: 'rgba(18, 14, 12, 0.72)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  bottomBarWrap: {
    paddingBottom: 8,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  bottomShareButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 999,
    height: 46,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    width: 46,
  },
  bottomSideButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    height: 46,
    justifyContent: 'center',
    width: 46,
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
    marginTop: 18,
  },
  refineBoltIcon: {
    height: 14,
    marginRight: 8,
    tintColor: colors.primarySoft,
    width: 14,
  },
  refineCreditBadge: {
    marginLeft: 8,
  },
  refineCreditText: {
    color: 'rgba(255, 255, 255, 0.58)',
    fontSize: 11,
    fontWeight: '700',
  },
  refineFieldWrap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    flex: 1,
    flexDirection: 'row',
    minHeight: 46,
    paddingHorizontal: 14,
  },
  refineInput: {
    color: colors.white,
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
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
  copyAllButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    height: 46,
    justifyContent: 'center',
    marginBottom: 12,
  },
  copyAllButtonText: {
    color: colors.white,
    fontSize: 14,
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
