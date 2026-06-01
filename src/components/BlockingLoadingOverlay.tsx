import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';

import { colors } from '../theme/colors';

export type BlockingLoadingStatusStep = {
  readonly text: string;
  readonly icon: string;
};

export type BlockingLoadingOverlayProps = {
  visible: boolean;
  message?: string | null;
  /**
   * When true, applies a light blur on top of the underlying screen.
   * When false, falls back to a faint dim layer. Defaults to true.
   */
  blur?: boolean;
  /**
   * Blur strength (only used when `blur` is true). Lower values keep the
   * screen behind more visible. Defaults to 3.
   */
  blurAmount?: number;
  /** Optional cycling status steps; advances every `statusStepIntervalMs` until the last step. */
  statusSteps?: readonly BlockingLoadingStatusStep[];
  statusStepIntervalMs?: number;
};

function BlockingLoadingOverlay({
  visible,
  message,
  blur = true,
  blurAmount = 3,
  statusSteps,
  statusStepIntervalMs = 7000,
}: BlockingLoadingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }
    setStepIndex(0);
  }, [visible]);

  useEffect(() => {
    if (!visible || !statusSteps?.length) {
      return;
    }
    const id = setInterval(() => {
      setStepIndex(prev => Math.min(prev + 1, statusSteps.length - 1));
    }, statusStepIntervalMs);

    return () => clearInterval(id);
  }, [visible, statusSteps, statusStepIntervalMs]);

  useEffect(() => {
    if (!visible || !statusSteps?.length) {
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      bounce.setValue(0);
    };
  }, [visible, statusSteps, bounce]);

  if (!visible) {
    return null;
  }

  const hasSteps = Boolean(statusSteps?.length);
  const currentStep = hasSteps && statusSteps ? statusSteps[stepIndex] : null;
  const iconTranslateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent
      transparent
      visible
    >
      <View
        accessibilityViewIsModal
        importantForAccessibility="yes"
        pointerEvents="auto"
        style={styles.root}
      >
        {blur ? (
          <BlurView
            blurAmount={blurAmount}
            blurType="light"
            reducedTransparencyFallbackColor={colors.background}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.dimLight]} />
        )}

        <View pointerEvents="none" style={styles.center}>
          {hasSteps && currentStep ? (
            <>
              <Animated.Text
                accessibilityLabel={currentStep.text}
                style={[
                  styles.stepIcon,
                  { transform: [{ translateY: iconTranslateY }] },
                ]}
              >
                {currentStep.icon}
              </Animated.Text>
              <Text numberOfLines={4} style={styles.message}>
                {currentStep.text}
              </Text>
              <ActivityIndicator
                color={colors.primary}
                size="small"
                style={styles.stepSpinner}
              />
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.primary} size="large" />
              {message ? (
                <Text numberOfLines={4} style={styles.message}>
                  {message}
                </Text>
              ) : null}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  dimLight: {
    backgroundColor: 'rgba(28, 27, 27, 0.06)',
  },
  message: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  root: {
    flex: 1,
  },
  stepIcon: {
    fontSize: 52,
    lineHeight: 58,
    textAlign: 'center',
  },
  stepSpinner: {
    marginTop: 18,
  },
});

export default BlockingLoadingOverlay;
