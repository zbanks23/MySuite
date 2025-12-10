import { Tabs } from 'expo-router';
import React from 'react';
import { BottomTabBar } from '@react-navigation/bottom-tabs';

import { HapticTab } from '../../components/ui/HapticTab';
import { useNavigationSettings } from '../../providers/NavigationSettingsProvider';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { Colors } from '../../constants/theme';
import { useColorScheme } from '../../hooks/use-color-scheme';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isFabEnabled } = useNavigationSettings();

  return (
    <Tabs
        backBehavior="history"
        tabBar={(props) => {
            if (isFabEnabled) {
                // If FAB is enabled, we hide the standard tab bar.
                // The FABs are now rendered in the Root Layout.
                return null;
            }
            return <BottomTabBar {...props} />;
        }}
        screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].primary,
            headerShown: false,
            tabBarButton: HapticTab, // Always use HapticTab when BottomTabBar is rendered
            // We don't need to hide tabBarStyle manually anymore since we replace the bar entirely when enabled
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
  );
}
