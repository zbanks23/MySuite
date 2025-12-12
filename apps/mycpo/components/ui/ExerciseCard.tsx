import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { IconSymbol } from './icon-symbol';
import { formatSeconds } from '../../utils/formatting';
import { Exercise } from '../../hooks/useWorkoutManager';

interface ExerciseCardProps {
    exercise: Exercise;
    isCurrent: boolean;
    onCompleteSet: (input: { weight?: string, reps?: string, duration?: string }) => void;
    onAddSet: () => void;
    onDeleteSet: (index: number) => void;
    restSeconds: number;
    theme: any;
}

export function ExerciseCard({ exercise, isCurrent, onCompleteSet, onAddSet, onDeleteSet, restSeconds, theme }: ExerciseCardProps) {
    // Current input state
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    
    // Derived state
    const completedSets = exercise.completedSets || 0;
    const isFinished = completedSets >= exercise.sets;

    const handleComplete = () => {
        onCompleteSet({ weight, reps });
        // Clear inputs for next set? Or keep current weights?
        // Usually good to keep weights if same, or clear. Let's keep for now or clear?
        // User might do same weight.
    };

    return (
        <View className={`bg-surface dark:bg-surface_dark rounded-2xl p-4 mb-3 w-full ${isCurrent ? 'border-2 border-primary dark:border-primary_dark' : ''}`}>
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
                <View>
                    <Text className="text-lg font-bold text-apptext dark:text-apptext_dark mb-1">{exercise.name}</Text>
                    <Text className="text-sm text-gray-500">Target: {exercise.sets} sets • {exercise.reps} reps</Text>
                </View>
                {isFinished && <IconSymbol name="checkmark.circle.fill" size={24} color={theme.primary} />}
                {isCurrent && !isFinished && (
                    <View className="bg-primary dark:bg-primary_dark px-2 py-1 rounded-lg ml-2">
                        <Text className="text-white text-[10px] font-bold">CURRENT</Text>
                    </View>
                )}
            </View>

            <View className="pt-3">
                {/* Headers */}
                <View className="flex-row mb-2 px-1">
                    <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[30px] text-gray-500">SET</Text>
                    <Text className="text-[10px] font-bold uppercase text-center text-gray-500 flex-1">PREVIOUS</Text>
                    <Text className="text-[10px] font-bold uppercase text-center text-gray-500 w-[60px]">LBS</Text>
                    <Text className="text-[10px] font-bold uppercase text-center text-gray-500 w-[60px]">REPS</Text>
                    <View className="w-[40px] items-center" />
                    <View className="w-[30px] items-center justify-center" />
                </View>

                {/* Render Rows */}
                {Array.from({ length: Math.max(exercise.sets, exercise.logs?.length || 0) }).map((_, i) => {
                    const log = exercise.logs?.[i];
                    const isCompleted = !!log;
                    const isCurrentSet = !isCompleted && i === (exercise.logs?.length || 0);
                    
                    return (
                        <View key={i} className={`flex-row items-center mb-2 h-11 bg-surface dark:bg-surface_dark rounded-lg ${isCurrentSet ? 'bg-black/5 dark:bg-white/5' : ''}`}>
                            {/* Set Number */}
                            <View className="w-[30px]">
                                <View className={`w-6 h-6 rounded-full items-center justify-center ${isCompleted ? 'bg-primary dark:bg-primary_dark' : 'bg-transparent'} ${isCurrentSet ? 'border border-primary dark:border-primary_dark' : ''}`}>
                                    <Text className={`text-xs font-bold ${isCompleted ? 'text-white' : 'text-gray-500'}`}>{i + 1}</Text>
                                </View>
                            </View>

                            {/* Previous (Placeholder for now, could be history) */}
                            <Text className="flex-1 text-center text-xs text-gray-500">-</Text>

                            {/* Inputs / Values */}
                            {isCompleted ? (
                                <>
                                    <Text className="w-[60px] text-center text-sm font-bold text-apptext dark:text-apptext_dark">{log.weight}</Text>
                                    <Text className="w-[60px] text-center text-sm font-bold text-apptext dark:text-apptext_dark">{log.reps}</Text>
                                    <View className="w-[40px] items-center">
                                         <IconSymbol name="checkmark" size={16} color={theme.primary} />
                                    </View>
                                </>
                            ) : isCurrentSet ? (
                                <>
                                    <TextInput 
                                        className="w-[60px] h-9 bg-background dark:bg-background_dark rounded-lg text-center text-base font-bold text-apptext dark:text-apptext_dark mx-1"
                                        value={weight} 
                                        onChangeText={setWeight} 
                                        placeholder="-" 
                                        keyboardType="numeric" 
                                        placeholderTextColor={theme.icon || '#9ca3af'}
                                    />
                                    <TextInput 
                                        className="w-[60px] h-9 bg-background dark:bg-background_dark rounded-lg text-center text-base font-bold text-apptext dark:text-apptext_dark mx-1"
                                        value={reps} 
                                        onChangeText={setReps} 
                                        placeholder={exercise.reps.toString()}
                                        keyboardType="numeric" 
                                        placeholderTextColor={theme.icon || '#9ca3af'}
                                    />
                                    <TouchableOpacity 
                                        className="w-9 h-9 rounded-lg bg-primary dark:bg-primary_dark items-center justify-center ml-1" 
                                        onPress={handleComplete}
                                    >
                                        <IconSymbol name="checkmark" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text className="w-[60px] text-center text-sm text-gray-300">-</Text>
                                    <Text className="w-[60px] text-center text-sm text-gray-300">-</Text>
                                    <View className="w-[40px] items-center" />
                                </>
                            )}
                            
                            {/* Delete Action */}
                            <TouchableOpacity className="w-[30px] items-center justify-center" onPress={() => onDeleteSet(i)}>
                                <IconSymbol name="trash" size={16} color={theme.icon || '#9ca3af'} />
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {/* Rest Timer (Compact) */}
                {isCurrent && restSeconds > 0 && (
                     <View className="flex-row items-center justify-center gap-1.5 mt-2 p-2 bg-black/5 dark:bg-white/5 rounded-lg">
                        <IconSymbol name="timer" size={16} color={theme.primary} />
                        <Text className="text-sm font-bold text-apptext dark:text-apptext_dark tabular-nums">{formatSeconds(restSeconds)}</Text>
                    </View>
                )}

                {/* Add Set Button */}
                <TouchableOpacity 
                    className="flex-row items-center justify-center py-3 mt-2 gap-2 border-t border-black/5 dark:border-white/10" 
                    onPress={onAddSet}
                >
                     <IconSymbol name="plus.circle.fill" size={20} color={theme.primary} />
                     <Text className="text-sm font-semibold text-primary dark:text-primary_dark">Add Set</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
