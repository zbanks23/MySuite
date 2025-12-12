import { Text, type TextProps } from 'react-native';
import { useUITheme } from '@mycsuite/ui';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const theme = useUITheme();
  const color = lightColor ?? darkColor ?? theme.text;

  // Map types to tailwind classes
  let typeClasses = '';
  switch (type) {
    case 'default':
      typeClasses = 'text-base leading-6';
      break;
    case 'defaultSemiBold':
      typeClasses = 'text-base leading-6 font-semibold';
      break;
    case 'title':
      typeClasses = 'text-3xl font-bold leading-8'; // 32px ~ text-3xl
      break;
    case 'subtitle':
      typeClasses = 'text-xl font-bold';
      break;
    case 'link':
      typeClasses = 'text-base leading-[30px] text-[#0a7ea4]';
      break;
  }

  return (
    <Text
      style={[{ color }, style]} // Keep color as inline style if dynamic, or could use tailwind if fixed colors
      className={typeClasses}
      {...rest}
    />
  );
}
