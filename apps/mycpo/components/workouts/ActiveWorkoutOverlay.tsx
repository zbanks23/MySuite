"use client"

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ExerciseCard } from '../ui/ExerciseCard';

export function ActiveWorkoutOverlay() {
    const theme = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const {
        exercises,
        restSeconds,
        currentIndex,
        completeSet,
        updateExercise,
        isExpanded,
        setExpanded,
        toggleExpanded,

    } = useActiveWorkout();


    // handle back button
    useEffect(() => {
        if (!isExpanded) return;

        const onBackPress = () => {
            setExpanded(false);
            return true; // prevent default behavior
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [isExpanded, setExpanded]);




    // If not expanded, return null or handle animation visibility
    if (!isExpanded) return null;

    return (
        <Animated.View 
            style={{ paddingTop: insets.top + 50 }} // Top padding for Persistent Header
            className="absolute inset-0 z-[999] bg-background dark:bg-background_dark"
            entering={SlideInUp.duration(400)} 
            exiting={SlideOutUp.duration(400)}
        >
            <View className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 150 }}>
                     {(!exercises || exercises.length === 0) ? (
                        <View className="flex-1 items-center justify-center">
                             <Text className="text-xl text-apptext dark:text-apptext_dark">No exercises found</Text>
                             <TouchableOpacity onPress={toggleExpanded} className="p-2.5">
                                 <Text className="text-primary dark:text-primary_dark">Close</Text>
                             </TouchableOpacity>
                        </View>
                     ) : (
                        <>
                            {exercises.map((exercise, index) => (
                                <ExerciseCard 
                                    key={index}
                                    exercise={exercise}
                                    isCurrent={index === currentIndex}
                                    restSeconds={restSeconds}
                                    theme={theme}
                                    onCompleteSet={(input) => {
                                        // ExerciseCard might return strings from TextInput, need to parse
                                        const parsedInput = {
                                            weight: input?.weight ? parseFloat(input.weight) : undefined,
                                            reps: input?.reps ? parseFloat(input.reps) : undefined,
                                            duration: input?.duration ? parseFloat(input.duration) : undefined,
                                        };
                                        completeSet(index, parsedInput);
                                    }}
                                    onAddSet={() => updateExercise(index, { sets: exercise.sets + 1 })}
                                    onDeleteSet={(setIndex) => {
                                        // Logic for deleting a set
                                        const currentLogs = exercise.logs || [];
                                        const currentTarget = exercise.sets;
                                        
                                        if (setIndex < currentLogs.length) {
                                            // Deleting a completed set (log)
                                            const newLogs = [...currentLogs];
                                            newLogs.splice(setIndex, 1);
                                            updateExercise(index, { 
                                                logs: newLogs, 
                                                completedSets: (exercise.completedSets || 1) - 1,
                                                sets: currentTarget > 0 ? currentTarget - 1 : 0
                                            });
                                        } else {
                                            // Deleting a pending set (reduce target)
                                            updateExercise(index, { sets: Math.max(0, currentTarget - 1) });
                                        }
                                    }}
                                />
                            ))}
                            <TouchableOpacity 
                                className="mt-5 p-4 rounded-xl border border-dashed border-primary dark:border-primary_dark items-center justify-center"
                                onPress={() => router.push('/exercises')}
                            >
                                <Text className="text-base font-semibold text-primary dark:text-primary_dark">+ Add Exercise</Text>
                            </TouchableOpacity>
                        </>
                     )}
                </ScrollView>
            </View>

        </Animated.View>
    );
}
