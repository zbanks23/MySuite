import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Modal } from 'react-native';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '../components/ui/icon-symbol';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { useWorkoutManager } from '../hooks/useWorkoutManager';
import { useFloatingButton } from '../providers/FloatingButtonContext';
import { ThemedView } from '../components/ui/ThemedView';
import { ThemedText } from '../components/ui/ThemedText';
import { createSequenceItem } from '../utils/workout-logic';

export default function CreateRoutineScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const { setIsHidden } = useFloatingButton();
    
    // Hide floating buttons
    useEffect(() => {
        setIsHidden(true);
        return () => setIsHidden(false);
    }, [setIsHidden]);

    const { 
        routines,
        savedWorkouts, 
        saveRoutineDraft, 
        updateRoutine, 
        deleteRoutine 
    } = useWorkoutManager();

    const editingRoutineId = typeof id === 'string' ? id : null;
    const [routineDraftName, setRoutineDraftName] = useState("");
    const [routineSequence, setRoutineSequence] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Add Day State
    const [isAddingDay, setIsAddingDay] = useState(false);

    // Initialize
    useEffect(() => {
        if (editingRoutineId) {
            const routine = routines.find(r => r.id === editingRoutineId);
            if (routine) {
                setRoutineDraftName(routine.name);
                setRoutineSequence(routine.sequence ? JSON.parse(JSON.stringify(routine.sequence)) : []);
            } else {
                Alert.alert("Error", "Routine not found");
                router.back();
            }
        }
        setIsLoading(false);
    }, [editingRoutineId, routines, router]);

    async function handleSaveRoutine() {
        if (!routineDraftName.trim()) {
            Alert.alert("Required", "Please enter a routine name");
            return;
        }

        setIsSaving(true);
        const onSuccess = () => {
             setIsSaving(false);
             router.back();
        };

        if (editingRoutineId) {
            updateRoutine(editingRoutineId, routineDraftName, routineSequence, onSuccess);
        } else {
            saveRoutineDraft(routineDraftName, routineSequence, onSuccess);
        }
    }

    // --- Sequence Manipulation ---

    function addDayToSequence(item: any) {
        const newItem = createSequenceItem(item);
        setRoutineSequence((s) => [...s, newItem]);
        setIsAddingDay(false);
    }

    function removeSequenceItem(id: string) {
        setRoutineSequence((s) => s.filter((x) => x.id !== id));
    }
    
    const renderItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
        return (
            <ScaleDecorator activeScale={1.05}>
                <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    activeOpacity={1}
                    className={`bg-surface dark:bg-surface_dark rounded-xl mb-3 overflow-hidden border p-3 flex-row items-center justify-between ${isActive ? 'border-primary dark:border-primary_dark' : 'border-black/5 dark:border-white/10'}`}
                >
                    <View className="flex-row items-center flex-1 mr-2">
                         <View>
                            <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                            <Text className="text-gray-500 dark:text-gray-400 text-sm">
                                {item.type === 'rest' ? 'Rest Day' : 'Workout'}
                            </Text>
                        </View>
                    </View>
                    
                    <View className="flex-row items-center">
                        <TouchableOpacity onPressIn={drag} className="p-2 mr-2"> 
                             <IconSymbol name="line.3.horizontal" size={20} color={theme.icon || '#888'} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); removeSequenceItem(item.id); }} className="p-2"> 
                            <IconSymbol name="trash.fill" size={18} color={theme.options?.destructiveColor || '#ff4444'} />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </ScaleDecorator>
        );
    };

    if (isLoading) {
        return (
            <ThemedView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color={theme.primary} />
            </ThemedView>
        );
    }

    return (
        <ThemedView className="flex-1">
             <View className="flex-row justify-between items-center p-4 border-b border-surface dark:border-white/10 pt-4 android:pt-10">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                     <ThemedText type="link">Cancel</ThemedText>
                </TouchableOpacity>
                <ThemedText type="subtitle">{editingRoutineId ? 'Edit Routine' : 'Create Routine'}</ThemedText>
                <TouchableOpacity disabled={isSaving} onPress={handleSaveRoutine} className="p-2">
                    {isSaving ? <ActivityIndicator size="small" /> : <ThemedText type="link" style={{ fontWeight: 'bold' }}>Save</ThemedText>}
                </TouchableOpacity>
            </View>

            <View className="flex-1">
                <View className="px-4 pt-4">
                    <TextInput 
                        placeholder="Routine Name" 
                        value={routineDraftName} 
                        onChangeText={setRoutineDraftName} 
                        className="bg-surface dark:bg-surface_dark text-apptext dark:text-apptext_dark p-4 rounded-xl text-base border border-transparent dark:border-white/10 mb-6"
                        placeholderTextColor={theme.icon}
                    />
                    
                    <View className="flex-row justify-between items-center mb-6">
                        <ThemedText type="defaultSemiBold">Schedule</ThemedText>
                        <TouchableOpacity onPress={() => setIsAddingDay(true)}>
                            <ThemedText type="link" style={{ fontSize: 16 }}>+ Add Day</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>

                {routineSequence.length === 0 ? (
                    <View className="flex-1 justify-center items-center opacity-50 px-4">
                        <ThemedText className="mb-2 text-lg" style={{ color: theme.icon }}>No days added yet</ThemedText>
                        <TouchableOpacity onPress={() => setIsAddingDay(true)}>
                            <ThemedText type="link" style={{ fontSize: 18 }}>Add Day</ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <DraggableFlatList
                        data={routineSequence}
                        onDragEnd={({ data }) => setRoutineSequence(data)}
                        keyExtractor={(item) => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 6 }}
                        containerStyle={{ flex: 1 }}
                        showsVerticalScrollIndicator={false}
                    />
                )}
                
                {editingRoutineId && (
                    <TouchableOpacity 
                        onPress={() => {
                            Alert.alert('Delete Routine', 'Are you sure?', [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                    text: 'Delete', 
                                    style: 'destructive', 
                                    onPress: () => {
                                        deleteRoutine(editingRoutineId, () => {
                                            router.back();
                                        });
                                    }
                                }
                            ])
                        }} 
                        className="py-3 items-center mt-2 mb-6"
                    >
                        <Text className="text-red-500 font-semibold text-base">Delete Routine</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Add Day Modal */}
            <Modal
                visible={isAddingDay}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsAddingDay(false)}
            >
                <ThemedView className="flex-1">
                    <View className="flex-row items-center justify-between p-4 border-b border-surface dark:border-white/10 pt-4 android:pt-10">
                        <TouchableOpacity onPress={() => setIsAddingDay(false)} className="p-2">
                             <ThemedText type="link">Cancel</ThemedText>
                        </TouchableOpacity>
                        <ThemedText type="subtitle">Add Day</ThemedText>
                        <View style={{ width: 50 }} />
                    </View>
                    
                    <ScrollView className="flex-1 p-4">
                        <ThemedText type="defaultSemiBold" className="mb-3">Options</ThemedText>
                        <TouchableOpacity 
                            onPress={() => addDayToSequence('rest')} 
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
                                    onPress={() => addDayToSequence(workout)}
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
        </ThemedView>
    );
}
