import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Clipboard from '@react-native-clipboard/clipboard';
import AppIcon from '../components/AppIcon';
import HeaderBackButton from '../components/HeaderBackButton';

import ProductFlowStepper from '../components/ProductFlowStepper';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = 22;
const IMAGE_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING * 2;
const VARIANT_THUMB_SIZE = 72;

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif' });

type Props = NativeStackScreenProps<RootStackParamList, 'ShootResults'>;

type CopyFieldRowProps = {
  field: CopyField;
};

function CopyFieldRow({ field }: CopyFieldRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    Clipboard.setString(field.value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [field.value]);

  return (
    <View style={styles.copyField}>
      <View style={styles.copyFieldHeader}>
        <Text style={styles.copyFieldLabel}>{field.label}</Text>
        <Pressable hitSlop={8} onPress={handleCopy} style={styles.copyActionButton}>
          <AppIcon color={colors.textMuted} name="copy" size={14} />
          <Text style={styles.copyActionText}>{copied ? 'Copied' : 'Copy'}</Text>
        </Pressable>
      </View>
      <Text selectable style={styles.copyFieldValue}>
        {field.value}
      </Text>
    </View>
  );
}

type VariantMetaProps = {
  generation: BatchGeneration;
};

function VariantMeta({ generation }: VariantMetaProps) {
  const styleBadge = getGenerationStyleBadge(generation);
  const modeLabel = formatGenerationMode(generation.mode);
  const dimensionLabel = `${generation.width} × ${generation.height}`;

  return (
    <View style={styles.metaSection}>
      <View style={styles.metaChipRow}>
        <View style={styles.metaChip}>
          <Text style={styles.metaChipText}>{modeLabel.toUpperCase()}</Text>
        </View>
        {styleBadge ? (
          <View style={styles.metaChipMuted}>
            <Text style={styles.metaChipMutedText}>{styleBadge}</Text>
          </View>
        ) : null}
        <View style={styles.metaChipMuted}>
          <Text style={styles.metaChipMutedText}>{generation.aspectRatio}</Text>
        </View>
        <View style={styles.metaChipMuted}>
          <Text style={styles.metaChipMutedText}>{generation.imageSize}</Text>
        </View>
      </View>
      <Text style={styles.metaDetail}>
        {dimensionLabel} · {generation.creditsUsed}{' '}
        {generation.creditsUsed === 1 ? 'credit' : 'credits'} used
      </Text>
    </View>
  );
}

type CopySectionProps = {
  generation: BatchGeneration;
  batchCopy?: GenerationCopy | null;
};

function CopySection({ batchCopy, generation }: CopySectionProps) {
  const copyFields = useMemo(
    () => getGenerationCopyFields(generation, batchCopy),
    [batchCopy, generation],
  );

  if (copyFields.length === 0) {
    return null;
  }

  return (
    <View style={styles.copySection}>
      <Text style={styles.sectionTitle}>Copy & messaging</Text>
      {copyFields.map(field => (
        <CopyFieldRow field={field} key={field.id} />
      ))}
    </View>
  );
}

function getSuccessfulResults(results: BatchResultItem[]): BatchResultItem[] {
  return results.filter(
    item => item.ok && Boolean(item.generation?.imageUrl?.trim()),
  );
}

