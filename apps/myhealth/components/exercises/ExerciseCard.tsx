import React from 'react';
import { View, Text } from 'react-native';
import { IconSymbol } from '../ui/icon-symbol';

import { Exercise } from '../../hooks/workouts/useWorkoutManager';
import { RaisedCard, HollowedButton } from '../../../../packages/ui';
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

    theme: any;
    latestBodyWeight?: number | null;
}

export function ExerciseCard({ exercise, isCurrent, onCompleteSet, onUncompleteSet, onUpdateSetTarget, onUpdateLog, onAddSet, onDeleteSet, theme, latestBodyWeight }: ExerciseCardProps) {
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
                    <View className="w-[30px] items-center" />
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



                {/* Add Set Button */}
                {/* Add Set Button */}
                <View className="items-center justify-center mt-1">
                    <HollowedButton 
                        title="+ Add Set" 
                        onPress={onAddSet} 
                        className="py-3 w-full"
                        textClassName="text-sm font-semibold text-primary dark:text-primary-dark"
                    />
                </View>
            </View>
        </RaisedCard>
    );
}

