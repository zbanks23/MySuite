import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useUITheme } from '@mycsuite/ui';
import { useRouter, usePathname } from 'expo-router';
import { RadialMenu, RadialMenuItem } from './RadialMenu';

// Configuration
const BUTTON_SIZE = 60;

// Configuration for matching paths to icons
const PATH_CONFIG = [
    { match: ['/profile', '/(tabs)/profile'], icon: 'person.fill' },
    { match: ['/', '/index', '/(tabs)', '/(tabs)/index'], icon: 'house.fill' },
    { match: ['/workout', '/(tabs)/workout'], icon: 'dumbbell.fill' },
];

export function FastNavigationButton() {
  const theme = useUITheme();
  const router = useRouter();
  const pathname = usePathname();

  // Determine active icon based on current path
  const activeIcon = useMemo(() => {
     const found = PATH_CONFIG.find(c => c.match.some(m => pathname === m || pathname.startsWith(m + '/')));
     return found ? found.icon : 'house.fill';
  }, [pathname]);

  const navigateTo = React.useCallback((route: string) => {
      router.push(route as any);
  }, [router]);

  // Define menu items with explicit angles
  const menuItems: RadialMenuItem[] = useMemo(() => [
    { id: 'profile', icon: 'person.fill', label: 'Profile', onPress: () => navigateTo('/(tabs)/profile'), angle: -45 },
    { id: 'home', icon: 'house.fill', label: 'Home', onPress: () => navigateTo('/(tabs)'), angle: 0 },
    { id: 'workout', icon: 'dumbbell.fill', label: 'Workout', onPress: () => navigateTo('/(tabs)/workout'), angle: 45 },
  ], [navigateTo]);

  return (
    <View style={styles.container} pointerEvents="box-none">
       <RadialMenu 
         items={menuItems} 
         icon={activeIcon} 
         menuRadius={100}
         style={{ backgroundColor: theme.primary }} 
         buttonSize={BUTTON_SIZE}
       />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150, // Height for hit testing?
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
    zIndex: 1000,
    pointerEvents: 'box-none',
    overflow: 'visible',
  },
});
