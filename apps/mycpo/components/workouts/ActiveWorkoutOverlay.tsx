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

    } = useActiveWorkout();



    useEffect(() => {
        if (!isExpanded) return;

        const onBackPress = () => {
            setExpanded(false);
            return true; // prevent default behavior
        };

        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => subscription.remove();
    }, [isExpanded, setExpanded]);





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
                             <Text className="text-xl text-apptext dark:text-apptext_dark mb-4">No exercises found</Text>
                             <TouchableOpacity 
                                className="px-6 py-3 rounded-xl bg-primary dark:bg-primary_dark"
                                onPress={() => router.push('/exercises')}
                             >
                                 <Text className="text-white font-semibold">+ Add Exercises</Text>
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
                                        const parsedInput = {
                                            weight: input?.weight ? parseFloat(input.weight) : undefined,
                                            reps: input?.reps ? parseFloat(input.reps) : undefined,
                                            duration: input?.duration ? parseFloat(input.duration) : undefined,
                                        };
                                        completeSet(index, parsedInput);
                                    }}
                                    onUncompleteSet={(setIndex) => {
                                        const currentLogs = exercise.logs || [];
                                        if (setIndex < currentLogs.length) {
                                            const newLogs = [...currentLogs];
                                            newLogs.splice(setIndex, 1);
                                            updateExercise(index, { 
                                                logs: newLogs, 
                                                completedSets: (exercise.completedSets || 1) - 1,
                                            });
                                        }
                                    }}
                                    onUpdateSetTarget={(setIndex, key, value) => {
                                        const numValue = value === '' ? 0 : parseFloat(value);
                                        const currentTargets = exercise.setTargets ? [...exercise.setTargets] : [];
                                        
                                        // Ensure targets exist up to setIndex
                                        while (currentTargets.length <= setIndex) {
                                            currentTargets.push({ weight: 0, reps: exercise.reps });
                                        }

                                        currentTargets[setIndex] = {
                                            ...currentTargets[setIndex],
                                            [key]: isNaN(numValue) ? 0 : numValue
                                        };

                                        updateExercise(index, { setTargets: currentTargets });
                                    }}
                                    onAddSet={() => updateExercise(index, { sets: exercise.sets + 1 })}
                                    onDeleteSet={(setIndex) => {
                                        const currentLogs = exercise.logs || [];
                                        const currentTarget = exercise.sets;
                                        
                                        if (setIndex < currentLogs.length) {
                                            const newLogs = [...currentLogs];
                                            newLogs.splice(setIndex, 1);
                                            updateExercise(index, { 
                                                logs: newLogs, 
                                                completedSets: (exercise.completedSets || 1) - 1,
                                                sets: currentTarget > 0 ? currentTarget - 1 : 0
                                            });
                                        } else {
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
