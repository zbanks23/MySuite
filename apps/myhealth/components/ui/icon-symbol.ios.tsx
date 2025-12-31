import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';
import { hslToHex } from '../../utils/colors';
import { cssInterop } from 'nativewind';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
  className,
}: {
  name: SymbolViewProps['name'];
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
  className?: string;
}) {
  const safeColor = (typeof color === 'string' && color.startsWith('hsl')) ? hslToHex(color) : color;

  return (
    <SymbolView
      weight={weight}
      tintColor={safeColor}
      resizeMode="scaleAspectFit"
      name={name}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
      className={className}
    />
  );
}

cssInterop(IconSymbol, { className: { target: 'style', nativeStyleToProp: { color: true } } });

