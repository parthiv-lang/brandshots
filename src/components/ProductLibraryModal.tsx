import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ProductCard from './ProductCard';
import { productsApi } from '../services/products';
import type { ProductRecord } from '../services/products';
import type { ApiError } from '../services/api';
import { colors } from '../theme/colors';

const PAGE_LIMIT = 24;

type ProductLibraryModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectProduct: (product: ProductRecord) => void;
};

function ProductLibraryModal({
  visible,
  onClose,
  onSelectProduct,
}: ProductLibraryModalProps) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<ProductRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

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
    if (!visible) {
      return;
    }

    setItems([]);
    setNextCursor(null);
    void fetchPage();
  }, [visible, fetchPage]);

  const handleLoadMore = () => {
    if (!nextCursor || isLoading || isLoadingMore) {
      return;
    }

    void fetchPage(nextCursor);
  };

  const handleSelect = (product: ProductRecord) => {
    onSelectProduct(product);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      statusBarTranslucent
      visible={visible}
    >
      <View
        style={[
          styles.safeArea,
          {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable hitSlop={12} onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Your products</Text>
          <View style={styles.closeButton} />
        </View>

        {isLoading && items.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : errorMessage && items.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => void fetchPage()} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={[
              styles.listContent,
              items.length === 0 ? styles.listContentEmpty : null,
            ]}
            data={items}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No saved products yet.</Text>
              </View>
            }
            ListFooterComponent={
              isLoadingMore ? (
                <ActivityIndicator
                  color={colors.primary}
                  style={styles.footerLoader}
                />
              ) : null
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.35}
            renderItem={({ item }) => (
              <ProductCard
                onPress={() => handleSelect(item)}
                product={item}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  closeButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  footerLoader: {
    marginVertical: 16,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: colors.text,
    fontFamily: 'Georgia',
    fontSize: 20,
  },
  listContent: {
    paddingBottom: 24,
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  listContentEmpty: {
    flexGrow: 1,
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
});

export default ProductLibraryModal;
