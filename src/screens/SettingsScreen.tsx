import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  deleteAccountThunk,
  logoutThunk,
  refreshMeThunk,
  selectCredits,
  selectUser,
} from '../store/slices/authSlice';
import type { RootStackParamList } from '../navigation/types';
import { openPaywall } from '../utils/openPaywall';
import { colors } from '../theme/colors';
import AppIcon from '../components/AppIcon';

const HORIZONTAL_PADDING = 18;
const PRIVACY_URL = 'https://www.brandshots.app/privacy';
const TERMS_URL = 'https://www.brandshots.app/terms';
const CONTACT_EMAIL = 'info@baruzotech.com';

const profileIcon = require('../assets/profile-1341-svgrepo-com.png');
const creditsIcon = require('../assets/electricity-svgrepo-com.png');
const signOutSectionIcon = require('../assets/sign-out-svgrepo-com.png');
const upgradeIcon = require('../assets/upgrade-svgrepo-com.png');

function getInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || 'BS';
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function SettingsIcon({
  source,
  size = 14,
  tintColor = colors.primary,
}: {
  source: ImageSourcePropType;
  size?: number;
  tintColor?: string;
}) {
  return (
    <Image
      resizeMode="contain"
      source={source}
      style={[
        styles.sectionIcon,
        {
          height: size,
          tintColor,
          width: size,
        },
      ]}
    />
  );
}

async function openExternalUrl(url: string) {
  try {
    const canOpen = await Linking.canOpenURL(url);

    if (!canOpen) {
      Alert.alert('Unable to Open', 'This link could not be opened on your device.');
      return;
    }

    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to Open', 'Something went wrong. Please try again.');
  }
}

function SettingsLinkRow({
  label,
  onPress,
  showDivider = true,
}: {
  label: string;
  onPress: () => void;
  showDivider?: boolean;
}) {
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={styles.linkRow}
      >
        <Text style={styles.linkRowLabel}>{label}</Text>
        <AppIcon color={colors.textSoft} name="chevron-right" size={18} />
      </TouchableOpacity>
      {showDivider ? <View style={styles.linkDivider} /> : null}
    </>
  );
}

