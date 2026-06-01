import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Asset,
  ImagePickerResponse,
  launchImageLibrary,
} from 'react-native-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import BlockingLoadingOverlay from '../components/BlockingLoadingOverlay';
import ProductGridCard from '../components/ProductGridCard';
import type { ApiError } from '../services/api';
import type { ProductRecord } from '../services/products';
import { productsApi } from '../services/products';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { ensurePhotoLibraryPermission } from '../utils/permissions';

type ProductsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type GridRow =
  | { kind: 'add'; id: '__add__' }
  | { kind: 'product'; id: string; product: ProductRecord };

const PAGE_LIMIT = 24;
const HORIZONTAL_PADDING = 18;
const CARD_GAP = 8;
const screenWidth = Dimensions.get('window').width;
const cardWidth =
  (screenWidth - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;

function ProductsScreen() {
  const navigation = useNavigation<ProductsNavigationProp>();
  const [items, setItems] = useState<ProductRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const gridRows = useMemo<GridRow[]>(() => {
    const productRows: GridRow[] = items.map(product => ({
      kind: 'product',
      id: product.id,
      product,
    }));

    return [...productRows, { kind: 'add', id: '__add__' }];
  }, [items]);

  const fetchPage = useCallback(async (cursor?: string) => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    const isFirstPage = !cursor;

    if (isFirstPage) {
      setLoading(true);
      setErrorMessage(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const response = await productsApi.list({
        limit: PAGE_LIMIT,
        cursor,
      });

      setItems(prev =>
        isFirstPage ? response.items : [...prev, ...response.items],
      );
      setNextCursor(response.nextCursor);
    } catch (error) {
      const apiError = error as ApiError;
      setErrorMessage(
        apiError?.message || 'Could not load your products. Please try again.',
      );
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  const handleLoadMore = () => {
    if (!nextCursor || isLoading || isLoadingMore) {
      return;
    }

    void fetchPage(nextCursor);
  };

  const handlePickerResponse = async (response: ImagePickerResponse) => {
    if (response.didCancel) {
      return;
    }

    if (response.errorCode) {
      Alert.alert(
        'Unable to continue',
        response.errorMessage ||
          'An unexpected error occurred while opening your gallery.',
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

    setUploading(true);

    try {
      const product = await productsApi.uploadImage({
        imageUri: selectedAsset.uri,
        fileName: selectedAsset.fileName ?? undefined,
        mimeType: selectedAsset.type ?? undefined,
      });

      setItems(prev => {
        const withoutDuplicate = prev.filter(item => item.id !== product.id);
        return [product, ...withoutDuplicate];
      });
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        'Upload failed',
        apiError?.message ||
          'Could not upload this product image. Please try again.',
      );
    } finally {
      setUploading(false);
    }
  };

  const openGallery = async () => {
    if (isUploading) {
      return;
    }

    if (!(await ensurePhotoLibraryPermission())) {
      return;
    }

    launchImageLibrary(
      { mediaType: 'photo', selectionLimit: 1, quality: 1 },
      response => {
        void handlePickerResponse(response);
      },
    );
  };

  const handleProductPress = (product: ProductRecord) => {
    navigation.navigate('UploadProduct', {
      source: 'saved',
      productId: product.id,
      imageUri: product.imageUrl,
    });
  };

  const deleteProduct = async (product: ProductRecord) => {
    setDeletingId(product.id);

    try {
      await productsApi.delete(product.id);
      setItems(prev => prev.filter(item => item.id !== product.id));
    } catch (error) {
      const apiError = error as ApiError;
      Alert.alert(
        'Delete failed',
        apiError?.message ||
          'Could not delete this product. Please try again.',
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeletePress = (product: ProductRecord) => {
    const label = product.name?.trim() || 'this product';

    Alert.alert(
      'Delete product?',
      `Remove "${label}" from your library? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void deleteProduct(product),
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: GridRow }) => {
    if (item.kind === 'add') {
      return (
        <ProductGridCard
          onPress={() => void openGallery()}
          variant="add"
          width={cardWidth}
        />
      );
    }

    return (
      <ProductGridCard
        isDeleting={deletingId === item.product.id}
        onDelete={() => handleDeletePress(item.product)}
        onPress={() => handleProductPress(item.product)}
        product={item.product}
        variant="product"
        width={cardWidth}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>WORKSPACE</Text>
          <Text style={styles.title}>Products.</Text>
          <Text style={styles.subtitle}>
            Upload once. Reuse on every creative.
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isUploading}
          onPress={() => void openGallery()}
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
        >
          <Text style={styles.uploadButtonText}>↑ UPLOAD</Text>
        </TouchableOpacity>
      </View>

      {isLoading && items.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : errorMessage && items.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            onPress={() => void fetchPage()}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.listContent}
          data={gridRows}
          keyExtractor={item => item.id}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator
                color={colors.primary}
                style={styles.footerLoader}
              />
            ) : null
          }
          numColumns={2}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BlockingLoadingOverlay
        blur
        blurAmount={3}
        message="Uploading your product…"
        visible={isUploading}
      />
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
  column: {
    gap: CARD_GAP,
    justifyContent: 'space-between',
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
  footerLoader: {
    marginVertical: 20,
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
  listContent: {
    paddingBottom: 32,
    paddingHorizontal: HORIZONTAL_PADDING,
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
  uploadButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 40,
    minWidth: 96,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  uploadButtonDisabled: {
    opacity: 0.75,
  },
  uploadButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});

export default ProductsScreen;
