import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUITheme as useTheme, RaisedButton } from '@mysuite/ui';
import { useWorkoutManager } from '../../hooks/workouts/useWorkoutManager';
import { useFloatingButton } from '../../providers/FloatingButtonContext';
import { useRoutineDraft } from '../../hooks/routines/useRoutineDraft';
import { RoutineDraftItem } from '../../components/routines/RoutineDraftItem';
import { AddDayModal } from '../../components/routines/AddDayModal';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BackButton } from '../../components/ui/BackButton';
import { IconSymbol } from '../../components/ui/icon-symbol';

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
    
    const {
        routineSequence,
        setRoutineSequence,
        addDay,
        removeDay
    } = useRoutineDraft([]);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Add Day State
    const [isAddingDay, setIsAddingDay] = useState(false);

    // Initialize
    useEffect(() => {
        if (editingRoutineId) {
            const routine = routines.find((r: any) => r.id === editingRoutineId);
            if (routine) {
                setRoutineDraftName(routine.name);
                setRoutineSequence(routine.sequence ? JSON.parse(JSON.stringify(routine.sequence)) : []);
                setHasInitialized(true);
                setIsLoading(false);
            } else if (routines.length > 0 && !hasInitialized) {
                // If we've loaded routines but ours isn't there and we haven't initialized yet,
                // then it's actually missing. If we HAVE initialized, it was probably just deleted.
                Alert.alert("Error", "Routine not found");
                router.back();
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, [editingRoutineId, routines, router, setRoutineSequence, hasInitialized]);

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

    function handleAddDay(item: any) {
        addDay(item);
        setIsAddingDay(false);
    }
    
    const renderItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
        return (
            <RoutineDraftItem
                item={item}
                drag={drag}
                isActive={isActive}
                onRemove={() => removeDay(item.id)}
            />
        );
    };

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center bg-light dark:bg-dark">
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-light dark:bg-dark">
             <ScreenHeader
                title={editingRoutineId ? 'Edit Routine' : 'Create Routine'}
                leftAction={<BackButton />}
                rightAction={
                    <RaisedButton 
                        onPress={handleSaveRoutine} 
                        disabled={isSaving} 
                        className="w-10 h-10 p-0 rounded-full bg-light-lighter dark:bg-dark-lighter" 
                        variant="default"
                        borderRadius={20}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <IconSymbol name="checkmark" size={24} color={theme.primary} />
                        )}
                    </RaisedButton>
                }
            />

            <View className="flex-1">
                <View className="mt-28 px-4 pt-4">
                    <TextInput 
                        placeholder="Routine Name" 
                        value={routineDraftName} 
                        onChangeText={setRoutineDraftName} 
                        className="bg-light-lighter dark:bg-dark-lighter text-light dark:text-dark p-4 rounded-xl text-base border border-transparent dark:border-highlight-dark mb-6"
                        placeholderTextColor={theme.textMuted || '#888'}
                    />
                    
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-base leading-6 font-semibold text-light dark:text-dark">Schedule</Text>
                        <RaisedButton 
                            onPress={() => setIsAddingDay(true)}
                            title="Add Day"
                            textClassName="text-sm text-primary font-semibold px-3"
                            borderRadius={20}
                            className="h-9"
                        />
                    </View>
                </View>
                {routineSequence.length === 0 ? (
                    <View className="items-center opacity-80 px-4">
                        <Text className="text-lg text-light-muted dark:text-dark-muted">No days added yet</Text>
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
                                         deleteRoutine(editingRoutineId, {
                                             skipConfirmation: true,
                                             onSuccess: () => {
                                                 router.back();
                                             }
                                         });
                                     }
                                }
                            ])
                        }} 
                        className="py-3 items-center mt-2 mb-6"
                    >
                        <Text className="text-danger font-semibold text-base">Delete Routine</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Add Day Modal */}
            <AddDayModal
                visible={isAddingDay}
                onClose={() => setIsAddingDay(false)}
                onAddRestDay={() => handleAddDay('rest')}
                onAddWorkout={handleAddDay}
                savedWorkouts={savedWorkouts}
            />
        </View>
    );
}
