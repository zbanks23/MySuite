import React from 'react';
import { View } from 'react-native';
import { useThemePreference } from '../../providers/AppThemeProvider';
import { SharedButton } from '@mycsuite/ui';

export const ThemeToggle = () => {
  const { preference, setPreference } = useThemePreference();

  return (
    <View className="flex-row items-center my-3">
      <SharedButton
        title="Light"
        onPress={() => setPreference('light')}
        className={`px-3 py-2 my-0 mr-2 rounded-md ${preference === 'light' ? 'bg-primary/90 dark:bg-primary-dark/90' : 'bg-background dark:bg-surface'}`}
      />

      <SharedButton
        title="Dark"
        onPress={() => setPreference('dark')}
        className={`px-3 py-2 my-0 mr-2 rounded-md ${preference === 'dark' ? 'bg-primary/90 dark:bg-primary-dark/90' : 'bg-background dark:bg-surface'}`}
      />

      <SharedButton
        title="System"
        onPress={() => setPreference('system')}
        className={`px-3 py-2 my-0 rounded-md ${preference === 'system' ? 'bg-primary/90 dark:bg-primary-dark/90' : 'bg-background dark:bg-surface'}`}
      />
    </View>
  );
};

export default ThemeToggle;
