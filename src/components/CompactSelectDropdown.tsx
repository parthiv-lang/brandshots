import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import AppIcon from './AppIcon';
import { colors } from '../theme/colors';

export type CompactSelectOption = {
  value: string;
  label: string;
};

type CompactSelectDropdownProps = {
  value: string;
  options: CompactSelectOption[];
  onChange: (value: string) => void;
  direction?: 'up' | 'down';
  onOpenChange?: (open: boolean) => void;
  triggerStyle?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
  minWidth?: number;
};

function CompactSelectDropdown({
  value,
  options,
  onChange,
  direction = 'down',
  onOpenChange,
  triggerStyle,
  valueStyle,
  minWidth = 44,
}: CompactSelectDropdownProps) {
  const [open, setOpen] = useState(false);

  const selectedLabel = useMemo(
    () => options.find(option => option.value === value)?.label ?? value,
    [options, value],
  );

  useEffect(() => {
    onOpenChange?.(open);
  }, [onOpenChange, open]);

  const setMenuOpen = (next: boolean) => {
    setOpen(next);
  };

  return (
    <View
      style={[
        styles.wrap,
        { minWidth },
        open && styles.wrapOpen,
      ]}
    >
      <Pressable
        onPress={() => setMenuOpen(!open)}
        style={[styles.trigger, triggerStyle]}
      >
        <Text style={[styles.valueText, valueStyle]}>{selectedLabel}</Text>
        <AppIcon
          color={colors.textMuted}
          name="chevron-down"
          size={12}
          style={[
            styles.chevron,
            direction === 'up' && styles.chevronUp,
            open && direction === 'down' && styles.chevronOpenDown,
            open && direction === 'up' && styles.chevronOpenUp,
          ]}
        />
      </Pressable>

      {open ? (
        <View
          style={[
            styles.menu,
            direction === 'up' ? styles.menuUp : styles.menuDown,
            { minWidth },
          ]}
        >
          {options.map(option => {
            const isActive = option.value === value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  onChange(option.value);
                  setMenuOpen(false);
                }}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    isActive && styles.menuItemTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chevron: {},
  chevronOpenDown: {
    transform: [{ rotate: '180deg' }],
  },
  chevronOpenUp: {
    transform: [{ rotate: '0deg' }],
  },
  chevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  menu: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 12,
    borderWidth: 1,
    elevation: 12,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: colors.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    zIndex: 20,
  },
  menuDown: {
    left: 0,
    marginTop: 6,
    top: '100%',
  },
  menuItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  menuItemActive: {
    backgroundColor: '#F6E8DE',
  },
  menuItemText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  menuItemTextActive: {
    color: colors.primaryDark,
  },
  menuUp: {
    bottom: '100%',
    left: 0,
    marginBottom: 6,
  },
  trigger: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  valueText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  wrap: {
    position: 'relative',
    zIndex: 1,
  },
  wrapOpen: {
    elevation: 12,
    zIndex: 30,
  },
});

export default CompactSelectDropdown;
