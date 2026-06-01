import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BlockingLoadingOverlay from '../components/BlockingLoadingOverlay';
import CreativesFilterSelect, {
  FILTER_ALL_KEY,
  type FilterSelectItem,
} from '../components/CreativesFilterSelect';
import GenerationCard from '../components/GenerationCard';
import { PLATFORM_SPECS } from '../constants/platformSpecs';
import { NICHES, VIBES } from '../constants/presets';
import type { ApiError } from '../services/api';
import type { ListGenerationsParams, PublicGeneration } from '../services/generations';
import { generationsApi } from '../services/generations';
import { colors } from '../theme/colors';

const PAGE_LIMIT = 12;
const HORIZONTAL_PADDING = 18;
const CARD_GAP = 8;
const screenWidth = Dimensions.get('window').width;
const cardWidth =
  (screenWidth - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

type WhenFilterKey = '24h' | '7d' | '30d';

const WHEN_OPTIONS: FilterSelectItem[] = [
  { key: '24h', value: 'Last 24 hours' },
  { key: '7d', value: 'Last 7 days' },
  { key: '30d', value: 'Last 30 days' },
];

const PLATFORM_OPTIONS: FilterSelectItem[] = PLATFORM_SPECS.map(spec => ({
  key: spec.id,
  value: `${spec.platform} · ${spec.label}`,
}));

const NICHE_OPTIONS: FilterSelectItem[] = NICHES.map(niche => ({
  key: niche.id,
  value: niche.label,
}));

const VIBE_OPTIONS: FilterSelectItem[] = VIBES.map(vibe => ({
  key: vibe.id,
  value: vibe.label,
}));

function getSinceTimestamp(whenKey: WhenFilterKey): string {
  const hoursByKey: Record<WhenFilterKey, number> = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30,
  };

  return new Date(
    Date.now() - hoursByKey[whenKey] * 60 * 60 * 1000,
  ).toISOString();
}

function buildQueryParams(
  platformKey: string,
  nicheKey: string,
  vibeKey: string,
  whenKey: string,
): ListGenerationsParams {
  return {
    limit: PAGE_LIMIT,
    ...(platformKey !== FILTER_ALL_KEY ? { platformId: platformKey } : {}),
    ...(nicheKey !== FILTER_ALL_KEY ? { nicheId: nicheKey } : {}),
    ...(vibeKey !== FILTER_ALL_KEY ? { vibeId: vibeKey } : {}),
    ...(whenKey !== FILTER_ALL_KEY
      ? { since: getSinceTimestamp(whenKey as WhenFilterKey) }
      : {}),
  };
}

