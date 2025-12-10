import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type NavigationSettingsContextType = {
  isFabEnabled: boolean;
  toggleFab: (enabled: boolean) => Promise<void>;
  isLoading: boolean;
};

const NavigationSettingsContext = createContext<NavigationSettingsContextType | undefined>(undefined);

export const useNavigationSettings = () => {
  const context = useContext(NavigationSettingsContext);
  if (!context) {
    throw new Error('useNavigationSettings must be used within a NavigationSettingsProvider');
  }
  return context;
};

const KEY_IS_FAB_ENABLED = 'setting.navigation.isFabEnabled';

const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  return await SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export function NavigationSettingsProvider({ children }: { children: React.ReactNode }) {
  const [isFabEnabled, setIsFabEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const value = await getItem(KEY_IS_FAB_ENABLED);
        if (value !== null) {
          setIsFabEnabled(value === 'true');
        }
      } catch (error) {
        console.error('Failed to load navigation settings:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const toggleFab = async (enabled: boolean) => {
    try {
      setIsFabEnabled(enabled);
      await setItem(KEY_IS_FAB_ENABLED, String(enabled));
    } catch (error) {
      console.error('Failed to save navigation settings:', error);
    }
  };

  return (
    <NavigationSettingsContext.Provider value={{ isFabEnabled, toggleFab, isLoading }}>
      {children}
    </NavigationSettingsContext.Provider>
  );
}
