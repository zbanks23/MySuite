import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useUITheme, RaisedCard, RaisedButton } from '@mysuite/ui';
import { IconSymbol } from '../ui/icon-symbol';


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
            <View className="flex-1 bg-light dark:bg-dark">
                <View className="flex-row items-center justify-between p-4 border-b border-light dark:border-white/10 pt-4 android:pt-10">
                    <TouchableOpacity onPress={onClose} className="p-2">
                            <Text className="text-base leading-[30px] text-[#0a7ea4]">Cancel</Text>
                    </TouchableOpacity>
                    <Text className="text-xl font-bold">Add Day</Text>
                    <View style={{ width: 50 }} />
                </View>
                
                <ScrollView className="flex-1 p-4">
                    <RaisedCard
                        onPress={onAddRestDay}
                        className="p-4 mb-6"
                    >
                        <View className="flex-row items-center">
                            <IconSymbol name="moon.zzz.fill" size={24} color={theme.primary} />
                            <Text className="ml-3 font-semibold text-lg text-light dark:text-dark">Rest Day</Text>
                        </View>
                    </RaisedCard>

                    <Text className="text-base leading-6 font-semibold mb-3">Saved Workouts</Text>
                    {savedWorkouts.length === 0 ? (
                            <Text className="text-gray-500 dark:text-gray-400 italic">No saved workouts found.</Text>
                    ) : (
                        savedWorkouts.map((workout) => (
                            <RaisedCard
                                key={workout.id}
                                onPress={() => onAddWorkout(workout)}
                                className="p-4 mb-3"
                            >
                                <View className="flex-row items-center justify-between">
                                    <View>
                                        <Text className="font-semibold text-lg text-light dark:text-dark">{workout.name}</Text>
                                        <Text className="text-light-muted dark:text-dark-muted text-sm">{workout.exercises?.length || 0} Exercises</Text>
                                    </View>
                                    <RaisedButton
                                        onPress={() => onAddWorkout(workout)}
                                        className="w-10 h-10 p-0 rounded-full"
                                        borderRadius={20}
                                    >
                                        <IconSymbol name="plus" size={20} color={theme.primary} />
                                    </RaisedButton>
                                </View>
                            </RaisedCard>
                        ))
                    )}
                    <View className="h-20" /> 
                </ScrollView>
            </View>
        </Modal>
    );
};
