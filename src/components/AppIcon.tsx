import React from 'react';
import Feather from '@react-native-vector-icons/feather/static';

export type AppIconName = React.ComponentProps<typeof Feather>['name'];

export type AppIconProps = React.ComponentProps<typeof Feather>;

/** Feather icons (static font — required for bare React Native without Expo). */
function AppIcon({ name, size = 20, ...rest }: AppIconProps) {
  return <Feather name={name} size={size} {...rest} />;
}

export default AppIcon;
