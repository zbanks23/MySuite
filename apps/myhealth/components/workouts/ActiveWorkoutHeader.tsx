import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { RaisedButton } from '@mysuite/ui';
import Animated from 'react-native-reanimated';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { formatSeconds } from '../../utils/formatting';
import { IconSymbol } from '../ui/icon-symbol';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ActiveWorkoutHeader() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const { isRunning, workoutSeconds, workoutName, isExpanded, toggleExpanded, hasActiveSession, pauseWorkout, exercises } = useActiveWorkout();
    

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
        
        const completedSetsCount = exercises.reduce((acc, ex) => acc + (ex.completedSets || 0), 0);

        if (completedSetsCount === 0) {
            Alert.alert(
                "No Sets Completed",
                "Please complete at least one set or discard this workout session below.",
                [{ text: "OK" }]
            );
            return;
        }

        // Pause and navigate to end screen
        pauseWorkout();
        router.push('/workouts/end');
    };

    if (isExpanded) {
        return (
            <Animated.View 
                style={{ 
                    zIndex: 1001,
                    top: 0,
                    left: 0,
                    right: 0,
                    paddingTop: insets.top,
                    paddingBottom: 16,
                }}
                className="absolute bg-light/80 dark:bg-dark/80 rounded-b-3xl"
            >
                {/* Background Tappable Area for Toggle (Expanded) */}
                <TouchableOpacity 
                    className="absolute inset-0 z-0"
                    onPress={handlePress} 
                    activeOpacity={1}
                />

                {/* Content Container (Expanded) */}
                <View 
                    className="flex-row justify-center items-center relative z-10 min-h-[44px]"
                    pointerEvents="box-none"
                >
                    {/* Left: Timer + Status */}
                    <View className="absolute left-5 z-10 flex-row items-center gap-2" pointerEvents="none">
                        <View className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-400'}`} />
                        <Text className="text-sm font-semibold tabular-nums text-light dark:text-dark">{formatSeconds(workoutSeconds)}</Text>
                    </View>
                    
                    {/* Center: Title */}
                    <Text 
                        className="text-2xl font-bold text-light dark:text-dark text-center flex-1 mx-20" 
                        numberOfLines={1}
                        pointerEvents="none"
                    >
                        {title}
                    </Text>
                    
                    {/* Right: End Button */}
                    <View className="absolute right-5 z-10">
                        <RaisedButton 
                            onPress={handleEnd}
                            className="h-8 px-3 py-0 bg-light dark:bg-dark-lighter"
                            variant="custom"
                            borderRadius={16}
                            showGradient={false}
                        >
                            <Text className="text-danger text-xs font-bold">End</Text>
                        </RaisedButton>
                    </View>
                </View>
            </Animated.View>
        );
    }

    // Minimized Pill State
    return (
        <Animated.View 
            style={{ 
                zIndex: 1001,
                bottom: insets.bottom + 12,
                left: 16,
                right: 16,
                paddingTop: 10,
                paddingBottom: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 5,
            }}
            className="absolute bg-light/80 dark:bg-dark/80 rounded-full"
        >
            {/* Main Interactive Entity (entire pill + semi-circle area) */}
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={handlePress}
                className="absolute inset-0 z-0"
                style={{ overflow: 'visible' }}
            >
                <View 
                    style={{
                        position: 'absolute',
                        left: '50%',
                        transform: [{ translateX: -20 }],
                        top: -20, // Height is 20, sitting exactly on top of pill (offset by padding)
                        width: 40,
                        height: 20,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                    className="bg-light/80 dark:bg-dark/80"
                >
                    <View style={{ marginTop: 4 }}>
                        <IconSymbol 
                            name={rightIcon} 
                            size={14} 
                            className="text-light dark:text-dark"
                        />
                    </View>
                </View>
            </TouchableOpacity>

            {/* Content Container (Minimized) */}
            <View 
                className="flex-row justify-center items-center relative z-10 min-h-[40px]"
                pointerEvents="box-none"
            >
                 {/* Left: Timer + Status */}
                 <View className="absolute left-4 z-10 flex-row items-center gap-2" pointerEvents="none">
                     <View className={`w-2 h-2 rounded-full ${isRunning ? 'bg-primary dark:bg-primary-dark' : 'bg-gray-400'}`} />
                     <Text className="text-xs font-semibold tabular-nums text-light dark:text-dark">{formatSeconds(workoutSeconds)}</Text>
                 </View>
                 
                 {/* Center: Title */}
                 <Text 
                    className="text-lg font-bold text-light dark:text-dark text-center flex-1 mx-20" 
                    numberOfLines={1}
                    pointerEvents="none"
                 >
                    {title}
                 </Text>
                 
                 {/* Right: End Button Only */}
                 <View className="absolute right-4 z-10">
                     <RaisedButton 
                        onPress={handleEnd}
                        className="h-7 px-2.5 py-0 bg-light dark:bg-dark-lighter"
                        variant="custom"
                        borderRadius={16}
                        showGradient={false}
                     >
                         <Text className="text-danger text-xs font-bold">End</Text>
                     </RaisedButton>
                 </View>
            </View>
        </Animated.View>
    );
}
