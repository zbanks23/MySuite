import React, { useEffect, useState } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useUITheme as useTheme } from '@mysuite/ui';
import { useWorkoutManager } from '../../providers/WorkoutManagerProvider';

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
                <View className="w-[90%] bg-light dark:bg-dark rounded-2xl p-5 max-h-[80%]">
                    <Text className="text-xl font-bold text-center mb-4 text-light dark:text-dark">Workout Details</Text>
                    
                    {loading ? (
                        <View className="p-6 items-center justify-center">
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : error ? (
                        <View className="p-6 items-center justify-center">
                            <Text className="text-danger text-center">{error}</Text>
                        </View>
                    ) : details.length === 0 ? (
                        <View className="p-6 items-center justify-center">
                            <Text className="text-light-muted dark:text-dark-muted text-center">No details available for this workout.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={details}
                            keyExtractor={(item, index) => item.name + index}
                            contentContainerStyle={{ paddingBottom: 16 }}
                            renderItem={({ item }) => (
                                <View className="mb-4 bg-light-lighter dark:bg-dark-lighter p-3 rounded-lg">
                                    <Text className="text-base font-semibold text-light dark:text-dark mb-2">{item.name}</Text>
                                    {item.sets.map((set: any, idx: number) => {
                                        const parts = [];
                                        const props = item.properties || [];
                                        const hasProps = props.length > 0;
                                        
                                        // Determine what to show based on properties
                                        // If no properties defined, show everything that exists (legacy/fallback)
                                        // If properties defined, only show what is in properties
                                        // Exception: 'bodyweight' doesn't map to a value usually, 'weighted' maps to weight
                                        
                                        const propsLower = props.map((p: string) => p.toLowerCase());
                                        const showReps = !hasProps || propsLower.includes('reps');
                                        const showDuration = !hasProps || propsLower.includes('duration');
                                        const showDistance = !hasProps || propsLower.includes('distance');

                                        if (showReps && set.details?.reps) parts.push(`${set.details.reps} reps`);
                                        if (showDuration && set.details?.duration) parts.push(`${set.details.duration} seconds`);
                                        if (showDistance && set.details?.distance) parts.push(`${set.details.distance} meters`);
                                        if (set.details?.weight != null && set.details.weight > 0) parts.push(`${set.details.weight} lbs`);
                                        
                                        const mainText = parts.length > 0 ? parts.join(', ') : 'Completed';

                                        return (
                                        <View key={idx} className="flex-row justify-between mb-1">
                                            <Text className="text-sm text-light-muted dark:text-dark-muted">
                                                Set {set.setNumber || idx + 1}:
                                            </Text>
                                            <Text className="text-sm text-light-muted dark:text-dark-muted">
                                                {mainText}
                                            </Text>
                                        </View>
                                        );
                                    })}
                                </View>
                            )}
                        />
                    )}

                    <View className="items-center mt-4">
                        <TouchableOpacity onPress={onClose} className="px-6 py-2.5 bg-light-lighter dark:bg-dark-lighter rounded-lg">
                            <Text className="text-primary dark:text-primary-dark font-semibold text-base">Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
