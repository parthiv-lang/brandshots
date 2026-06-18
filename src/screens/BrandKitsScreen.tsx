import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AddBrandKitCard from '../components/AddBrandKitCard';
import BrandKitCard from '../components/BrandKitCard';
import type { ApiError } from '../services/api';
import type { BrandKitRecord } from '../services/brands';
import { brandsApi } from '../services/brands';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';

const HORIZONTAL_PADDING = 18;

type BrandKitsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

function BrandKitsScreen() {
  const navigation = useNavigation<BrandKitsNavigationProp>();
  const [items, setItems] = useState<BrandKitRecord[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScrapeModalVisible, setScrapeModalVisible] = useState(false);
  const [isNewKitModalVisible, setNewKitModalVisible] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [isClearingDefault, setClearingDefault] = useState(false);
  const [defaultUpdatingId, setDefaultUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBrandKits = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await brandsApi.list();
      setItems(response.items);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(
        apiError?.message || 'Could not load your brand kits. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void fetchBrandKits();
    }, [fetchBrandKits]),
  );

  const handleNewKit = () => {
    setNewKitModalVisible(true);
  };

  const handleCreateManually = () => {
    setNewKitModalVisible(false);
    navigation.navigate('BrandDetails');
  };

  const handleCreateFromUrl = () => {
    setNewKitModalVisible(false);
    setScrapeError(null);
    setScrapeModalVisible(true);
  };

  const handleProceedScrape = async () => {
    const url = scrapeUrl.trim();
    if (!url) {
      return;
    }

    setScraping(true);
    setScrapeError(null);

    try {
      const scraped = await brandsApi.scrapeWebsite(url);
      setScrapeModalVisible(false);
      setScrapeUrl('');

      navigation.navigate('BrandDetails', {
        website: scraped.sourceUrl || url,
        title: scraped.title,
        description: scraped.description,
        colors: scraped.colors,
        logoDescription: scraped.logoDescription,
        logoUrl: scraped.logoDataUrl || scraped.faviconUrl || scraped.ogImageUrl,
        logoMime: scraped.logoMime,
      });
    } catch (error) {
      const apiError = error as ApiError;
      setScrapeError(
        apiError?.message || 'Could not scrape this website. Please try again.',
      );
    } finally {
      setScraping(false);
    }
  };

  const hasDefaultBrand = items.some(item => item.isDefault);
  const hasBrandKits = items.length > 0;

  const handleClearDefault = async () => {
    if (!hasDefaultBrand || isClearingDefault) {
      return;
    }

    setClearingDefault(true);
    try {
      await brandsApi.clearDefault();
      await fetchBrandKits();
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(
        apiError?.message || 'Could not clear default brand. Please try again.',
      );
    } finally {
      setClearingDefault(false);
    }
  };

  const handleToggleDefault = async (kit: BrandKitRecord) => {
    if (defaultUpdatingId) {
      return;
    }

    setDefaultUpdatingId(kit.id);
    try {
      await brandsApi.setDefault(kit.id, !kit.isDefault);
      await fetchBrandKits();
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(
        apiError?.message || 'Could not update default brand. Please try again.',
      );
    } finally {
      setDefaultUpdatingId(null);
    }
  };

  const handleDeleteBrand = (kit: BrandKitRecord) => {
    if (deletingId) {
      return;
    }

    const label = kit.title.trim() || 'this brand';
    Alert.alert(
      'Delete brand?',
      `Remove "${label}" from your brand kits? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void confirmDeleteBrand(kit.id),
        },
      ],
    );
  };

  const confirmDeleteBrand = async (id: string) => {
    setDeletingId(id);
    try {
      await brandsApi.delete(id);
      await fetchBrandKits();
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(
        apiError?.message || 'Could not delete this brand. Please try again.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>WORKSPACE</Text>
          <Text style={styles.title}>Brand kits.</Text>
          <Text style={styles.subtitle}>
            One stays default. Auto-applied to new creatives.
          </Text>
        </View>

        {hasBrandKits ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNewKit}
            style={styles.newButton}
          >
            <Text style={styles.newButtonText}>+ NEW</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.newButtonPlaceholder} />
        )}
      </View>
      {hasDefaultBrand ? (
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isClearingDefault}
          onPress={() => void handleClearDefault()}
          style={[
            styles.clearDefaultButton,
            isClearingDefault && styles.clearDefaultButtonDisabled,
          ]}
        >
          <Text style={styles.clearDefaultButtonText}>
            {isClearingDefault ? 'Clearing...' : 'Clear default'}
          </Text>
        </TouchableOpacity>
      ) : null}

      {isLoading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : errorMessage && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity onPress={() => void fetchBrandKits()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : !hasBrandKits ? (
        <View style={styles.emptyState}>
          <AddBrandKitCard
            onCreateFromUrl={handleCreateFromUrl}
            onCreateManually={handleCreateManually}
            variant="first"
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map(kit => (
            <BrandKitCard
              key={kit.id}
              kit={kit}
              onDelete={deletingId ? undefined : () => handleDeleteBrand(kit)}
              onPress={() =>
                navigation.navigate('BrandDetails', {
                  brandId: kit.id,
                  title: kit.title,
                  description: kit.description,
                  website: kit.website,
                  colors: kit.colors,
                  logoDescription: kit.logoDescription,
                  logoUrl: kit.logoUrl ?? undefined,
                  logoMime: kit.logoMime ?? undefined,
                  isDefault: kit.isDefault,
                })
              }
              onToggleDefault={
                defaultUpdatingId || deletingId
                  ? undefined
                  : () => void handleToggleDefault(kit)
              }
            />
          ))}
        </ScrollView>
      )}

      <Modal
        animationType="fade"
        onRequestClose={() => setNewKitModalVisible(false)}
        transparent
        visible={isNewKitModalVisible}
      >
        <View style={styles.choiceBackdrop}>
          <View style={styles.choiceCard}>
            <Text style={styles.choiceTitle}>New brand kit</Text>
            <Text style={styles.choiceSubtitle}>
              Import from a website or set one up yourself.
            </Text>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleCreateFromUrl}
              style={styles.choicePrimaryButton}
            >
              <Text style={styles.choicePrimaryText}>Create from URL</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreateManually}
              style={styles.choiceSecondaryButton}
            >
              <Text style={styles.choiceSecondaryText}>Create manually</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setNewKitModalVisible(false)}
              style={styles.choiceCancelButton}
            >
              <Text style={styles.choiceCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setScrapeModalVisible(false)}
        transparent
        visible={isScrapeModalVisible}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.scrapeBackdrop}
        >
          <View style={styles.scrapeCard}>
            <Text style={styles.scrapeTitle}>Create from URL</Text>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isScraping}
              keyboardType="url"
              onChangeText={setScrapeUrl}
              placeholder="https://nike.com"
              placeholderTextColor={colors.textSoft}
              style={styles.scrapeInput}
              value={scrapeUrl}
            />
            <View style={styles.scrapeActions}>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isScraping}
                onPress={() => {
                  setScrapeModalVisible(false);
                  setScrapeError(null);
                }}
                style={styles.scrapeCancelButton}
              >
                <Text style={styles.scrapeCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={isScraping || scrapeUrl.trim().length === 0}
                onPress={() => void handleProceedScrape()}
                style={[
                  styles.scrapeProceedButton,
                  (isScraping || scrapeUrl.trim().length === 0) &&
                    styles.scrapeProceedButtonDisabled,
                ]}
              >
                <Text style={styles.scrapeProceedText}>
                  {isScraping ? 'Processing...' : 'Proceed'}
                </Text>
              </TouchableOpacity>
            </View>
            {scrapeError ? (
              <Text style={styles.scrapeErrorText}>{scrapeError}</Text>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  choiceBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(25, 18, 14, 0.45)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  choiceCancelButton: {
    alignItems: 'center',
    marginTop: 10,
    minHeight: 40,
    justifyContent: 'center',
  },
  choiceCancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  choiceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 420,
    padding: 16,
    width: '100%',
  },
  choicePrimaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    marginTop: 16,
    minHeight: 46,
  },
  choicePrimaryText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  choiceSecondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: 10,
    minHeight: 46,
  },
  choiceSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  choiceSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  choiceTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 32,
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
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
  },
  headerCopy: {
    flex: 1,
    marginRight: 12,
  },
  newButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 40,
    minWidth: 84,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  newButtonPlaceholder: {
    marginTop: 18,
    minWidth: 84,
  },
  clearDefaultButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 10,
    marginHorizontal: HORIZONTAL_PADDING,
    minHeight: 36,
    paddingHorizontal: 12,
  },
  clearDefaultButtonDisabled: {
    opacity: 0.65,
  },
  clearDefaultButtonText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
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
  scrapeActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  scrapeBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(25, 18, 14, 0.45)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  scrapeCancelButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  scrapeCancelText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  scrapeCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 420,
    padding: 16,
    width: '100%',
  },
  scrapeInput: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scrapeProceedButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  scrapeProceedButtonDisabled: {
    opacity: 0.6,
  },
  scrapeProceedText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  scrapeErrorText: {
    color: '#B33A2C',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 10,
  },
  scrapeTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: HORIZONTAL_PADDING,
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

export default BrandKitsScreen;
