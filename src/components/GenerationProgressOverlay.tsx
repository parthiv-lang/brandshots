import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppIcon from './AppIcon';
import { colors } from '../theme/colors';

const starIcon = require('../assets/star-sharp-svgrepo-com.png');

const serifFont = Platform.select({ ios: 'Georgia', android: 'serif' });

const RING_SIZE = 128;
const RING_STROKE = 2.5;
const INNER_DISC_SIZE = 96;

type StepStatus = 'completed' | 'active' | 'pending';

export type GenerationProgressStep = {
  readonly id: string;
  readonly label: string;
};

export type GenerationProgressOverlayProps = {
  visible: boolean;
  quantity: number;
  qualityLabel: string;
  steps: readonly GenerationProgressStep[];
  /** When true, the final step completes (call after the API response). */
  generationComplete?: boolean;
  /** Milliseconds between advancing to the next step. */
  stepIntervalMs?: number;
  onMinimize?: () => void;
};

function quantityWord(count: number) {
  if (count === 1) {
    return 'One';
  }
  if (count === 2) {
    return 'Two';
  }
  if (count === 3) {
    return 'Three';
  }
  return String(count);
}

type CircularProgressRingProps = {
  progress: number;
  children: React.ReactNode;
};

function CircularProgressRing({ progress, children }: CircularProgressRingProps) {
  const half = RING_SIZE / 2;
  const clamped = Math.min(1, Math.max(0, progress));
  const firstHalfRotation = Math.min(clamped * 2, 1) * 180;
  const secondHalfRotation = Math.max(0, clamped * 2 - 1) * 180;

  return (
    <View style={styles.ringContainer}>
      <View style={styles.innerDisc}>{children}</View>

      <View pointerEvents="none" style={styles.ringOverlay}>
        <View style={styles.ringTrack} />

        <View style={styles.ringClipRight}>
          <View
            style={[
              styles.ringArc,
              {
                left: -half,
                borderColor: 'transparent',
                borderTopColor: colors.primary,
                borderRightColor: colors.primary,
                transform: [{ rotate: `${firstHalfRotation}deg` }],
              },
            ]}
          />
        </View>

        {clamped > 0.5 ? (
          <View style={styles.ringClipLeft}>
            <View
              style={[
                styles.ringArc,
                {
                  left: 0,
                  borderColor: 'transparent',
                  borderTopColor: colors.primary,
                  borderLeftColor: colors.primary,
                  transform: [{ rotate: `${secondHalfRotation}deg` }],
                },
              ]}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

type StepIconProps = {
  status: StepStatus;
};

function StepIcon({ status }: StepIconProps) {
  if (status === 'completed') {
    return (
      <View style={styles.stepIconCompleted}>
        <AppIcon color={colors.white} name="check" size={11} />
      </View>
    );
  }

  if (status === 'active') {
    return (
      <View style={styles.stepIconActive}>
        <View style={styles.stepIconActiveDot} />
      </View>
    );
  }

  return <View style={styles.stepIconPending} />;
}

type StepRowProps = {
  label: string;
  status: StepStatus;
  showDivider: boolean;
};

function StepRow({ label, status, showDivider }: StepRowProps) {
  return (
    <>
      <View style={styles.stepRow}>
        <StepIcon status={status} />
        <Text
          numberOfLines={2}
          style={[
            styles.stepLabel,
            status === 'pending' && styles.stepLabelPending,
            status === 'active' && styles.stepLabelActive,
          ]}
        >
          {label}
        </Text>
      </View>
      {showDivider ? <View style={styles.stepDivider} /> : null}
    </>
  );
}

function GenerationProgressOverlay({
  visible,
  quantity,
  qualityLabel,
  steps,
  generationComplete = false,
  stepIntervalMs = 5000,
  onMinimize,
}: GenerationProgressOverlayProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0.12)).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setActiveStepIndex(0);
    progressAnim.setValue(0.12);
  }, [progressAnim, visible]);

  const maxAutoStepIndex = Math.max(0, steps.length - 2);

  useEffect(() => {
    if (!visible || steps.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      if (generationComplete) {
        return;
      }

      setActiveStepIndex(prev => Math.min(prev + 1, maxAutoStepIndex));
    }, stepIntervalMs);

    return () => clearInterval(timer);
  }, [generationComplete, maxAutoStepIndex, stepIntervalMs, steps, visible]);

  useEffect(() => {
    if (!visible || !generationComplete || steps.length === 0) {
      return;
    }

    setActiveStepIndex(steps.length - 1);
  }, [generationComplete, steps, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const target = generationComplete
      ? 1
      : Math.min(
          0.92,
          0.12 + ((activeStepIndex + 1) / Math.max(steps.length, 1)) * 0.72,
        );

    Animated.timing(progressAnim, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
      toValue: target,
      useNativeDriver: false,
    }).start();
  }, [activeStepIndex, generationComplete, progressAnim, steps.length, visible]);

  const [ringProgress, setRingProgress] = useState(0.12);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const id = progressAnim.addListener(({ value }) => {
      setRingProgress(value);
    });

    return () => {
      progressAnim.removeListener(id);
    };
  }, [progressAnim, visible]);

  if (!visible) {
    return null;
  }

  const getStepStatus = (index: number): StepStatus => {
    if (generationComplete || index < activeStepIndex) {
      return 'completed';
    }
    if (index === activeStepIndex) {
      return 'active';
    }
    return 'pending';
  };

  return (
    <Modal
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent
      transparent={false}
      visible
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.root}>
        <View style={styles.minimizeRow}>
          {onMinimize ? (
            <Pressable hitSlop={12} onPress={onMinimize} style={styles.minimizeButton}>
              <Text style={styles.minimizeText}>MINIMIZE</Text>
            </Pressable>
          ) : (
            <View style={styles.minimizePlaceholder} />
          )}
        </View>

        <View style={styles.content}>
          <CircularProgressRing progress={ringProgress}>
            <Text style={styles.ringCount}>{quantity}</Text>
          </CircularProgressRing>

          <Text style={styles.heading}>
            Composing your{' '}
            <Text style={styles.headingAccent}>variants.</Text>
          </Text>

          <Text style={styles.subtext}>
            {quantityWord(quantity)} {qualityLabel} creatives. About 30 seconds.
            {'\n'}We&apos;ll buzz when they land.
          </Text>

          <View style={styles.stepsCard}>
            {steps.map((step, index) => (
              <StepRow
                key={step.id}
                label={step.label}
                showDivider={index < steps.length - 1}
                status={getStepStatus(index)}
              />
            ))}
          </View>
        </View>

        {/* <View style={styles.notificationCard}>
          <View style={styles.notificationIconWrap}>
            <Image resizeMode="contain" source={starIcon} style={styles.notificationIcon} />
          </View>
          <Text style={styles.notificationText}>
            Leave this screen — we&apos;ll send a{' '}
            <Text style={styles.notificationTextBold}>push notification</Text> the moment your
            creatives are ready.
          </Text>
        </View> */}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  heading: {
    color: colors.text,
    fontFamily: serifFont,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 34,
    marginTop: 28,
    textAlign: 'center',
  },
  headingAccent: {
    color: colors.primary,
    fontStyle: 'italic',
  },
  innerDisc: {
    alignItems: 'center',
    backgroundColor: '#F2D5C3',
    borderRadius: INNER_DISC_SIZE / 2,
    height: INNER_DISC_SIZE,
    justifyContent: 'center',
    width: INNER_DISC_SIZE,
    zIndex: 1,
  },
  minimizeButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  minimizePlaceholder: {
    height: 28,
  },
  minimizeRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 22,
    paddingTop: 4,
  },
  minimizeText: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
  },
  notificationCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
    marginHorizontal: 22,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  notificationIcon: {
    height: 16,
    tintColor: colors.primary,
    width: 16,
  },
  notificationIconWrap: {
    alignItems: 'center',
    backgroundColor: '#F2D5C3',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  notificationText: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  notificationTextBold: {
    color: colors.text,
    fontWeight: '700',
  },
  ringArc: {
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
    height: RING_SIZE,
    position: 'absolute',
    top: 0,
    width: RING_SIZE,
  },
  ringClipLeft: {
    height: RING_SIZE,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    width: RING_SIZE / 2,
  },
  ringClipRight: {
    height: RING_SIZE,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    width: RING_SIZE / 2,
  },
  ringContainer: {
    alignItems: 'center',
    height: RING_SIZE,
    justifyContent: 'center',
    width: RING_SIZE,
  },
  ringCount: {
    color: colors.primary,
    fontFamily: serifFont,
    fontSize: 40,
    fontStyle: 'italic',
    fontWeight: '400',
    lineHeight: 44,
  },
  ringOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  ringTrack: {
    borderColor: colors.border,
    borderRadius: RING_SIZE / 2,
    borderWidth: RING_STROKE,
    height: RING_SIZE,
    position: 'absolute',
    width: RING_SIZE,
  },
  root: {
    backgroundColor: colors.white,
    flex: 1,
  },
  stepDivider: {
    backgroundColor: colors.borderSoft,
    height: StyleSheet.hairlineWidth,
    marginLeft: 34,
  },
  stepIconActive: {
    alignItems: 'center',
    borderColor: colors.primary,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  stepIconActiveDot: {
    backgroundColor: colors.primary,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  stepIconCompleted: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  stepIconPending: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1.5,
    height: 20,
    width: 20,
  },
  stepLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    marginLeft: 12,
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: '600',
  },
  stepLabelPending: {
    color: colors.textSoft,
    fontWeight: '400',
  },
  stepRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 44,
    paddingVertical: 10,
  },
  stepsCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceMuted,
    borderRadius: 16,
    marginTop: 28,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  subtext: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default GenerationProgressOverlay;
