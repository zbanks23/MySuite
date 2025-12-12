import { View, type ViewProps } from 'react-native';
import { useUITheme } from '@mycsuite/ui';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const theme = useUITheme();
  // If no specific colors provided, use background theme via standard style or className fallback
  const backgroundColor = lightColor ?? darkColor ?? theme.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
