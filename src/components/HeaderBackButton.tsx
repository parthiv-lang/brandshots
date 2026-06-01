import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import AppIcon from './AppIcon';
import { colors } from '../theme/colors';

type HeaderBackButtonProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  iconColor?: string;
  size?: number;
};

function HeaderBackButton({
  onPress,
  style,
  iconColor = colors.text,
  size = 26,
}: HeaderBackButtonProps) {
  return (
    <Pressable hitSlop={12} onPress={onPress} style={[styles.button, style]}>
      <AppIcon color={iconColor} name="chevron-left" size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HeaderBackButton;