function SettingsScreen() {
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppSelector(selectUser);
  const credits = useAppSelector(selectCredits);
  const [isRefreshing, setRefreshing] = useState(false);
  const [isSigningOut, setSigningOut] = useState(false);
  const [isDeletingAccount, setDeletingAccount] = useState(false);

  const creditBalance = credits?.balance ?? 0;
  const displayName = user?.name?.trim() || 'Your account';
  const displayEmail = user?.email?.trim() || '';
  const avatarUrl = user?.avatarUrl;
  const initials = getInitials(user?.name, user?.email);

  const loadProfile = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(refreshMeThunk()).unwrap();
    } catch {
      // Keep cached Redux values when refresh fails.
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setSigningOut(true);
    try {
      await dispatch(logoutThunk()).unwrap();
    } finally {
      setSigningOut(false);
    }
  };

  const showSignOutAlert = () => {
    if (isSigningOut || isDeletingAccount) {
      return;
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            void handleSignOut();
          },
        },
      ],
    );
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) {
      return;
    }

    setDeletingAccount(true);
    try {
      await dispatch(deleteAccountThunk()).unwrap();
    } catch (error) {
      Alert.alert(
        'Deletion Failed',
        typeof error === 'string'
          ? error
          : 'Account deletion failed. Please try again.',
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const showDeleteAccountAlert = () => {
    if (isSigningOut || isDeletingAccount) {
      return;
    }

    Alert.alert(
      'Delete Account',
      'This permanently deletes your account and all your data. This cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDeleteAccount();
          },
        },
      ],
    );
  };

  const handleUpgrade = () => {
    openPaywall(navigation);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        bounces={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>WORKSPACE</Text>
          <Text style={styles.title}>Settings.</Text>
          <Text style={styles.subtitle}>Account, plan, credits.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionLabelRow}>
              <SettingsIcon source={profileIcon} />
              <Text style={styles.sectionLabel}>PROFILE</Text>
            </View>
            {/* <Text style={styles.sectionHint}>via Google</Text> */}
          </View>

          <TouchableOpacity activeOpacity={0.85} style={styles.profileCard}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.profileText}>
              <Text numberOfLines={1} style={styles.profileName}>
                {displayName}
              </Text>
              {displayEmail ? (
                <Text numberOfLines={1} style={styles.profileEmail}>
                  {displayEmail}
                </Text>
              ) : null}
            </View>
            {/* <Icon color={colors.textSoft} name="chevron-right" size={18} /> */}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionLabelRow}>
              <SettingsIcon source={creditsIcon} />
              <Text style={styles.sectionLabel}>PLAN & CREDITS</Text>
            </View>
          </View>

          <View style={styles.creditsCard}>
            <View style={styles.creditsGlowLarge} />
            <View style={styles.creditsGlowSmall} />

            <View style={styles.creditsTopRow}>
              <View>
                <Text style={styles.creditsEyebrow}>CREDITS</Text>
                {isRefreshing ? (
                  <ActivityIndicator
                    color={colors.white}
                    size="small"
                    style={styles.creditsLoader}
                  />
                ) : (
                  <Text style={styles.creditsValue}>{creditBalance}</Text>
                )}
              </View>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleUpgrade}
                style={styles.upgradeButton}
              >
                <Image
                  resizeMode="contain"
                  source={upgradeIcon}
                  style={styles.upgradeIcon}
                />
                <Text style={styles.upgradeText}>UPGRADE</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.creditsBody}>
              You&apos;re on the Free plan. New accounts start with 5 credits.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionLabelRow}>
              <AppIcon color={colors.primary} name="file-text" size={14} />
              <Text style={styles.sectionLabel}>LEGAL</Text>
            </View>
          </View>

          <View style={styles.legalCard}>
            <SettingsLinkRow
              label="Privacy Policy"
              onPress={() => {
                void openExternalUrl(PRIVACY_URL);
              }}
            />
            <SettingsLinkRow
              label="Terms of Service"
              onPress={() => {
                void openExternalUrl(TERMS_URL);
              }}
            />
            <SettingsLinkRow
              label="Contact"
              onPress={() => {
                void openExternalUrl(`mailto:${CONTACT_EMAIL}`);
              }}
              showDivider={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionLabelRow}>
              <SettingsIcon source={signOutSectionIcon} />
              <Text style={styles.sectionLabel}>ACCOUNT</Text>
            </View>
          </View>

          <View style={styles.signOutCard}>
            <View style={styles.signOutText}>
              <Text style={styles.signOutTitle}>Sign out</Text>
              <Text style={styles.signOutSubtitle}>
                Creatives & products stay saved
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              disabled={isSigningOut || isDeletingAccount}
              onPress={showSignOutAlert}
              style={[
                styles.signOutButton,
                (isSigningOut || isDeletingAccount) && styles.signOutButtonDisabled,
              ]}
            >
              {isSigningOut ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.signOutButtonText}>SIGN OUT</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.deleteAccountCard}>
            <View style={styles.signOutText}>
              <Text style={styles.deleteAccountTitle}>Delete account</Text>
              <Text style={styles.deleteAccountSubtitle}>
                Permanently removes your account and all data
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              disabled={isSigningOut || isDeletingAccount}
              onPress={showDeleteAccountAlert}
              style={[
                styles.deleteAccountButton,
                (isSigningOut || isDeletingAccount) &&
                  styles.deleteAccountButtonDisabled,
              ]}
            >
              {isDeletingAccount ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.deleteAccountButtonText}>DELETE</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 24,
    height: 48,
    width: 48,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarInitials: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: 8,
  },
  creditsBody: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 18,
    maxWidth: '88%',
  },
  creditsCard: {
    backgroundColor: colors.primary,
    borderRadius: 22,
    overflow: 'hidden',
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  creditsEyebrow: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  creditsGlowLarge: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 90,
    borderWidth: 1,
    height: 150,
    position: 'absolute',
    right: -18,
    top: 8,
    width: 150,
  },
  creditsGlowSmall: {
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 64,
    borderWidth: 1,
    height: 108,
    position: 'absolute',
    right: 28,
    top: 36,
    width: 108,
  },
  creditsLoader: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  creditsTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  creditsValue: {
    color: colors.white,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 52,
    fontWeight: '400',
    lineHeight: 56,
  },
  deleteAccountButton: {
    alignItems: 'center',
    backgroundColor: '#B42318',
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deleteAccountButtonDisabled: {
    opacity: 0.7,
  },
  deleteAccountButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  deleteAccountCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  deleteAccountSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  deleteAccountTitle: {
    color: '#B42318',
    fontSize: 16,
    fontWeight: '700',
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.4,
    marginBottom: 4,
  },
  header: {
    marginBottom: 22,
  },
  legalCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    overflow: 'hidden',
    paddingHorizontal: 14,
  },
  linkDivider: {
    backgroundColor: colors.border,
    height: StyleSheet.hairlineWidth,
  },
  linkRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
    paddingVertical: 14,
  },
  linkRowLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  profileEmail: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  profileName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  profileText: {
    flex: 1,
    minWidth: 0,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  sectionIcon: {
    alignSelf: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHint: {
    color: colors.textSoft,
    fontSize: 12,
  },
  sectionLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  sectionLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  signOutButton: {
    alignItems: 'center',
    backgroundColor: colors.apple,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 104,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  signOutButtonDisabled: {
    opacity: 0.7,
  },
  signOutButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  signOutCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  signOutSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  signOutText: {
    flex: 1,
    minWidth: 0,
  },
  signOutTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  title: {
    color: colors.primary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 40,
    fontStyle: 'italic',
    lineHeight: 46,
  },
  upgradeButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  upgradeIcon: {
    height: 16,
    width: 16,
  },
  upgradeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});

export default SettingsScreen;
