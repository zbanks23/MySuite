import { Text, Pressable } from 'react-native';
import type { PressableProps } from 'react-native';
import { cssInterop } from 'nativewind';
import { useUITheme } from './theme';

// Enable className support for React Native components
cssInterop(Pressable, { className: 'style' });
cssInterop(Text, { className: 'style' });

export const SharedButton = ({ title, className, style, ...props }: { title: string; className?: string } & PressableProps) => {
  const defaultClasses = 'p-4 my-4 rounded-lg active:opacity-80 items-center justify-center bg-primary dark:bg-primary_dark ios:shadow-sm';
  const combined = `${defaultClasses}${className ? ' ' + className : ''}`;

  return (
    <Pressable
      {...props}
      className={combined}
      style={[style] as any}>
      <Text className="text-center text-white font-bold">{title}</Text>
    </Pressable>
  );
};

export { UIThemeProvider, useUITheme } from './theme';
export { ThemedCard } from './examples/ThemedCard';