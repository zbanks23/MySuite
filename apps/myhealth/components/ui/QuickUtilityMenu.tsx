import React, { useMemo } from 'react';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useUITheme } from '@mycsuite/ui';
import { useRouter, usePathname } from 'expo-router';
import { RadialMenu, RadialMenuItem } from './RadialMenu';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';


const BUTTON_SIZE = 60; 

type ActionItemType = {
  id: string;
  icon: string;
  label: string;
  route?: string; 
  action?: string; 
};


const CONTEXT_ACTIONS: Record<string, ActionItemType[]> = {
  'home': [
    { id: 'add_widget', icon: 'plus', label: 'Add Widget', action: 'add_widget' },
    { id: 'quick_note', icon: 'pencil', label: 'Quick Note', action: 'quick_note' },
  ],

  'profile': [
    { id: 'edit_profile', icon: 'pencil', label: 'Edit', route: '/settings/account' },
    { id: 'settings', icon: 'gear', label: 'Settings', route: '/settings' },
  ],
};

export function QuickUtilityButton() {
  const theme = useUITheme();
  const router = useRouter();
  const pathname = usePathname();
  const { activeButtonId, setActiveButtonId, isHidden } = useFloatingButton();
  const { isRunning, startWorkout, pauseWorkout, resetWorkout, isExpanded, setExpanded } = useActiveWorkout();


  const currentActions = useMemo(() => {
     if (isExpanded || pathname.includes('active-workout')) {
         return [
            { id: 'end_workout', icon: 'flag.checkered', label: 'End', action: 'end_workout' },
            { id: 'reset_workout', icon: 'arrow.counterclockwise', label: 'Reset', action: 'reset_workout' },
            { 
                id: 'toggle_workout', 
                icon: isRunning ? 'pause.fill' : 'play.fill', 
                label: isRunning ? 'Pause' : 'Start', 
                action: 'toggle_workout' 
            },
         ];
     }
     if (pathname.includes('workout') || pathname === '/') {

         return [
            { id: 'routines', icon: 'list.bullet.clipboard', label: 'Routines', route: '/routines' },
            { id: 'saved_workouts', icon: 'folder', label: 'Workouts', route: '/saved-workouts' },
            { id: 'exercises', icon: 'dumbbell.fill', label: 'Exercises', route: '/exercises' },
         ];
     }
     if (pathname.includes('profile')) return CONTEXT_ACTIONS['profile'];
     return CONTEXT_ACTIONS['home'] || [];
  }, [pathname, isRunning, isExpanded]);

  const handleAction = React.useCallback((item: ActionItemType) => {
      if (item.action === 'toggle_workout') {
          if (isRunning) {
              pauseWorkout();
          } else {
              startWorkout();
              // Already on the screen, no need to push
          }
          return;
      }
      
      if (item.action === 'end_workout') {
          pauseWorkout();
          setExpanded(false);
          router.push('/end-workout' as any);
          return;
      }
      
      if (item.action === 'reset_workout') {
          resetWorkout();
          return; 
      }
      
      if (item.route) {
          router.push(item.route as any);
      } else {
          console.log('Trigger action:', item.action);
      }
  }, [router, isRunning, startWorkout, pauseWorkout, resetWorkout, setExpanded]);


  const menuItems: RadialMenuItem[] = useMemo(() => {
    return currentActions.map(action => ({
        id: action.id,
        icon: action.icon,
        label: action.label,
        onPress: () => handleAction(action)
    }));
  }, [currentActions, handleAction]);

  const containerAnimatedStyle = useAnimatedStyle(() => {

      const shouldHide = activeButtonId === 'nav' || isHidden;
      return {
          transform: [
              { translateX: withSpring(shouldHide ? 150 : 0) } 
          ],
          opacity: withTiming(shouldHide ? 0 : 1)
      };
  });

  const handleMenuStateChange = (isOpen: boolean) => {
      if (isOpen) {
          setActiveButtonId('action');
      } else if (activeButtonId === 'action') {
          setActiveButtonId(null);
      }
  };

  if (!currentActions || currentActions.length === 0) return null;

  return (
    <Animated.View 
        className="absolute bottom-10 right-10 items-center justify-center z-[1100] w-[60px] h-[60px] overflow-visible"
        style={[containerAnimatedStyle]} 
        pointerEvents="box-none"
    >
       <RadialMenu 
         items={menuItems} 
         icon="ellipsis" // Always ellipsis as requested
         menuRadius={120}
         startAngle={0}
         endAngle={-90}
         style={{ backgroundColor: theme.surface }}
         buttonSize={BUTTON_SIZE}
         onMenuStateChange={handleMenuStateChange}
       />
    </Animated.View>
  );
}
