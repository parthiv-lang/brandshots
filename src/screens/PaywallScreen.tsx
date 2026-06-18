import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { SafeAreaView } from 'react-native-safe-area-context';

import { env } from '../config/env';
import type { RootStackParamList } from '../navigation/types';
import {
  configureRevenueCat,
  getPurchaseErrorMessage,
} from '../services/purchases/revenueCat';
import { colors } from '../theme/colors';

function PaywallScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const offeringId = env.REVENUECAT_OFFERING.trim();
  const [error, setError] = useState<string | null>(null);

  const finish = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [navigation]);

  useEffect(() => {
    const apiKey = env.REVENUECAT_API_KEY;
    if (!apiKey || apiKey === 'YOUR_REVENUECAT_API_KEY') {
      setError('Subscriptions are not configured.');
      return;
    }

    if (!offeringId) {
      setError('REVENUECAT_OFFERING is not set in env');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        configureRevenueCat();
        const offerings = await Purchases.getOfferings();
        if (cancelled) {
          return;
        }

        const offering =
          offerings.all[offeringId] ??
          offerings.current ??
          Object.values(offerings.all)[0];

        if (!offering) {
          setError('No subscription offers are available yet.');
          return;
        }

        const result = await RevenueCatUI.presentPaywall({
          offering,
          displayCloseButton: true,
        });

        if (cancelled) {
          return;
        }

        if (result === PAYWALL_RESULT.ERROR) {
          setError('Could not open subscriptions.');
          return;
        }

        finish();
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }

        const message = getPurchaseErrorMessage(err);
        if (message) {
          setError(message);
        } else {
          finish();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [offeringId, finish]);

  if (error) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={finish} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading offers…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeBtnText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default PaywallScreen;
