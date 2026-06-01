declare module 'react-native-dropdown-select-list' {
  import type { ComponentType } from 'react';
  import type { TextStyle, ViewStyle } from 'react-native';

  export type SelectListDataItem = {
    key?: string;
    value?: string;
    disabled?: boolean;
  };

  export type SelectListProps = {
    setSelected: (value: string) => void;
    data: SelectListDataItem[];
    placeholder?: string;
    boxStyles?: ViewStyle;
    inputStyles?: TextStyle;
    dropdownStyles?: ViewStyle;
    dropdownItemStyles?: ViewStyle;
    dropdownTextStyles?: TextStyle;
    maxHeight?: number;
    defaultOption?: { key: string; value: string };
    searchicon?: React.ReactElement;
    arrowicon?: React.ReactElement;
    closeicon?: React.ReactElement;
    search?: boolean;
    searchPlaceholder?: string;
    onSelect?: () => void;
    fontFamily?: string;
    notFoundText?: string;
    disabledItemStyles?: ViewStyle;
    disabledTextStyles?: TextStyle;
    save?: 'key' | 'value';
    dropdownShown?: boolean;
  };

  export const SelectList: ComponentType<SelectListProps>;
  export const MultipleSelectList: ComponentType<SelectListProps>;
}