function CreativesScreen() {
  const [items, setItems] = useState<PublicGeneration[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [platformKey, setPlatformKey] = useState(FILTER_ALL_KEY);
  const [nicheKey, setNicheKey] = useState(FILTER_ALL_KEY);
  const [vibeKey, setVibeKey] = useState(FILTER_ALL_KEY);
  const [whenKey, setWhenKey] = useState(FILTER_ALL_KEY);
  const [filterResetKey, setFilterResetKey] = useState(0);
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const getGenerationDeleteLabel = (generation: PublicGeneration) =>
    generation.headline?.trim() ||
    generation.brandTitle?.trim() ||
    'this creative';

  const handleFilterOpenChange = (filterId: string, open: boolean) => {
    setOpenFilterId(open ? filterId : null);
  };

  const hasActiveFilters =
    platformKey !== FILTER_ALL_KEY ||
    nicheKey !== FILTER_ALL_KEY ||
    vibeKey !== FILTER_ALL_KEY ||
    whenKey !== FILTER_ALL_KEY;

  const fetchGenerations = useCallback(
    async (
      nextPlatformKey: string,
      nextNicheKey: string,
      nextVibeKey: string,
      nextWhenKey: string,
    ) => {
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await generationsApi.list(
          buildQueryParams(
            nextPlatformKey,
            nextNicheKey,
            nextVibeKey,
            nextWhenKey,
          ),
        );
        setItems(response.items);
      } catch (error) {
        const apiError = error as ApiError;
        setErrorMessage(
          apiError?.message ||
            'Could not load your creatives. Please try again.',
        );
        setItems([]);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void fetchGenerations(platformKey, nicheKey, vibeKey, whenKey);
  }, [fetchGenerations, platformKey, nicheKey, vibeKey, whenKey]);

  const deleteGeneration = async (generation: PublicGeneration) => {
    setDeletingId(generation.id);

    try {
      await generationsApi.delete(generation.id);
      setItems(prev => prev.filter(item => item.id !== generation.id));
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        'Delete failed',
        apiError?.message ||
          'Could not delete this creative. Please try again.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeletePress = (generation: PublicGeneration) => {
    if (deletingId) {
      return;
    }

    const label = getGenerationDeleteLabel(generation);

    Alert.alert(
      'Delete creative?',
      `Are you sure you want to delete "${label}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void deleteGeneration(generation),
        },
      ],
    );
  };

  const clearAllFilters = () => {
    setPlatformKey(FILTER_ALL_KEY);
    setNicheKey(FILTER_ALL_KEY);
    setVibeKey(FILTER_ALL_KEY);
    setWhenKey(FILTER_ALL_KEY);
    setOpenFilterId(null);
    setFilterResetKey(prev => prev + 1);
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: PublicGeneration;
    index: number;
  }) => (
    <GenerationCard
      generation={item}
      isDeleting={deletingId === item.id}
      onDelete={() => handleDeletePress(item)}
      previewVariant={index % 2 === 0 ? 'bag' : 'bottle'}
      width={cardWidth}
    />
  );

  const listContent =
    errorMessage && !isLoading && items.length === 0 ? (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{errorMessage}</Text>
        <TouchableOpacity
          onPress={() =>
            void fetchGenerations(platformKey, nicheKey, vibeKey, whenKey)
          }
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    ) : !isLoading && items.length === 0 ? (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No creatives yet</Text>
        <Text style={styles.emptyText}>
          Adjust your filters or create something new.
        </Text>
      </View>
    ) : items.length > 0 ? (
      <FlatList
        columnWrapperStyle={styles.column}
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={item => item.id}
        numColumns={2}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
    ) : null;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screenBody}>
        <View
          style={[
            styles.topStack,
            openFilterId ? styles.topStackDropdownOpen : null,
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>WORKSPACE</Text>
            <Text style={styles.title}>Creatives.</Text>
            <Text style={styles.subtitle}>
              Everything you've made, ready to ship.
            </Text>
          </View>

          <ScrollView
            horizontal
            contentContainerStyle={[
              styles.filterRow,
              openFilterId ? styles.filterRowDropdownOpen : null,
            ]}
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={clearAllFilters}
              style={[
                styles.allPill,
                !hasActiveFilters && styles.allPillActive,
              ]}
            >
              <Text
                style={[
                  styles.allPillText,
                  !hasActiveFilters && styles.allPillTextActive,
                ]}
              >
                All · {items.length}
              </Text>
            </TouchableOpacity>

            <CreativesFilterSelect
              data={PLATFORM_OPTIONS}
              isOpen={openFilterId === 'platform'}
              label="Platform"
              maxWidth={screenWidth * 0.88}
              onChange={setPlatformKey}
              onOpenChange={open => handleFilterOpenChange('platform', open)}
              resetKey={filterResetKey}
              selectedKey={platformKey}
            />
            <CreativesFilterSelect
              data={NICHE_OPTIONS}
              isOpen={openFilterId === 'niche'}
              label="Niche"
              onChange={setNicheKey}
              onOpenChange={open => handleFilterOpenChange('niche', open)}
              resetKey={filterResetKey}
              selectedKey={nicheKey}
            />
            <CreativesFilterSelect
              data={VIBE_OPTIONS}
              isOpen={openFilterId === 'vibe'}
              label="Vibe"
              onChange={setVibeKey}
              onOpenChange={open => handleFilterOpenChange('vibe', open)}
              resetKey={filterResetKey}
              selectedKey={vibeKey}
            />
            <CreativesFilterSelect
              data={WHEN_OPTIONS}
              isOpen={openFilterId === 'when'}
              label="When"
              onChange={setWhenKey}
              onOpenChange={open => handleFilterOpenChange('when', open)}
              resetKey={filterResetKey}
              selectedKey={whenKey}
            />
          </ScrollView>
        </View>

        <View style={styles.contentLayer}>{listContent}</View>
      </View>

      <BlockingLoadingOverlay
        blur
        blurAmount={3}
        message={
          deletingId ? 'Deleting creative…' : 'Loading your creatives…'
        }
        visible={isLoading || deletingId !== null}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  allPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  allPillActive: {
    backgroundColor: colors.recentLight,
    borderColor: colors.recentLight,
  },
  allPillText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  allPillTextActive: {
    color: colors.text,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  column: {
    gap: CARD_GAP,
    justifyContent: 'space-between',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: 'Georgia',
    fontSize: 20,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.1,
  },
  contentLayer: {
    elevation: 0,
    flex: 1,
    zIndex: 0,
  },
  filterRow: {
    alignItems: 'flex-start',
    paddingBottom: 16,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingRight: HORIZONTAL_PADDING + 8,
  },
  filterRowDropdownOpen: {
    paddingBottom: 260,
  },
  filterScroll: {
    flexGrow: 0,
    overflow: 'visible',
    zIndex: 1000,
  },
  header: {
    paddingBottom: 14,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 32,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  screenBody: {
    flex: 1,
  },
  topStack: {
    backgroundColor: colors.background,
    elevation: 12,
    overflow: 'visible',
    position: 'relative',
    zIndex: 1000,
  },
  topStackDropdownOpen: {
    elevation: 24,
    zIndex: 10000,
  },
  retryButton: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  title: {
    color: colors.primary,
    fontFamily: 'Georgia',
    fontSize: 34,
    lineHeight: 38,
    marginTop: 4,
  },
});

export default CreativesScreen;
