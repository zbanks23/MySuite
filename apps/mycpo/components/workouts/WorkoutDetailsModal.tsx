import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { useWorkoutManager } from '../../hooks/useWorkoutManager';

interface WorkoutDetailsModalProps {
    visible: boolean;
    onClose: () => void;
    workoutLogId: string | null;
}

export function WorkoutDetailsModal({ visible, onClose, workoutLogId }: WorkoutDetailsModalProps) {
    const theme = useTheme();
    const styles = makeStyles(theme);
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
            <View style={styles.modalBackdrop}>
                <View style={[styles.modalCard, { maxHeight: '80%' }]}>
                    <Text style={styles.modalTitle}>Workout Details</Text>
                    
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={theme.primary} />
                        </View>
                    ) : error ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : details.length === 0 ? (
                        <View style={styles.centerContainer}>
                            <Text style={styles.emptyText}>No details available for this workout.</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={details}
                            keyExtractor={(item, index) => item.name + index}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => (
                                <View style={styles.exerciseItem}>
                                    <Text style={styles.exerciseName}>{item.name}</Text>
                                    {item.sets.map((set: any, idx: number) => (
                                        <View key={idx} style={styles.setRow}>
                                            <Text style={styles.setText}>
                                                Set {set.setNumber || idx + 1}:
                                            </Text>
                                            <Text style={styles.setText}>
                                                {set.details?.reps ? `${set.details.reps} reps` : 'Completed'}
                                            </Text>
                                             {set.details?.weight && (
                                                <Text style={styles.setText}> @ {set.details.weight}</Text>
                                             )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        />
                    )}

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const makeStyles = (theme: any) =>
    StyleSheet.create({
        modalBackdrop: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
        },
        modalCard: {
            width: '90%',
            backgroundColor: theme.background,
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 16,
            textAlign: 'center',
        },
        centerContainer: {
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
        },
        listContent: {
            paddingBottom: 16,
        },
        exerciseItem: {
            marginBottom: 16,
            backgroundColor: theme.surface,
            padding: 12,
            borderRadius: 8,
        },
        exerciseName: {
            fontSize: 16,
            fontWeight: '600',
            color: theme.text,
            marginBottom: 8,
        },
        setRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 4,
        },
        setText: {
            fontSize: 14,
            color: theme.icon,
        },
        errorText: {
            color: 'red',
            textAlign: 'center',
        },
        emptyText: {
            color: theme.icon,
            textAlign: 'center',
        },
        footer: {
            marginTop: 16,
            alignItems: 'center',
        },
        closeButton: {
            paddingVertical: 10,
            paddingHorizontal: 24,
            backgroundColor: theme.surface,
            borderRadius: 8,
        },
        closeButtonText: {
            color: theme.text,
            fontWeight: '600',
            fontSize: 16,
        },
    });
