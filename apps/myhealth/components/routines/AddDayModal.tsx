import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { ThemedView } from '../ui/ThemedView';
import { ThemedText } from '../ui/ThemedText';
import { IconSymbol } from '../ui/icon-symbol';
import { useUITheme } from '@mycsuite/ui';

interface AddDayModalProps {
    visible: boolean;
    onClose: () => void;
    onAddRestDay: () => void;
    onAddWorkout: (workout: any) => void;
    savedWorkouts: any[];
}

export const AddDayModal = ({
    visible,
    onClose,
    onAddRestDay,
    onAddWorkout,
    savedWorkouts
}: AddDayModalProps) => {
    const theme = useUITheme();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <ThemedView className="flex-1">
                <View className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10 pt-4 android:pt-10">
                    <TouchableOpacity onPress={onClose} className="p-2">
                            <ThemedText type="link">Cancel</ThemedText>
                    </TouchableOpacity>
                    <ThemedText type="subtitle">Add Day</ThemedText>
                    <View style={{ width: 50 }} />
                </View>
                
                <ScrollView className="flex-1 p-4">
                    <ThemedText type="defaultSemiBold" className="mb-3">Options</ThemedText>
                    <TouchableOpacity 
                        onPress={onAddRestDay} 
                        className="bg-surface dark:bg-surface_dark p-4 rounded-xl border border-black/5 dark:border-white/10 mb-6 flex-row items-center"
                    >
                        <IconSymbol name="moon.zzz.fill" size={24} color={theme.primary} />
                        <ThemedText className="ml-3 font-semibold text-lg">Rest Day</ThemedText>
                    </TouchableOpacity>

                    <ThemedText type="defaultSemiBold" className="mb-3">Saved Workouts</ThemedText>
                    {savedWorkouts.length === 0 ? (
                            <Text className="text-gray-500 dark:text-gray-400 italic">No saved workouts found.</Text>
                    ) : (
                        savedWorkouts.map((workout) => (
                            <TouchableOpacity 
                                key={workout.id}
                                onPress={() => onAddWorkout(workout)}
                                className="bg-surface dark:bg-surface_dark p-4 rounded-xl border border-black/5 dark:border-white/10 mb-3 flex-row items-center justify-between"
                            >
                                <View>
                                    <ThemedText className="font-semibold text-lg">{workout.name}</ThemedText>
                                    <Text className="text-gray-500 dark:text-gray-400 text-sm">{workout.exercises?.length || 0} Exercises</Text>
                                </View>
                                <IconSymbol name="plus.circle" size={24} color={theme.primary} />
                            </TouchableOpacity>
                        ))
                    )}
                    <View className="h-20" /> 
                </ScrollView>
            </ThemedView>
        </Modal>
    );
};