type VariantThumbnailStripProps = {
  results: BatchResultItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

function VariantThumbnailStrip({
  results,
  selectedIndex,
  onSelect,
}: VariantThumbnailStripProps) {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.variantThumbRow}
      showsHorizontalScrollIndicator={false}
    >
      {results.map((result, index) => {
        const imageUrl = result.generation?.imageUrl ?? '';
        const isSelected = index === selectedIndex;

        return (
          <Pressable
            key={result.generation?.id ?? `variant-${result.variantIndex}`}
            onPress={() => onSelect(index)}
            style={[styles.variantThumbWrap, isSelected && styles.variantThumbWrapSelected]}
          >
            <Image
              resizeMode="cover"
              source={{ uri: imageUrl }}
              style={styles.variantThumbImage}
            />
            <Text
              style={[
                styles.variantThumbLabel,
                isSelected && styles.variantThumbLabelSelected,
              ]}
            >
              {result.variantIndex + 1}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

type ImageActionBarProps = {
  imageUrl: string;
};

function ImageActionBar({ imageUrl }: ImageActionBarProps) {
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
    <View style={styles.imageActionBar}>
      <Pressable
        disabled={isDownloading}
        onPress={() => void handleDownload()}
        style={[styles.imageActionButton, isDownloading && styles.imageActionButtonDisabled]}
      >
        {isDownloading ? (
          <ActivityIndicator color={colors.text} size="small" />
        ) : (
          <AppIcon color={colors.text} name="download" size={16} />
        )}
        <Text style={styles.imageActionText}>Download</Text>
      </Pressable>

      <Pressable onPress={() => void handleShare()} style={styles.imageActionButton}>
        <AppIcon color={colors.text} name="share-2" size={16} />
        <Text style={styles.imageActionText}>Share</Text>
      </Pressable>
    </View>
  );
}

function ShootResultsScreen({ navigation, route }: Props) {
  const { productName, presetName, response } = route.params;
  const successfulResults = useMemo(
    () => getSuccessfulResults(response.results),
    [response.results],
  );
  const failedResults = useMemo(
    () => response.results.filter(item => !item.ok),
    [response.results],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeResult =
    successfulResults[selectedIndex] ?? successfulResults[0] ?? null;
  const activeGeneration = activeResult?.generation ?? null;

  const creditsBalance = response.credits?.balance;
  const variantCount = successfulResults.length;
  const summaryLine = presetName
    ? `${productName} · ${presetName}`
    : productName;

  const handleCreateAnother = useCallback(() => {
    navigation.pop();
  }, [navigation]);

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

  if (!activeGeneration) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.headerBar}>
          <HeaderBackButton
            onPress={() => navigation.goBack()}
            style={styles.headerBack}
          />
          <View style={styles.headerStepperWrap}>
            <ProductFlowStepper activeStep={3} />
          </View>
          <View style={styles.headerBack} />
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No images generated</Text>
          <Text style={styles.emptyBody}>
            {failedResults.length > 0
              ? 'All variants failed. Please try again with different settings.'
              : 'Something went wrong and no results were returned.'}
          </Text>
          <Pressable onPress={handleCreateAnother} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.headerBar}>
        <HeaderBackButton onPress={handleDone} style={styles.headerBack} />

        <View style={styles.headerStepperWrap}>
          <ProductFlowStepper activeStep={3} />
        </View>

        {creditsBalance != null ? (
          <View style={styles.creditsPill}>
            <Image
              resizeMode="contain"
              source={electricityIcon}
              style={styles.creditsIcon}
            />
            <Text style={styles.creditsText}>{creditsBalance}</Text>
          </View>
        ) : (
          <View style={styles.headerBack} />
        )}
      </View>

      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.resultsTitle}>Your results</Text>
        <Text style={styles.summaryLine}>{summaryLine}</Text>
        <Text style={styles.successLine}>
          {variantCount} {variantCount === 1 ? 'variant' : 'variants'} ready
        </Text>

        <View style={styles.imageCard}>
          {variantCount > 1 ? (
            <View style={styles.variantBadgeOnImage}>
              <Text style={styles.variantBadgeOnImageText}>
                Variant {(activeResult?.variantIndex ?? 0) + 1} of {variantCount}
              </Text>
            </View>
          ) : null}
          <Image
            key={activeGeneration.id}
            resizeMode="contain"
            source={{ uri: activeGeneration.imageUrl }}
            style={styles.resultImage}
          />
        </View>

        {variantCount > 1 ? (
          <VariantThumbnailStrip
            onSelect={setSelectedIndex}
            results={successfulResults}
            selectedIndex={selectedIndex}
          />
        ) : null}

        <ImageActionBar imageUrl={activeGeneration.imageUrl} />

        <VariantMeta generation={activeGeneration} />
        <CopySection batchCopy={response.copy} generation={activeGeneration} />

        {failedResults.length > 0 ? (
          <View style={styles.failedSection}>
            <Text style={styles.sectionTitle}>Failed variants</Text>
            {failedResults.map(result => (
              <View
                key={`failed-${result.variantIndex}-${result.jobId ?? 'unknown'}`}
                style={styles.failedCard}
              >
                <Text style={styles.failedTitle}>
                  Variant {result.variantIndex + 1}
                </Text>
                <Text style={styles.failedBody}>
                  {result.error?.trim() || 'Generation failed for this variant.'}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.bottomBarSafe}>
        <View style={styles.bottomBar}>
          <Pressable onPress={handleCreateAnother} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Create another</Text>
          </Pressable>
          <Pressable onPress={handleDone} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>View in Creatives</Text>
            <AppIcon color={colors.white} name="arrow-right" size={16} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: 12,
  },
  bottomBarSafe: {
    backgroundColor: colors.background,
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
  },
  content: {
    paddingBottom: 24,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 16,
  },
  copyEmptyBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  copyEmptyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  copyEmptyTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  copyField: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  copyFieldHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  copyFieldLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  copyFieldValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  copySection: {
    marginTop: 22,
  },
  copyActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 4,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  copyActionText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  creditsIcon: {
    height: 14,
    marginRight: 4,
    tintColor: colors.primary,
    width: 14,
  },
  creditsPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    minWidth: 44,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  creditsText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 24,
    textAlign: 'center',
  },
  failedBody: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  failedCard: {
    backgroundColor: '#FDEFEA',
    borderColor: '#E8C4B4',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  failedSection: {
    marginTop: 24,
  },
  failedTitle: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
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
  resultsTitle: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
    marginTop: 12,
    textAlign: 'center',
  },
  imageCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: IMAGE_WIDTH,
    justifyContent: 'center',
    marginTop: 18,
    overflow: 'hidden',
    width: IMAGE_WIDTH,
  },
  imageActionBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  imageActionButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 44,
    justifyContent: 'center',
  },
  imageActionButtonDisabled: {
    opacity: 0.7,
  },
  imageActionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  variantBadgeOnImage: {
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
    borderRadius: 999,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: 'absolute',
    top: 12,
    zIndex: 1,
  },
  variantBadgeOnImageText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  variantThumbImage: {
    borderRadius: 10,
    height: '100%',
    width: '100%',
  },
  variantThumbLabel: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 999,
    bottom: 4,
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    right: 4,
  },
  variantThumbLabelSelected: {
    backgroundColor: colors.primary,
  },
  variantThumbRow: {
    gap: 10,
    marginTop: 12,
    paddingRight: 8,
  },
  variantThumbWrap: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 2,
    height: VARIANT_THUMB_SIZE,
    overflow: 'hidden',
    width: VARIANT_THUMB_SIZE,
  },
  variantThumbWrapSelected: {
    borderColor: colors.primary,
  },
  metaChip: {
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipMuted: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  metaChipMutedText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  metaChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaChipText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  metaDetail: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 10,
  },
  metaSection: {
    marginTop: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  resultImage: {
    height: '100%',
    width: '100%',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    minWidth: 132,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 20,
    lineHeight: 24,
  },
  successLine: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
  summaryLine: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default ShootResultsScreen;
