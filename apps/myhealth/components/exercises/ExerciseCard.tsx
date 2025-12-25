import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';
import { formatSeconds } from '../../utils/formatting';
import { Exercise } from '../../hooks/workouts/useWorkoutManager';
import { RaisedCard } from '../../../../packages/ui/RaisedCard';
import { SetRow, getExerciseFields } from '../workouts/SetRow';

interface ExerciseCardProps {
    exercise: Exercise;
    isCurrent: boolean;
    onCompleteSet: (setIndex: number, input: { weight?: string, reps?: string, duration?: string, distance?: string }) => void;
    onUncompleteSet?: (index: number) => void;
    onUpdateSetTarget?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance', value: string) => void;
    onUpdateLog?: (index: number, key: 'weight' | 'reps' | 'duration' | 'distance', value: string) => void;
    onAddSet: () => void;
    onDeleteSet: (index: number) => void;
    restSeconds: number;
    theme: any;
    latestBodyWeight?: number | null;
}

export function ExerciseCard({ exercise, isCurrent, onCompleteSet, onUncompleteSet, onUpdateSetTarget, onUpdateLog, onAddSet, onDeleteSet, restSeconds, theme, latestBodyWeight }: ExerciseCardProps) {
    // Derived state
    const completedSets = exercise.completedSets || 0;
    const isFinished = completedSets >= exercise.sets;

    const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(exercise.properties);

    return (
        <RaisedCard>

            <View className="flex-row justify-between items-center mb-0">
                <View>
                    <Text className="text-lg font-bold text-light dark:text-dark mb-1">{exercise.name}</Text>
                </View>
                {isFinished && <IconSymbol name="checkmark.circle.fill" size={24} color={theme.primary} />}
            </View>

            <View className="pt-3">
                {/* Headers */}
                <View className="flex-row mb-2 px-1">
                    <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[30px] text-light-muted dark:text-dark-muted">SET</Text>
                    <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted flex-1">PREVIOUS</Text>
                    {showBodyweight && <Text className="text-[10px] items-center justify-center font-bold uppercase text-center w-[60px] mx-1 text-light-muted dark:text-dark-muted">BW</Text>}
                    {showWeight && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">LBS</Text>}
                    {showReps && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">REPS</Text>}
                    {showDuration && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">TIME</Text>}
                    {showDistance && <Text className="text-[10px] font-bold uppercase text-center text-light-muted dark:text-dark-muted w-[60px] mx-1">DIST</Text>}
                    <View className="w-[40px] items-center" />
                    <View className="w-[30px] items-center justify-center" />
                </View>

                {/* Render Rows */}
                {Array.from({ length: Math.max(exercise.sets, exercise.logs?.length || 0) }).map((_, i) => (
                    <SetRow 
                        key={i} 
                        index={i}
                        exercise={exercise}
                        onCompleteSet={(input) => onCompleteSet(i, input)}
                        onUncompleteSet={onUncompleteSet}
                        onUpdateSetTarget={onUpdateSetTarget}
                        onUpdateLog={onUpdateLog}
                        onDeleteSet={onDeleteSet}
                        theme={theme}
                        latestBodyWeight={latestBodyWeight}
                    />
                ))}

                {/* Rest Timer (Compact) */}
                {isCurrent && restSeconds > 0 && (
                     <View className="flex-row items-center justify-center gap-1.5 mt-2 p-2 bg-dark dark:bg-dark-darker rounded-lg">
                        <IconSymbol name="timer" size={16} color={theme.primary} />
                        <Text className="text-sm font-bold text-light dark:text-dark tabular-nums">{formatSeconds(restSeconds)}</Text>
                    </View>
                )}

                {/* Add Set Button */}
                <TouchableOpacity 
                    className="flex-row items-center justify-center pt-3 pb-5 gap-2 border-b border-light dark:border-dark" 
                    onPress={onAddSet}
                >
                     <IconSymbol name="plus.circle.fill" size={20} color={theme.primary} />
                     <Text className="text-sm font-semibold text-primary dark:text-primary-dark">Add Set</Text>
                </TouchableOpacity>
            </View>
        </RaisedCard>
    );
}

