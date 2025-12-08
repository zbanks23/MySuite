import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '../../components/ui/HapticTab';
import { FastNavigationButton } from '../../components/ui/FastNavigationButton';
import { useNavigationSettings } from '../providers/NavigationSettingsProvider';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';
import { FastActionButton } from '../../components/ui/FastActionButton';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isFabEnabled } = useNavigationSettings();

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
          headerShown: false,
          tabBarButton: isFabEnabled ? () => null : HapticTab,
          tabBarStyle: isFabEnabled ? { display: 'none' } : undefined,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name='workout'
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="dumbbell.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
          }}
        />
      </Tabs>
      {isFabEnabled && <FastNavigationButton />}
      {isFabEnabled && <FastActionButton />}
    </>
  );
}
