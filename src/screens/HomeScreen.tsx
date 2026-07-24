import React, { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Asset,
  ImagePickerResponse,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ProductLibraryModal from '../components/ProductLibraryModal';
import RecentGenerationCard from '../components/RecentGenerationCard';
import type { ProductRecord } from '../services/products';
import type {
  RootStackParamList,
  UploadProductParams,
} from '../navigation/types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCredits, selectUser } from '../store/slices/authSlice';
import {
  fetchGenerations,
  HOME_RECENT_LIMIT,
  selectGenerationsItems,
  selectShowHomeRecentWork,
} from '../store/slices/generationsSlice';
import { colors } from '../theme/colors';
import { buildShootResultsParamsFromGeneration } from '../utils/generationDisplay';
import {
  ensureCameraPermission,
  ensurePhotoLibraryPermission,
} from '../utils/permissions';
import type { PublicGeneration } from '../services/generations';

type HomeNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UploadSource = UploadProductParams['source'];
const HORIZONTAL_PADDING = 18;
const CARD_GAP = 8;
const recentCardWidth =
  (Dimensions.get('window').width - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || 'BS';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function formatHomeDate(date = new Date()) {
  const weekday = date.toLocaleDateString('en-GB', {weekday: 'long'});
  const dayMonth = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return `${weekday}, ${dayMonth}`;
}

const cameraIcon = require('../assets/camera-svgrepo-com (2).png');
const fileIcon = require('../assets/gallery-send-svgrepo-com.png');
const libraryIcon = require('../assets/library-svgrepo-com.png');
const expandIcon = require('../assets/expand-svgrepo-com.png');

const uploadOptions = [
  {
    description: 'Browse files from your device',
    icon: fileIcon,
    id: 'file',
    title: 'Choose file',
  },
  {
    description: 'Pick a saved product photo',
    icon: libraryIcon,
    id: 'library',
    title: 'From library',
  },
  {
    description: 'Take a fresh product shot',
    icon: cameraIcon,
    id: 'camera',
    title: 'Camera',
  },
];

function HomeScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<HomeNavigationProp>();
  const user = useAppSelector(selectUser);
  const credits = useAppSelector(selectCredits);
  const recentGenerations = useAppSelector(selectGenerationsItems);
  const showRecentWork = useAppSelector(selectShowHomeRecentWork);
  const creditBalance = credits?.balance ?? 0;
  const initials = getInitials(user?.name, user?.email);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [isProductLibraryVisible, setProductLibraryVisible] = useState(false);
  const [isHandlingUpload, setHandlingUpload] = useState(false);
  const activeSourceRef = useRef<UploadSource>('library');

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchGenerations({ limit: HOME_RECENT_LIMIT }));
    }, [dispatch]),
  );

  const handleRecentGenerationPress = (generation: PublicGeneration) => {
    navigation.navigate(
      'ShootResults',
      buildShootResultsParamsFromGeneration(generation),
    );
  };

  const handleViewAllCreatives = () => {
    navigation.navigate('MainTabs', { screen: 'Creatives' });
  };

  const handleAvatarPress = () => {
    navigation.navigate('MainTabs', { screen: 'Settings' });
  };

  const handlePickerResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert(
        'Unable to continue',
        response.errorMessage || 'An unexpected error occurred while opening media.',
      );
      return;
    }

    const selectedAsset: Asset | undefined = response.assets?.[0];
    if (!selectedAsset?.uri) {
      Alert.alert(
        'No image selected',
        'Please choose a valid image and try again.',
      );
      return;
    }

    setPickerVisible(false);
    navigation.navigate('UploadProduct', {
      imageUri: selectedAsset.uri,
      fileName: selectedAsset.fileName ?? undefined,
      fileSize: selectedAsset.fileSize ?? undefined,
      mimeType: selectedAsset.type ?? undefined,
      width: selectedAsset.width ?? undefined,
      height: selectedAsset.height ?? undefined,
      source: activeSourceRef.current,
    });
  };

  const openCameraFlow = async () => {
    if (!(await ensureCameraPermission())) {
      return;
    }

    launchCamera(
      { mediaType: 'photo', quality: 1, saveToPhotos: false },
      handlePickerResponse,
    );
  };

  const openLibraryFlow = async () => {
    if (!(await ensurePhotoLibraryPermission())) {
      return;
    }

    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 1, quality: 1 },
      handlePickerResponse,
    );
  };

  const handleSavedProductSelect = (product: ProductRecord) => {
    navigation.navigate('UploadProduct', {
      source: 'saved',
      productId: product.id,
      imageUri: product.imageUrl,
    });
  };

  const handleUploadOptionPress = async (optionId: string) => {
    if (isHandlingUpload) {
      return;
    }

    if (optionId === 'library') {
      setPickerVisible(false);
      setProductLibraryVisible(true);
      return;
    }

    setHandlingUpload(true);
    try {
      if (optionId === 'camera') {
        activeSourceRef.current = 'camera';
        await openCameraFlow();
        return;
      }

      activeSourceRef.current = 'file';
      await openLibraryFlow();
    } finally {
      setHandlingUpload(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.creditPill}>
            <View style={styles.creditDot} />
            <Text style={styles.creditText}>{creditBalance} credits</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleAvatarPress}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initials}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.dateText}>{formatHomeDate()}</Text>

        <View style={styles.heroBlock}>
          <Text style={styles.heroTextDark}>Make something</Text>
          <Text style={styles.heroTextAccent}>brand-ready.</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setPickerVisible(true)}
          style={styles.ctaCard}
        >
          <View style={styles.ctaContent}>
            <View>
              <Text style={styles.ctaTitle}>Start a creative</Text>
              <Text style={styles.ctaSubtitle}>
                Camera - Library - Recent product
              </Text>
            </View>
          </View>

          <View pointerEvents="none" style={styles.cameraButton}>
            <Image
              resizeMode="contain"
              source={cameraIcon}
              style={styles.ctaIconImage}
            />
          </View>
        </TouchableOpacity>

        {showRecentWork ? (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent work</Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleViewAllCreatives}
                style={styles.sectionAction}
              >
                <Text style={styles.sectionActionText}>VIEW ALL</Text>
                <Image
                  resizeMode="contain"
                  source={expandIcon}
                  style={styles.sectionActionIcon}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.cardsGrid}>
              {recentGenerations.map((generation, index) => (
                <RecentGenerationCard
                  key={generation.id}
                  generation={generation}
                  onPress={() => handleRecentGenerationPress(generation)}
                  previewVariant={index % 2 === 0 ? 'bag' : 'bottle'}
                  width={recentCardWidth}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <Modal
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
        transparent
        visible={isPickerVisible}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            onPress={() => setPickerVisible(false)}
            style={styles.modalBackdrop}
          />

          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <Text style={styles.modalTitle}>Open creative</Text>
            <Text style={styles.modalSubtitle}>
              Choose how you want to add your product image.
            </Text>

            <View style={styles.optionList}>
              {uploadOptions.map(option => (
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={isHandlingUpload}
                  key={option.id}
                  onPress={() => handleUploadOptionPress(option.id)}
                  style={[
                    styles.optionCard,
                    isHandlingUpload && styles.optionCardDisabled,
                  ]}
                >
                  <View style={styles.optionIconWrap}>
                    <Image
                      resizeMode="contain"
                      source={option.icon}
                      style={styles.optionIcon}
                    />
                  </View>

                  <View style={styles.optionTextWrap}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>
                      {option.description}
                    </Text>
                  </View>

                  {/* <Feather
                    color={colors.textMuted}
                    name="chevron-right"
                    size={18}
                  /> */}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <ProductLibraryModal
        onClose={() => setProductLibraryVisible(false)}
        onSelectProduct={handleSavedProductSelect}
        visible={isProductLibraryVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.white,
    borderRadius: 18,
    borderWidth: 2,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  avatarText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  cameraButton: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    height: 48,
    justifyContent: 'center',
    shadowColor: colors.primarySoft,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    width: 48,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
    marginTop: 14,
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  creditDot: {
    backgroundColor: colors.primary,
    borderRadius: 4,
    height: 8,
    marginRight: 8,
    width: 8,
  },
  creditPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  creditText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  ctaCard: {
    alignItems: 'center',
    backgroundColor: colors.darkCard,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  ctaContent: {
    flex: 1,
    marginRight: 16,
  },
  ctaIconImage: {
    height: 22,
    tintColor: colors.white,
    width: 22,
  },
  ctaSubtitle: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    marginTop: 4,
  },
  ctaTitle: {
    color: colors.white,
    fontFamily: 'Georgia',
    fontSize: 18,
    lineHeight: 22,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 42,
  },
  heroBlock: {
    marginTop: 14,
  },
  heroTextAccent: {
    color: colors.primary,
    fontFamily: 'Georgia',
    fontSize: 33,
    fontStyle: 'italic',
    lineHeight: 38,
  },
  heroTextDark: {
    color: colors.text,
    fontFamily: 'Georgia',
    fontSize: 33,
    lineHeight: 38,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 10, 9, 0.48)',
  },
  modalHandle: {
    alignSelf: 'center',
    backgroundColor: 'rgba(35, 26, 22, 0.16)',
    borderRadius: 999,
    height: 5,
    marginBottom: 18,
    width: 52,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 30,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  modalSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: 'Georgia',
    fontSize: 22,
  },
  optionCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  optionCardDisabled: {
    opacity: 0.7,
  },
  optionDescription: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  optionIcon: {
    height: 24,
    width: 24,
  },
  optionIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  optionList: {
    marginTop: 16,
  },
  optionTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  optionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  sectionActionIcon: {
    height: 14,
    tintColor: colors.textSoft,
    width: 14,
  },
  sectionActionText: {
    color: colors.textSoft,
    fontSize: 12,
    letterSpacing: 0.7,
  },
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Georgia',
    fontSize: 16,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default HomeScreen;
