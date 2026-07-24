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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerStyle?: StyleProp<ViewStyle>;
  triggerless?: boolean;
  valueStyle?: StyleProp<TextStyle>;
  minWidth?: number;
  matchContainerWidth?: boolean;
};

function CompactSelectDropdown({
  value,
  options,
  onChange,
  direction = 'down',
  open: openProp,
  onOpenChange,
  triggerStyle,
  triggerless = false,
  valueStyle,
  minWidth = 44,
  matchContainerWidth = false,
}: CompactSelectDropdownProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined;
  const menuOpen = isControlled ? openProp : internalOpen;

  const selectedLabel = useMemo(
    () => options.find(option => option.value === value)?.label ?? value,
    [options, value],
  );

  useEffect(() => {
    if (!isControlled) {
      onOpenChange?.(menuOpen);
    }
  }, [isControlled, menuOpen, onOpenChange]);

  const setMenuOpen = (next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next);
      return;
    }
    setInternalOpen(next);
  };

  return (
    <View
      style={[
        styles.wrap,
        matchContainerWidth ? styles.wrapMatchContainer : { minWidth },
        menuOpen && styles.wrapOpen,
      ]}
    >
      {triggerless ? (
        <View style={[styles.trigger, triggerStyle]}>
          <Text style={[styles.valueText, valueStyle]}>{selectedLabel}</Text>
          <AppIcon
            color={colors.textMuted}
            name="chevron-down"
            size={12}
            style={[
              styles.chevron,
              direction === 'up' && styles.chevronUp,
              menuOpen && direction === 'down' && styles.chevronOpenDown,
              menuOpen && direction === 'up' && styles.chevronOpenUp,
            ]}
          />
        </View>
      ) : (
        <Pressable
          onPress={() => setMenuOpen(!menuOpen)}
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
              menuOpen && direction === 'down' && styles.chevronOpenDown,
              menuOpen && direction === 'up' && styles.chevronOpenUp,
            ]}
          />
        </Pressable>
      )}

      {menuOpen ? (
        <View
          style={[
            styles.menu,
            direction === 'up' ? styles.menuUp : styles.menuDown,
            matchContainerWidth ? styles.menuMatchContainer : { minWidth },
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
  menuMatchContainer: {
    width: '100%',
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
  wrapMatchContainer: {
    alignSelf: 'stretch',
    width: '100%',
  },
  wrapOpen: {
    elevation: 12,
    zIndex: 30,
  },
});

export default CompactSelectDropdown;
