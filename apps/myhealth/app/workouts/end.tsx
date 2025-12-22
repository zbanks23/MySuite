import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ui/ThemedView';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { useWorkoutManager } from '../../hooks/workouts/useWorkoutManager';

export default function EndWorkoutScreen() {
    const router = useRouter();
    const { 
        workoutName, 
        workoutSeconds, 
        exercises, 
        finishWorkout, 
        cancelWorkout,
        sourceWorkoutId 
    } = useActiveWorkout();
    
    const { savedWorkouts, updateSavedWorkout } = useWorkoutManager();

    const completedSetsCount = exercises.reduce((acc, ex) => acc + (ex.completedSets || 0), 0);
    const totalExercises = exercises.length;

    const [notes, setNotes] = React.useState("");

    const areWorkoutsDifferent = (current: typeof exercises, original: typeof exercises) => {
        if (current.length !== original.length) return true;
        for (let i = 0; i < current.length; i++) {
            if (current[i].name !== original[i].name) return true;
            if (current[i].sets !== original[i].sets) return true;
            if (current[i].reps !== original[i].reps) return true;
            // Simplified check for properties
            const p1 = current[i].properties || [];
            const p2 = original[i].properties || [];
            if (p1.length !== p2.length) return true;
            if (p1.some((p, k) => p !== p2[k])) return true;
        }
        return false;
    };

    const handleSave = () => {
        if (sourceWorkoutId) {
            const original = savedWorkouts.find(w => w.id === sourceWorkoutId);
            if (original && areWorkoutsDifferent(exercises, original.exercises)) {
                Alert.alert(
                    "Update Template?",
                    "You've made changes to this workout. Do you want to update the saved template?",
                    [
                        {
                            text: "No, History Only",
                            onPress: () => {
                                finishWorkout(notes);
                                router.dismiss();
                            }
                        },
                        {
                            text: "Yes, Update Template",
                            onPress: () => {
                                // Update template first
                                const updatedExercises = exercises.map(ex => ({
                                    ...ex,
                                    completedSets: 0,
                                    logs: []
                                }));
                                updateSavedWorkout(
                                    sourceWorkoutId, 
                                    original.name, 
                                    updatedExercises, 
                                    () => {
                                        // Then finish
                                        finishWorkout(notes);
                                        router.dismiss();
                                    }
                                );
                            }
                        },
                        {
                            text: "Cancel",
                            style: "cancel"
                        }
                    ]
                );
                return;
            }
        }

        finishWorkout(notes);
        router.dismiss();
    };

    const handleDiscard = () => {
        cancelWorkout();
        router.dismiss();
    };

    // Helper to format time if utils generic doesn't exist
    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        return `${m}m ${s}s`;
    };

    return (
        <ThemedView className="flex-1 p-4">
            <ScreenHeader title="Workout Summary" />
            
            <ScrollView className="flex-1 mt-4">
                <View className="bg-surface dark:bg-surface_dark rounded-xl p-6 mb-6 items-center">
                    <Text className="text-2xl font-bold text-apptext dark:text-apptext_dark mb-2">{workoutName}</Text>
                    <Text className="text-4xl font-black text-primary dark:text-primary_dark mb-4">
                        {formatDuration(workoutSeconds)}
                    </Text>
                    
                    <View className="flex-row gap-8">
                        <View className="items-center">
                            <Text className="text-xl font-bold text-apptext dark:text-apptext_dark">{completedSetsCount}</Text>
                            <Text className="text-gray-500 dark:text-gray-400">Sets</Text>
                        </View>
                        <View className="items-center">
                            <Text className="text-xl font-bold text-apptext dark:text-apptext_dark">{totalExercises}</Text>
                            <Text className="text-gray-500 dark:text-gray-400">Exercises</Text>
                        </View>
                    </View>
                </View>

                <View className="bg-surface dark:bg-surface_dark rounded-xl p-4 mb-6">
                    <Text className="font-semibold text-apptext dark:text-apptext_dark mb-2 text-lg">Notes</Text>
                    <TextInput 
                        className="text-apptext dark:text-apptext_dark min-h-[80px] p-2 border border-black/10 dark:border-white/10 rounded-lg"
                        multiline
                        placeholder="How did it feel?"
                        placeholderTextColor="#9CA3AF"
                        value={notes}
                        onChangeText={setNotes}
                        textAlignVertical="top"
                    />
                </View>

                <View className="bg-surface dark:bg-surface_dark rounded-xl p-4 mb-6">
                    <Text className="font-semibold text-apptext dark:text-apptext_dark mb-4 text-lg">Detailed Summary</Text>
                    {exercises.map((ex, idx) => (
                        <View key={idx} className="flex-row justify-between mb-2">
                             <Text className="text-apptext dark:text-apptext_dark flex-1">{ex.name}</Text>
                             <Text className="text-gray-500 dark:text-gray-400">
                                {ex.completedSets || 0} / {ex.sets} sets
                             </Text>
                        </View>
                    ))}
                </View>
                <View className="gap-3 pb-40">
                     <TouchableOpacity 
                        onPress={handleSave}
                        className="bg-primary dark:bg-primary_dark py-4 rounded-xl items-center"
                    >
                        <Text className="text-white font-bold text-lg">Save Workout</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        onPress={handleDiscard}
                        className="bg-red-500/10 py-4 rounded-xl items-center border border-red-500/20"
                    >
                        <Text className="text-red-500 font-bold text-lg">Discard Workout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </ThemedView>
    );
}
