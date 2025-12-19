import React from 'react';
import { View, Text } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
  className?: string; // Allow additional styling if needed, though we aim for consistency
}

export function ScreenHeader({ title, rightAction, className }: ScreenHeaderProps) {
  return (
    <View className={`px-4 pt-4 mt-10 ${className || ''}`}>
      <View className="flex-row justify-between items-center">
        <Text className="text-3xl font-bold text-apptext dark:text-apptext_dark">{title}</Text>
        {rightAction && (
          <View>
              {rightAction}
          </View>
        )}
      </View>
      <View className="h-px bg-black/5 dark:bg-white/10 mt-2 -mx-4" />
    </View>
  );
}
