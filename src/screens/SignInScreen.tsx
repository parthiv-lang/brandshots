import React, { useCallback, useEffect } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SocialSignInButton from '../components/SocialSignInButton';
import { isAppleSignInAvailable } from '../services/auth/appleAuth';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  clearAuthError,
  loginWithAppleThunk,
  loginWithGoogleThunk,
  selectAuthError,
  selectPendingProvider,
} from '../store/slices/authSlice';
import { colors } from '../theme/colors';

function SignInScreen() {
  const dispatch = useAppDispatch();
  const error = useAppSelector(selectAuthError);
  const pendingProvider = useAppSelector(selectPendingProvider);
  const isBusy = pendingProvider !== null;
  const showAppleButton = isAppleSignInAvailable();

  useEffect(() => {
    if (error) {
      Alert.alert('Sign in failed', error, [
        { text: 'OK', onPress: () => dispatch(clearAuthError()) },
      ]);
    }
  }, [error, dispatch]);

  const handleGoogle = useCallback(() => {
    if (isBusy) {
      return;
    }
    dispatch(loginWithGoogleThunk());
  }, [dispatch, isBusy]);

  const handleApple = useCallback(() => {
    if (isBusy) {
      return;
    }
    dispatch(loginWithAppleThunk());
  }, [dispatch, isBusy]);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>WORKSPACE</Text>
          <Text style={styles.title}>Sign in.</Text>
          <Text style={styles.subtitle}>
            Access your account, plan, and credits.
          </Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroGlowLarge} />
          <View style={styles.heroGlowSmall} />
          <Text style={styles.cardEyebrow}>BRANDSHOTS</Text>
          <Text style={styles.cardTitle}>
            Create polished brand creatives in minutes.
          </Text>
          <Text style={styles.cardBody}>
            Sign in to keep your products, credits, and brand assets together in
            one place.
          </Text>
        </View>

        <View style={styles.actions}>
          <Text style={styles.sectionLabel}>CONTINUE WITH</Text>

          <SocialSignInButton
            iconSource={require('../assets/google-color-svgrepo-com.png')}
            title="Continue with Google"
            onPress={handleGoogle}
            loading={pendingProvider === 'google'}
            disabled={isBusy && pendingProvider !== 'google'}
          />

          {showAppleButton ? (
            <SocialSignInButton
              iconSource={require('../assets/apple-173-svgrepo-com.png')}
              title="Continue with Apple"
              onPress={handleApple}
              loading={pendingProvider === 'apple'}
              disabled={isBusy && pendingProvider !== 'apple'}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 10,
    marginTop: 32,
  },
  cardBody: {
    color: 'rgba(255, 255, 255, 0.84)',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: '84%',
  },
  cardEyebrow: {
    color: 'rgba(255, 255, 255, 0.70)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginBottom: 14,
  },
  cardTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    marginBottom: 12,
    maxWidth: '80%',
  },
  content: {
    flexGrow: 1,
    paddingBottom: 32,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.6,
    marginBottom: 6,
  },
  header: {
    marginTop: 8,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    marginTop: 28,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  heroGlowLarge: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 120,
    borderWidth: 1,
    height: 180,
    position: 'absolute',
    right: -10,
    top: 6,
    width: 180,
  },
  heroGlowSmall: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 72,
    borderWidth: 1,
    height: 128,
    position: 'absolute',
    right: 42,
    top: 44,
    width: 128,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: colors.primary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 44,
    fontStyle: 'italic',
    lineHeight: 50,
    marginBottom: 6,
  },
});

export default SignInScreen;
