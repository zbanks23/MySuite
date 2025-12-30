import React from 'react';
import { View, Text } from 'react-native';
import { useUITheme } from '@mysuite/ui';

interface ScreenHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  leftAction?: React.ReactNode;
  className?: string; // Allow additional styling if needed, though we aim for consistency
}

export function ScreenHeader({ title, rightAction, leftAction, className }: ScreenHeaderProps) {
  const theme = useUITheme();
  
  // We use the theme's bg color but with transparency for the "glass" header effect
  // Since theme.bg is 'hsl(H, S, L)', we can convert it to 'hsla(H, S, L, A)'
  const backgroundColor = theme.bg?.replace(')', ', 0.70)').replace('hsl', 'hsla');

  return (
    <View 
      className={`absolute top-0 left-0 right-0 py-4 pt-16 rounded-b-3xl ${className || ''}`}
      style={{ backgroundColor, zIndex: 50 }}
    >
      <View className="flex-row justify-center items-center relative min-h-[44px]">
        {leftAction && (
            <View className="absolute left-5 z-10 flex-row gap-2">
                {leftAction}
            </View>
        )}
        <Text className="text-2xl font-bold text-light dark:text-dark text-center flex-1 mx-16" numberOfLines={1}>{title}</Text>
        {rightAction && (
          <View className="absolute right-5">
              {rightAction}
          </View>
        )}
      </View>
    </View>
  );
}
