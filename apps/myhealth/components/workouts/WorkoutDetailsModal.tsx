import React, { useEffect, useState } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { useWorkoutManager } from '../../hooks/useWorkoutManager';

interface WorkoutDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    workoutLogId: string | null;
}

export function WorkoutDetailsModal({ visible, onClose, workoutLogId }: WorkoutDetailsModalProps) {
    const theme = useTheme();
    const { fetchWorkoutLogDetails } = useWorkoutManager();
    const [details, setDetails] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDetails(id: string) {
            setLoading(true);
            setError(null);
            try {
                const { data, error } = await fetchWorkoutLogDetails(id);
                if (error) {
                    if (typeof error === 'string') {
                        setError(error);
                    } else if (error && typeof error === 'object' && 'message' in error) {
                        setError(error.message);
                    } else {
                        setError("Failed to load details");
                    }
                } else {
                    setDetails(data);
                }
            } catch {
                setError("An unexpected error occurred");
            } finally {
                setLoading(false);
            }
        }

        if (visible && workoutLogId) {
            loadDetails(workoutLogId);
        } else {
            setDetails([]);
            setError(null);
        }
    }, [visible, workoutLogId, fetchWorkoutLogDetails]);

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View className="flex-1 justify-center items-center bg-black/50">
                <View className="w-[90%] bg-background dark:bg-background_dark rounded-2xl p-5 shadow-lg max-h-[80%]">
                    <Text className="text-xl font-bold text-center mb-4 text-apptext dark:text-apptext_dark">Workout Details</Text>
                    
                    {loading ? (
                        <View className="p-6 items-center justify-center">
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : error ? (
                        <View className="p-6 items-center justify-center">
                            <Text className="text-red-500 text-center">{error}</Text>
                        </View>
                    ) : details.length === 0 ? (
                        <View className="p-6 items-center justify-center">
                            <Text className="text-gray-500 text-center">No details available for this workout.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={details}
                            keyExtractor={(item, index) => item.name + index}
                            contentContainerStyle={{ paddingBottom: 16 }}
                            renderItem={({ item }) => (
                                <View className="mb-4 bg-surface dark:bg-surface_dark p-3 rounded-lg">
                                    <Text className="text-base font-semibold text-apptext dark:text-apptext_dark mb-2">{item.name}</Text>
                                    {item.sets.map((set: any, idx: number) => (
                                        <View key={idx} className="flex-row justify-between mb-1">
                                            <Text className="text-sm text-gray-500">
                                                Set {set.setNumber || idx + 1}:
                                            </Text>
                                            <Text className="text-sm text-gray-500">
                                                {set.details?.reps ? `${set.details.reps} reps` : 'Completed'}
                                            </Text>
                                             {set.details?.weight != null && set.details.weight > 0 && (
                                                <Text className="text-sm text-gray-500"> @ {set.details.weight}</Text>
                                             )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        />
                    )}

                    <View className="items-center mt-4">
                        <TouchableOpacity onPress={onClose} className="px-6 py-2.5 bg-surface dark:bg-surface_dark rounded-lg">
                            <Text className="text-apptext dark:text-apptext_dark font-semibold text-base">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
