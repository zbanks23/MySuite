import React from 'react';
import { Platform, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';

export function GlobalOverlay({ children }: { children: React.ReactNode }) {
  if (Platform.OS === 'ios') {
    return (
      <FullWindowOverlay>
        <View className="absolute inset-0 bg-transparent" pointerEvents="box-none">
          {children}
        </View>
      </FullWindowOverlay>
    );
  }

  // On Android/Web, simple Z-indexing usually works as they don't use the same 
  // strict Native UIWindow hierarchy for modals effectively "leaving" the app view.
  // We wrap in a View to ensure consistent styling behavior if needed, 
  // but essentially we just return children as they are already absolutely positioned.
  // Actually, let's wrap them in a fragment or simple view to match the "Overlay" concept
  // but 'pointerEvents="box-none"' is crucial if we wrap them.
  return (
    <View className="absolute inset-0 bg-transparent" pointerEvents="box-none">
        {children}
    </View>
  );
}
