import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useUITheme } from '@mysuite/ui';
import Animated from 'react-native-reanimated';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { formatSeconds } from '../../utils/formatting';
import { IconSymbol } from '../ui/icon-symbol';

export function ActiveWorkoutHeader() {
    const theme = useUITheme();
    

    const { isRunning, workoutSeconds, workoutName, isExpanded, toggleExpanded, hasActiveSession } = useActiveWorkout();
    

    const hasActiveWorkout = hasActiveSession;
    
    
    if (!hasActiveWorkout) {
        return null;
    }


    const title = workoutName || "Current Workout";
    const rightIcon = isExpanded ? "chevron.down" : "chevron.up";
    
    const handlePress = () => {
         toggleExpanded();
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
            className="absolute left-0 right-0 pt-16 pb-6 px-4 bg-light dark:bg-dark-lighter rounded-b-3xl"
        >
            <TouchableOpacity 
                className="flex-row items-center justify-between"
                onPress={handlePress}
                activeOpacity={0.8}
            >
                 <View className="flex-row items-center gap-2">
                     <View className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-400'}`} />
                     <Text className="text-sm font-semibold text-light dark:text-dark">{title}</Text>
                 </View>
                 
                 <View className="flex-row items-center gap-2">
                     <Text className="text-sm font-semibold tabular-nums text-light dark:text-dark">{formatSeconds(workoutSeconds)}</Text>
                     <IconSymbol name={rightIcon} size={16} color={theme.icon ?? '#000'} />
                 </View>
            </TouchableOpacity>
        </Animated.View>
    );
}
