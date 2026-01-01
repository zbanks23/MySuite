import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { IconSymbol, useUITheme } from "@mysuite/ui";

interface WorkoutDraftExerciseItemProps {
    item: any;
    index: number;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onMove: (dir: -1 | 1) => void;
    onRemove: () => void;
    onUpdateSet: (setIndex: number, field: 'reps' | 'weight' | 'duration' | 'distance', value: string) => void;
    onAddSet: () => void;
    onRemoveSet: (setIndex: number) => void;
    latestBodyWeight?: number | null;
}

export const WorkoutDraftExerciseItem = ({
    item,
    index,
    isExpanded,
    onToggleExpand,
    onMove,
    onRemove,
    onUpdateSet,
    onAddSet,
    onRemoveSet,
    latestBodyWeight
}: WorkoutDraftExerciseItemProps) => {
    const theme = useUITheme();
    const currentTargets = item.setTargets || Array.from({ length: item.sets || 1 }, () => ({ reps: item.reps || 0, weight: 0 }));
    
    // Helper to determine which columns to show
    const getExerciseFields = (properties?: string[]) => {
        const props = properties || [];
        const lowerProps = props.map(p => p.toLowerCase());
        return { 
            showBodyweight: lowerProps.includes('bodyweight'),
            showWeight: lowerProps.includes('weighted'),
            showReps: lowerProps.includes('reps'),
            showDuration: lowerProps.includes('duration'),
            showDistance: lowerProps.includes('distance')
        };
    };

    const { showBodyweight, showWeight, showReps, showDuration, showDistance } = getExerciseFields(item.properties);

    return (
        <View className="bg-light-lighter dark:bg-border-dark rounded-xl mb-3 overflow-hidden border border-black/5 dark:border-white/10">
            <TouchableOpacity 
                onPress={onToggleExpand}
                className="flex-row items-center justify-between p-3"
            >
                <View className="flex-1 mr-2">
                    <Text className="text-base leading-6 font-semibold">{item.name}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                        {item.sets} Sets
                        {showReps && ` • ${item.reps} Reps`}
                        {showDuration && ` • ${item.reps}s`} 
                    </Text>
                </View>
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); onMove(-1); }} className="p-2"> 
                        <IconSymbol name="arrow.up" size={16} color={theme.icon || '#888'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); onMove(1); }} className="p-2"> 
                        <IconSymbol name="arrow.down" size={16} color={theme.icon || '#888'} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={(e) => { e.stopPropagation(); onRemove(); }} className="p-2 ml-1"> 
                        <IconSymbol name="trash.fill" size={18} color={theme.options?.destructiveColor || '#ff4444'} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
            
            {isExpanded && (
                <View className="px-3 pb-3 pt-1 bg-light/50 dark:bg-dark/30">
                    <View className="flex-row mb-2">
                        <Text className="w-10 text-xs text-gray-500 font-semibold text-center">Set</Text>
                        {showBodyweight && <Text className="w-12 text-xs text-gray-500 font-semibold text-center">{latestBodyWeight ? 'Lbs' : 'BW'}</Text>}
                        {showWeight && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Lbs</Text>}
                        {showReps && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Reps</Text>}
                        {showDuration && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Time</Text>}
                        {showDistance && <Text className="flex-1 text-xs text-gray-500 font-semibold text-center">Dist</Text>}
                        <View className="w-8" />
                    </View>
                    {currentTargets.map((set: any, setIdx: number) => (
                        <View key={setIdx} className="flex-row items-center mb-2">
                            <Text className="w-10 text-light dark:text-dark text-center font-medium">{setIdx + 1}</Text>
                            
                            {showBodyweight && (
                                <View className="w-12 items-center justify-center">
                                    <Text className="text-sm font-bold text-black/50 dark:text-white/50">
                                        {latestBodyWeight ? `${latestBodyWeight}` : 'BW'}
                                    </Text>
                                </View>
                            )}

                            {showWeight && (
                                <View className="flex-1 flex-row justify-center">
                                    <TextInput 
                                        value={String(set.weight || 0)} 
                                        keyboardType="numeric"
                                        onChangeText={(v) => onUpdateSet(setIdx, 'weight', v)}
                                        className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                        selectTextOnFocus
                                    />
                                </View>
                            )}

                            {showReps && (
                                <View className="flex-1 flex-row justify-center">
                                    <TextInput 
                                        value={String(set.reps || 0)} 
                                        keyboardType="numeric"
                                        onChangeText={(v) => onUpdateSet(setIdx, 'reps', v)}
                                        className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                        selectTextOnFocus
                                    />
                                </View>
                            )}

                            {showDuration && (
                                <View className="flex-1 flex-row justify-center">
                                    <TextInput 
                                        value={String(set.duration || 0)} 
                                        keyboardType="numeric"
                                        onChangeText={(v) => onUpdateSet(setIdx, 'duration', v)}
                                        className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                        selectTextOnFocus
                                    />
                                </View>
                            )}

                            {showDistance && (
                                <View className="flex-1 flex-row justify-center">
                                    <TextInput 
                                        value={String(set.distance || 0)} 
                                        keyboardType="numeric"
                                        onChangeText={(v) => onUpdateSet(setIdx, 'distance', v)}
                                        className="bg-light dark:bg-dark border border-black/10 dark:border-white/10 rounded px-2 py-1 w-16 text-center text-light dark:text-dark"
                                        selectTextOnFocus
                                    />
                                </View>
                            )}

                            <TouchableOpacity 
                                onPress={() => onRemoveSet(setIdx)}
                                className="w-8 items-center justify-center rounded h-8 ml-2"
                            >
                                <IconSymbol name="minus.circle.fill" size={20} color="#ff4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity 
                        onPress={onAddSet}
                        className="flex-row items-center justify-center p-2 mt-1 rounded-lg border border-dashed border-black/10 dark:border-white/10"
                    >
                        <IconSymbol name="plus" size={14} color={theme.primary} />
                        <Text className="ml-2 text-sm text-primary dark:text-primary-dark font-medium">Add Set</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};
