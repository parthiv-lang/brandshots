declare module '@react-native-vector-icons/feather/static' {
  import type { IconComponent } from '@react-native-vector-icons/common';
  import type glyphMap from '@react-native-vector-icons/feather/glyphmaps/Feather.json';

  const Feather: IconComponent<typeof glyphMap>;
  export default Feather;
  export { Feather };
}
