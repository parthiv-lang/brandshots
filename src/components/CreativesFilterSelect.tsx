import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { SelectList } from 'react-native-dropdown-select-list';

import { colors } from '../theme/colors';

import AppIcon from './AppIcon';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MIN_PILL_WIDTH = 96;
const MAX_PILL_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 320);
const PILL_HORIZONTAL_PADDING = 14 * 2 + 22;
const CHAR_WIDTH = 7.4;

function measurePillWidth(text: string, maxWidth = MAX_PILL_WIDTH): number {
  const measured = Math.ceil(text.length * CHAR_WIDTH) + PILL_HORIZONTAL_PADDING;
  return Math.min(Math.max(measured, MIN_PILL_WIDTH), maxWidth);
}

export const FILTER_ALL_KEY = 'all';

export type FilterSelectItem = {
  key: string;
  value: string;
};

type CreativesFilterSelectProps = {
  label: string;
  data: FilterSelectItem[];
  selectedKey: string;
  onChange: (key: string) => void;
  resetKey?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Allow wider pills for long labels (e.g. platform). */
  maxWidth?: number;
};

function CreativesFilterSelect({
  label,
  data,
  selectedKey,
  onChange,
  resetKey = 0,
  isOpen = false,
  onOpenChange,
  maxWidth = MAX_PILL_WIDTH,
}: CreativesFilterSelectProps) {
  const isActive = selectedKey !== FILTER_ALL_KEY;

  const listData = useMemo(
    () => [{ key: FILTER_ALL_KEY, value: 'All' }, ...data],
    [data],
  );

  const displayText = useMemo(() => {
    if (isActive) {
      const match = data.find(item => item.key === selectedKey);
      return match?.value ?? label;
    }

    return label;
  }, [data, isActive, label, selectedKey]);

  const defaultOption = useMemo(
    () => ({
      key: isActive ? selectedKey : FILTER_ALL_KEY,
      value: displayText,
    }),
    [displayText, isActive, selectedKey],
  );

  const pillWidth = useMemo(
    () => measurePillWidth(displayText, maxWidth),
    [displayText, maxWidth],
  );

  const dropdownWidth = useMemo(() => {
    const longestValue = listData.reduce(
      (longest, item) =>
        item.value.length > longest.length ? item.value : longest,
      displayText,
    );

    return Math.max(pillWidth, measurePillWidth(longestValue, maxWidth));
  }, [displayText, listData, maxWidth, pillWidth]);

  const boxStyle = useMemo(
    () => ({
      ...styles.box,
      width: pillWidth,
      ...(isActive ? styles.boxActive : styles.boxInactive),
    }),
    [isActive, pillWidth],
  );

  const dropdownStyle = useMemo(
    () => ({
      ...styles.dropdown,
      width: dropdownWidth,
    }),
    [dropdownWidth],
  );

  return (
    <View
      collapsable={false}
      onStartShouldSetResponder={() => {
        onOpenChange?.(true);
        return false;
      }}
      style={[
        styles.wrap,
        { width: pillWidth },
        isActive && styles.wrapActive,
        isOpen && styles.wrapOpen,
      ]}
    >
      <SelectList
        key={`${label}-${resetKey}`}
        onSelect={() => onOpenChange?.(false)}
        arrowicon={
          <AppIcon
            color={isActive ? colors.text : colors.textMuted}
            name="chevron-down"
            size={12}
            style={[
              styles.chevron,
              { transform: [{ rotate: isOpen ? '180deg' : '0deg' }] },
            ]}
          />
        }
        boxStyles={boxStyle}
        data={listData}
        defaultOption={defaultOption}
        dropdownItemStyles={styles.dropdownItem}
        dropdownStyles={dropdownStyle}
        dropdownTextStyles={styles.dropdownText}
        inputStyles={{
          ...styles.input,
          ...(isActive ? styles.inputActive : styles.inputInactive),
        }}
        maxHeight={240}
        save="key"
        search={false}
        setSelected={(key: string) => onChange(key)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    width: '100%',
  },
  boxActive: {
    backgroundColor: colors.recentLight,
    borderColor: colors.recentLight,
  },
  boxInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
  },
  chevron: {
    height: 12,
    width: 12,
  },
  dropdown: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 24,
    left: 0,
    marginTop: 6,
    position: 'absolute',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    top: '100%',
    zIndex: 10002,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
    padding: 0,
  },
  inputActive: {
    color: colors.text,
  },
  inputInactive: {
    color: colors.textMuted,
  },
  wrap: {
    alignSelf: 'flex-start',
    elevation: 1,
    marginRight: 8,
    position: 'relative',
    zIndex: 100,
  },
  wrapActive: {
    zIndex: 101,
  },
  wrapOpen: {
    elevation: 24,
    zIndex: 10001,
  },
});

export default CreativesFilterSelect;
