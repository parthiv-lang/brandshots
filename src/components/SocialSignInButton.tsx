import React from 'react';
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../theme/colors';

type SocialSignInButtonProps = {
  iconSource: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
};

function SocialSignInButton({
  iconSource,
  title,
  onPress,
  loading = false,
  disabled = false,
}: SocialSignInButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      <View style={styles.logoSlot}>
        {loading ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <Image source={iconSource} style={styles.icon} />
        )}
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    width: '94%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  copy: {
    justifyContent: 'center',
  },
  icon: {
    height: 22,
    resizeMode: 'contain',
    width: 22,
  },
  logoSlot: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    marginRight: 12,
    width: 34,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SocialSignInButton;
