import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';

const STEPS = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Create' },
  { id: 3, label: 'Results' },
] as const;

type ProductFlowStepperProps = {
  activeStep: number;
};

function ProductFlowStepper({ activeStep }: ProductFlowStepperProps) {
  return (
    <View style={styles.stepper}>
      {STEPS.map((step, index) => {
        const isActive = step.id === activeStep;
        const isCompleted = step.id < activeStep;

        return (
          <React.Fragment key={step.id}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  isActive && styles.stepCircleActive,
                  isCompleted && styles.stepCircleCompleted,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    (isActive || isCompleted) && styles.stepNumberActive,
                  ]}
                >
                  {step.id}
                </Text>
              </View>
              <Text
                style={[styles.stepLabel, isActive && styles.stepLabelActive]}
              >
                {step.label}
              </Text>
            </View>

            {index < STEPS.length - 1 ? (
              <View style={styles.stepDivider} />
            ) : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  stepCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginHorizontal: 6,
    width: 18,
  },
  stepItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: '700',
  },
  stepNumber: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  stepNumberActive: {
    color: colors.white,
  },
  stepper: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
});

export default ProductFlowStepper;
