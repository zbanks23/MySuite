import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useUITheme, RaisedButton } from '@mysuite/ui';
import Animated from 'react-native-reanimated';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { formatSeconds } from '../../utils/formatting';
import { IconSymbol } from '../ui/icon-symbol';
import { useRouter } from 'expo-router';

export function ActiveWorkoutHeader() {
    const theme = useUITheme();
    const router = useRouter();

    const { isRunning, workoutSeconds, workoutName, isExpanded, toggleExpanded, hasActiveSession, pauseWorkout } = useActiveWorkout();
    

    const hasActiveWorkout = hasActiveSession;
    
    
    if (!hasActiveWorkout) {
        return null;
    }


    const title = workoutName || "Current Workout";
    const rightIcon = isExpanded ? "chevron.down" : "chevron.up";
    
    const handlePress = () => {
         toggleExpanded();
    };

    const handleEnd = (e: any) => {
        // Stop propagation to prevent toggling expansion
        e?.stopPropagation();
        
        // Pause and navigate to end screen
        pauseWorkout();
        router.push('/workouts/end');
    };

    return (
        <Animated.View 
            style={{ 
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 6,
                zIndex: 1001,
                top: 0, // Reset, using marginTop in className
            }}
            className="absolute left-0 right-0 pt-16 pb-3 px-4 bg-light dark:bg-dark-lighter rounded-b-3xl"
        >
            <TouchableOpacity 
                className="flex-row items-center justify-between"
                onPress={handlePress}
                activeOpacity={0.8}
            >
                 {/* Left: Timer + Status */}
                 <View className="flex-row items-center gap-2 w-1/4">
                     <View className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-400'}`} />
                     <Text className="text-sm font-semibold tabular-nums text-light dark:text-dark">{formatSeconds(workoutSeconds)}</Text>
                 </View>
                 
                 {/* Center: Title */}
                 <View className="flex-1 items-center justify-center">
                     <Text className="text-sm font-semibold text-light dark:text-dark text-center" numberOfLines={1}>{title}</Text>
                 </View>
                 
                 {/* Right: End Button + Chevron */}
                 <View className="flex-row items-center justify-end w-1/4 gap-3">
                     <RaisedButton 
                        onPress={handleEnd}
                        className="h-8 px-3 py-0 bg-danger dark:bg-danger"
                        variant="custom"
                        borderRadius={16}
                        showGradient={false}
                     >
                         <Text className="text-white text-xs font-bold">End</Text>
                     </RaisedButton>
                     <IconSymbol name={rightIcon} size={16} color={theme.icon ?? '#000'} />
                 </View>
            </TouchableOpacity>
        </Animated.View>
    );
}
