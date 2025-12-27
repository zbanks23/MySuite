import React from 'react';
import { View } from 'react-native';
import { useThemePreference } from '../../providers/AppThemeProvider';
import { RaisedButton } from '@mysuite/ui';

export const ThemeToggle = () => {
  const { preference, setPreference } = useThemePreference();

  return (
    <View className="flex-row items-center my-3">
      <RaisedButton
        title="Light"
        onPress={() => setPreference('light')}
        className={`px-3 py-2 my-0 mr-2 rounded-md ${preference === 'light' ? 'bg-primary' : 'border border-primary dark:border-primary-dark'}`}
        textClassName={preference === 'light' ? 'text-white' : 'text-light dark:text-dark'}
      />

      <RaisedButton
        title="Dark"
        onPress={() => setPreference('dark')}
        className={`px-3 py-2 my-0 mr-2 rounded-md ${preference === 'dark' ? 'dark:bg-primary-dark' : 'border border-primary dark:border-primary-dark'}`}
        textClassName={preference === 'dark' ? 'text-white' : 'text-light dark:text-dark'}
      />


    </View>
  );
};

export default ThemeToggle;
