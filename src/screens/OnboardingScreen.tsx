import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppIcon from '../components/AppIcon';
import type { RootStackParamList } from '../navigation/types';
import { setOnboardingCompleted } from '../services/storage/onboardingStorage';
import { colors } from '../theme/colors';

const PRIVACY_URL = 'https://www.brandshots.app/privacy';
const TERMS_URL = 'https://www.brandshots.app/terms';
const SLIDE_INTERVAL_MS = 3800;

const SHOWCASE_SLIDES = [
  {
    source: require('../assets/source.png'),
    after: require('../assets/after.png'),
    tag: 'Studio polish',
    caption: 'One quick upload. A ready-to-post creative in minutes.',
  },
  {
    source: require('../assets/source (1).png'),
    after: require('../assets/after (1).png'),
    tag: 'Brand-ready',
    caption: 'Keep your product recognizable while elevating the scene.',
  },
  {
    source: require('../assets/source (2).png'),
    after: require('../assets/after (2).png'),
    tag: 'Ad-ready',
    caption: 'From shelf photo to scroll-stopping campaign visual.',
  },
] as const;

const FEATURE_PILLS = ['Upload once', 'Pick a style', 'Ship creatives'] as const;

const TRUST_POINTS = [
  'We only use your photos to generate your creatives.',
  'You stay in control of your account and data.',
  'No spam — just the tools you need to create.',
] as const;

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

function CheckboxRow({
  checked,
  label,
  linkLabel,
  onToggle,
  onLinkPress,
}: {
  checked: boolean;
  label: string;
  linkLabel: string;
  onToggle: () => void;
  onLinkPress: () => void;
}) {
  return (
    <View style={styles.checkboxRow}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        hitSlop={8}
        onPress={onToggle}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? (
            <AppIcon color={colors.white} name="check" size={14} />
          ) : null}
        </View>
      </Pressable>
      <Text style={styles.checkboxText}>
        {label}{' '}
        <Text onPress={onLinkPress} style={styles.checkboxLink}>
          {linkLabel}
        </Text>
      </Text>
    </View>
  );
}

function ShowcaseSlide({
  fadeAnim,
  slide,
}: {
  fadeAnim: Animated.Value;
  slide: (typeof SHOWCASE_SLIDES)[number];
}) {
  return (
    <Animated.View style={[styles.slideFrame, { opacity: fadeAnim }]}>
      <View style={styles.imagePair}>
        <View style={styles.imageColumn}>
          <Text style={styles.imageLabel}>Your photo</Text>
          <View style={styles.imageCard}>
            <Image resizeMode="cover" source={slide.source} style={styles.image} />
          </View>
        </View>
        <View style={styles.imageArrow}>
          <View style={styles.arrowBadge}>
            <AppIcon color={colors.primary} name="zap" size={16} />
          </View>
        </View>
        <View style={styles.imageColumn}>
          <Text style={[styles.imageLabel, styles.imageLabelAfter]}>
            Brandshot
          </Text>
          <View style={[styles.imageCard, styles.imageCardAfter]}>
            <Image resizeMode="cover" source={slide.after} style={styles.image} />
          </View>
        </View>
      </View>

      <View style={styles.slideCaptionBlock}>
        <View style={styles.slideTag}>
          <Text style={styles.slideTagText}>{slide.tag}</Text>
        </View>
        <Text style={styles.slideCaption}>{slide.caption}</Text>
      </View>
    </Animated.View>
  );
}

function BottomActionBar({
  bottomInset,
  caption,
  buttonLabel,
  disabled,
  onPress,
}: {
  bottomInset: number;
  caption: string;
  buttonLabel: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <View style={[styles.bottomBar, { paddingBottom: Math.max(bottomInset, 16) }]}>
      <Text style={styles.bottomCaption}>{caption}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.primaryButton,
          disabled && styles.primaryButtonDisabled,
          pressed && !disabled && styles.primaryButtonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
        {!disabled ? (
          <AppIcon color={colors.white} name="arrow-right" size={18} />
        ) : null}
      </Pressable>
    </View>
  );
}

function OnboardingScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<0 | 1>(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (step !== 0) {
      return;
    }

    const intervalId = setInterval(() => {
      Animated.timing(fadeAnim, {
        duration: 220,
        toValue: 0,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          return;
        }

        setSlideIndex(current => (current + 1) % SHOWCASE_SLIDES.length);
        Animated.timing(fadeAnim, {
          duration: 320,
          toValue: 1,
          useNativeDriver: true,
        }).start();
      });
    }, SLIDE_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [fadeAnim, step]);

  const handleContinue = useCallback(() => {
    setStep(1);
  }, []);

  const handleAccept = useCallback(async () => {
    if (!acceptedTerms || !acceptedPrivacy || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await setOnboardingCompleted();
      navigation.replace('SignIn');
    } catch {
      Alert.alert(
        'Something went wrong',
        'We could not save your preference. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [acceptedPrivacy, acceptedTerms, isSubmitting, navigation]);

  const canAccept = acceptedTerms && acceptedPrivacy && !isSubmitting;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.screen}>
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progressRow}>
            <View
              style={[styles.progressDot, step === 0 && styles.progressDotActive]}
            />
            <View
              style={[styles.progressDot, step === 1 && styles.progressDotActive]}
            />
          </View>

          {step === 0 ? (
            <>
              <View style={styles.header}>
                <Text style={styles.eyebrow}>WELCOME TO BRANDSHOTS</Text>
                <Text style={styles.title}>
                  Your product deserves a better first impression.
                </Text>
                <Text style={styles.subtitle}>
                  See how a simple photo becomes a polished brand creative — no
                  studio, no designer, no waiting.
                </Text>
              </View>

              <View style={styles.pillRow}>
                {FEATURE_PILLS.map(pill => (
                  <View key={pill} style={styles.pill}>
                    <Text style={styles.pillText}>{pill}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.showcaseCard}>
                <View style={styles.showcaseGlow} />
                <ShowcaseSlide
                  fadeAnim={fadeAnim}
                  slide={SHOWCASE_SLIDES[slideIndex]}
                />
                <View style={styles.dotsRow}>
                  {SHOWCASE_SLIDES.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        index === slideIndex && styles.dotActive,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <Text style={styles.helperNote}>
                Real examples from Brandshots — refreshed automatically so you can
                see what&apos;s possible.
              </Text>
            </>
          ) : (
            <>
              {step === 1 ? (
                <Pressable
                  accessibilityRole="button"
                  hitSlop={10}
                  onPress={() => {
                    setStep(0);
                  }}
                  style={styles.backLink}
                >
                  <AppIcon color={colors.textMuted} name="arrow-left" size={16} />
                  <Text style={styles.backLinkText}>Back</Text>
                </Pressable>
              ) : null}

              <View style={styles.header}>
                <View style={styles.trustIconWrap}>
                  <AppIcon color={colors.primary} name="shield" size={22} />
                </View>
                <Text style={styles.eyebrow}>ONE LAST STEP</Text>
                <Text style={styles.title}>Let&apos;s get you set up.</Text>
                <Text style={styles.subtitle}>
                  Accept the essentials below so we can create your workspace and
                  keep your account secure.
                </Text>
              </View>

              <View style={styles.trustCard}>
                {TRUST_POINTS.map(point => (
                  <View key={point} style={styles.trustRow}>
                    <View style={styles.trustBullet}>
                      <AppIcon color={colors.primary} name="check" size={12} />
                    </View>
                    <Text style={styles.trustText}>{point}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.agreementCard}>
                <Text style={styles.agreementHeading}>Your agreement</Text>
                <CheckboxRow
                  checked={acceptedTerms}
                  label="I have read and agree to the"
                  linkLabel="Terms of Service"
                  onLinkPress={() => {
                    void openExternalUrl(TERMS_URL);
                  }}
                  onToggle={() => {
                    setAcceptedTerms(current => !current);
                  }}
                />
                <View style={styles.agreementDivider} />
                <CheckboxRow
                  checked={acceptedPrivacy}
                  label="I have read and agree to the"
                  linkLabel="Privacy Policy"
                  onLinkPress={() => {
                    void openExternalUrl(PRIVACY_URL);
                  }}
                  onToggle={() => {
                    setAcceptedPrivacy(current => !current);
                  }}
                />
              </View>
            </>
          )}
        </ScrollView>

        {step === 0 ? (
          <BottomActionBar
            bottomInset={insets.bottom}
            buttonLabel="Continue"
            caption="Free to explore — sign in when you're ready to create."
            onPress={handleContinue}
          />
        ) : (
          <BottomActionBar
            bottomInset={insets.bottom}
            buttonLabel={isSubmitting ? 'Setting up...' : 'Accept & get started'}
            caption={
              canAccept
                ? 'You’re all set. We’ll take you to sign in next.'
                : 'Please accept both items above to continue.'
            }
            disabled={!canAccept}
            onPress={() => {
              void handleAccept();
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  agreementCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 20,
    overflow: 'hidden',
    paddingBottom: 8,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  agreementDivider: {
    backgroundColor: colors.borderSoft,
    height: 1,
  },
  agreementHeading: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  arrowBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  backLink: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
    marginTop: 4,
  },
  backLinkText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.borderSoft,
    borderTopWidth: 1,
    gap: 10,
    paddingHorizontal: 22,
    paddingTop: 14,
  },
  bottomCaption: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  checkbox: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    marginTop: 2,
    width: 24,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLink: {
    color: colors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  checkboxRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
  },
  checkboxText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 22,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.6,
    marginBottom: 6,
  },
  header: {
    marginTop: 4,
  },
  helperNote: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 16,
    textAlign: 'center',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageArrow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 22,
  },
  imageCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 156,
    overflow: 'hidden',
  },
  imageCardAfter: {
    borderColor: colors.primarySoft,
    shadowColor: colors.primary,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  imageColumn: {
    flex: 1,
    gap: 8,
  },
  imageLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  imageLabelAfter: {
    color: colors.primary,
  },
  imagePair: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 18,
  },
  pillText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 16,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  progressDot: {
    backgroundColor: colors.border,
    borderRadius: 4,
    height: 6,
    width: 28,
  },
  progressDotActive: {
    backgroundColor: colors.primary,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  showcaseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 28,
    borderWidth: 1,
    marginTop: 20,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  showcaseGlow: {
    backgroundColor: colors.primarySoft,
    borderRadius: 999,
    height: 120,
    opacity: 0.12,
    position: 'absolute',
    right: -30,
    top: -20,
    width: 120,
  },
  slideCaption: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  slideCaptionBlock: {
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 4,
  },
  slideFrame: {
    minHeight: 250,
  },
  slideTag: {
    alignSelf: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  slideTagText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: colors.primary,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif' }),
    fontSize: 34,
    fontStyle: 'italic',
    lineHeight: 40,
    marginBottom: 8,
  },
  trustBullet: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 22,
    justifyContent: 'center',
    marginTop: 1,
    width: 22,
  },
  trustCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    gap: 12,
    marginTop: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  trustIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    marginBottom: 14,
    width: 48,
  },
  trustRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
  },
  trustText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default OnboardingScreen;
