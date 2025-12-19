import React from 'react';
import { TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useUITheme } from '@mycsuite/ui';
import { useRouter, usePathname } from 'expo-router';
import { IconSymbol } from './icon-symbol';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import * as Haptics from 'expo-haptics';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';


export function QuickBackButton() {
  const theme = useUITheme();
  const router = useRouter();
  const { activeButtonId, isHidden } = useFloatingButton();
  
  // Import useActiveWorkout hook at the top
  const { isExpanded, setExpanded, startWorkout } = useActiveWorkout();
  
  const pathname = usePathname();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Special handling for End Workout screen
    if (pathname === '/end-workout') {
        startWorkout(); // Resumes and maximizes
        router.back();
        return;
    }
    
    if (isExpanded) {
        setExpanded(false);
        return;
    }

    // Use Router for back navigation
    if (router.canGoBack()) {
        router.back();
    } else {
        // Fallback: If we can't go back, go to Home
        router.replace('/');
    }
  };

  const containerAnimatedStyle = useAnimatedStyle(() => {
      // If ANY other menu is active OR global hidden state is true, slide out/hide
      const shouldHide = activeButtonId !== null || isHidden;
      return {
          transform: [
              { translateX: withSpring(shouldHide ? -150 : 0) } 
          ],
          opacity: withTiming(shouldHide ? 0 : 1)
      };
  });

  return (
    <Animated.View 
        className="absolute bottom-10 left-10 items-center justify-center z-[900]"
        style={[containerAnimatedStyle]} 
        pointerEvents="box-none"
    >
       <TouchableOpacity 
         className="w-[60px] h-[60px] rounded-full items-center justify-center shadow-lg bg-surface dark:bg-surface_dark"
         onPress={handlePress}
         activeOpacity={0.8}
       >
          <IconSymbol name="chevron.left" size={28} color={theme.text} />
       </TouchableOpacity>
    </Animated.View>
  );
}
