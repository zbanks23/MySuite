import React, {useState} from "react";
import {
 	View,
 	Text,
 	FlatList,
 	TouchableOpacity,
 	Alert,
    ScrollView
} from "react-native";

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// import { useUITheme as useTheme } from '@mycsuite/ui'; // Unused now
import { useWorkoutManager } from '../../hooks/useWorkoutManager';



import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { RoutineCard } from '../../components/workouts/RoutineCard';
import { ActiveRoutineCard } from '../../components/workouts/ActiveRoutineCard';

// import { useFloatingButton } from '../../providers/FloatingButtonContext'; // Unused now



export default function Workout() {

	// const theme = useTheme(); // Unused
	const router = useRouter();
    // const { setIsHidden } = useFloatingButton(); // Unused
    
	// consume shared state
    const {

        startWorkout,
        finishWorkout,
        cancelWorkout,
        hasActiveSession,
    } = useActiveWorkout();

    const handleStartEmpty = () => {
        if (hasActiveSession) {
            Alert.alert(
                "Active Workout",
                "You have an active workout. What would you like to do?",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Stop Current",
                        onPress: () => finishWorkout()
                    },
                    {
                        text: "Replace",
                        style: "destructive",
                        onPress: () => {
                            cancelWorkout();
                            // Small timeout to ensure state clears before starting new
                            setTimeout(() => startWorkout([]), 100);
                        }
                    }
                ]
            );
        } else {
            startWorkout([]);
        }
    };



    const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);


    

    
    const { 
        savedWorkouts, 
        routines, 
        activeRoutine,
        startActiveRoutine,
        markRoutineDayComplete,
        clearActiveRoutine,
    } = useWorkoutManager();







    
    // Derived state for current routine
    const activeRoutineObj = routines.find(r => r.id === activeRoutine?.id);
    const dayIndex = activeRoutine?.dayIndex || 0;
    const timelineDays = activeRoutineObj?.sequence?.slice(dayIndex, dayIndex + 7) || [];
    
    // Check if the current day has been completed today
    const isDayCompleted = !!(activeRoutine?.lastCompletedDate && 
        new Date(activeRoutine.lastCompletedDate).toDateString() === new Date().toDateString());


    function handleCreateRoutine() {
        router.push('/create-routine');
    }

    function handleEditRoutine(routine: any) {
        router.push({ pathname: '/create-routine', params: { id: routine.id } });
    }






    const handleStartSavedWorkout = (workout: any) => {
        if (hasActiveSession) {
             Alert.alert(
                "Active Workout",
                "You have an active workout. What would you like to do?",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Stop Current",
                        onPress: () => finishWorkout()
                    },
                    {
                        text: "Replace",
                        style: "destructive",
                        onPress: () => {
                            cancelWorkout();
                            // Small timeout to ensure state clears before starting new
                            setTimeout(() => startWorkout(workout.exercises), 100);
                        }
                    }
                ]
            );
        } else {
            startWorkout(workout.exercises);
        }
    };

    function handleCreateSavedWorkout() {
        router.push('/create-workout');
    }

    function handleEditSavedWorkout(workout: any) {
        router.push({ pathname: '/create-workout', params: { id: workout.id } });
    }

	return (
		<SafeAreaView className="flex-1 bg-background dark:bg-background_dark" edges={['top', 'left', 'right']}>
			<View className="flex-1 px-4 pt-4">
				<View className="flex-row justify-between items-center">
					<Text className="text-2xl font-bold text-apptext dark:text-apptext_dark">Workout</Text>
				</View>

			{/* Dashboard: Routines & Saved Workouts */}
			<ScrollView 
				className="flex-1 mt-3"
				contentContainerStyle={{paddingBottom: 120, flexGrow: 1}}
				showsVerticalScrollIndicator={false}
			>
				{/* Controls Row */}
				<View className="flex-row gap-2 my-3">
					<TouchableOpacity className="flex-1 mr-0 p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark" onPress={handleStartEmpty} accessibilityLabel="Start empty workout">
						<Text className="text-apptext dark:text-apptext_dark">Start Empty</Text>
					</TouchableOpacity>
					<TouchableOpacity className="flex-1 mr-0 p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark" onPress={() => router.push('/workout-history' as any)} accessibilityLabel="History">
						<Text className="text-apptext dark:text-apptext_dark">History</Text>
					</TouchableOpacity>
				</View>
					
                    {/* Saved Workouts Section (Quick Access) */}
                    <View className="flex-row justify-between items-center mb-3">
                         <Text className="text-lg font-semibold mb-2 text-apptext dark:text-apptext_dark">Saved Workouts</Text>
                         <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={handleCreateSavedWorkout}>
                                <Text className="text-primary dark:text-primary_dark">+ New</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/saved-workouts')}>
                                <Text className="text-primary dark:text-primary_dark">See All</Text>
                            </TouchableOpacity>
                         </View>
                    </View>
                     {savedWorkouts.length === 0 ? (
                        <View className="p-4 items-center justify-center border border-dashed border-surface dark:border-surface_dark rounded-xl">
                            <Text className="text-gray-500 dark:text-gray-400 mb-2">No saved workouts.</Text>
                            <TouchableOpacity onPress={handleCreateSavedWorkout} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark">
                                <Text className="text-apptext dark:text-apptext_dark">Create a Workout</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
						<FlatList
							data={savedWorkouts}
							scrollEnabled={false}
							keyExtractor={(i) => i.id}
							renderItem={({item}) => {
                                const isExpanded = expandedWorkoutId === item.id;
                                return (
								<View 
									className="bg-surface dark:bg-surface_dark rounded-xl mb-3 border border-black/5 dark:border-white/10 shadow-sm overflow-hidden"
								>
                                    <View className={`flex-row justify-between items-center p-4 ${isExpanded ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
                                        <TouchableOpacity 
                                            className="flex-1 mr-2"
                                            onPress={() => setExpandedWorkoutId(isExpanded ? null : item.id)}
                                        >
                                            <Text className="font-semibold text-apptext dark:text-apptext_dark text-lg mb-1" numberOfLines={1}>{item.name}</Text>
                                            <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.exercises?.length || 0} Exercises</Text>
                                        </TouchableOpacity>
                                        
                                        <View className="flex-row items-center gap-2">
                                            <TouchableOpacity 
                                                onPress={() => {
                                                    handleEditSavedWorkout(item);
                                                }}
                                                className="bg-primary/10 dark:bg-primary/20 px-4 py-2 rounded-lg"
                                            >
                                                <Text className="text-primary dark:text-primary_dark font-semibold">Edit</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity 
                                                onPress={() => handleStartSavedWorkout(item)}
                                                className="bg-primary dark:bg-primary_dark px-4 py-2 rounded-lg"
                                            >
                                                <Text className="text-white font-semibold">Start</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    
                                    {isExpanded && (
                                        <View className="bg-background/50 dark:bg-background_dark/50 px-4 py-2">
                                            {item.exercises && item.exercises.length > 0 ? (
                                                item.exercises.map((ex: any, idx: number) => (
                                                    <View key={idx} className="py-2 flex-row justify-between border-b border-black/5 dark:border-white/5 last:border-0">
                                                        <Text className="text-apptext dark:text-apptext_dark font-medium">{ex.name}</Text>
                                                        <Text className="text-gray-500 dark:text-gray-400 text-sm">{ex.sets} x {ex.reps}</Text>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text className="text-gray-500 dark:text-gray-400 py-2 italic text-center">No exercises</Text>
                                            )}
                                        </View>
                                    )}
								</View>
							)}}
						/>
                    )}

                    <View className="h-6" />

                    {/* Active Routine Section */}
                    {activeRoutineObj ? (
                        <ActiveRoutineCard
                            activeRoutineObj={activeRoutineObj}
                            timelineDays={timelineDays}
                            dayIndex={dayIndex}
                            isDayCompleted={isDayCompleted}
                            onClearRoutine={clearActiveRoutine}
                            onStartWorkout={(exercises) => startWorkout(exercises)}
                            onMarkComplete={markRoutineDayComplete}
                        />
                    ) : (
                        <View className="mb-6">
                            <View className="flex-row justify-between items-center mb-3">
                                <Text className="text-lg font-semibold mb-2 text-apptext dark:text-apptext_dark">Active Routine</Text>
                            </View>
                            <View className="bg-surface dark:bg-surface_dark rounded-xl p-4 border border-black/5 dark:border-white/10 shadow-sm">
                                <View className="p-5 items-center">
                                    <Text className="text-base font-semibold text-apptext dark:text-apptext_dark mb-2">
                                        No active routine
                                    </Text>
                                    <Text className="text-gray-500 dark:text-gray-400 text-center mb-4">
                                        Select a routine below to start tracking your progress.
                                    </Text>
                                    <TouchableOpacity onPress={() => router.push('/routines' as any)} className="p-2.5 rounded-lg bg-primary dark:bg-primary_dark">
                                        <Text className="text-white font-semibold">Choose Routine</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Routines Section */}
                    <View className="flex-row justify-between items-center mb-3 mt-6">
                        <Text className="text-lg font-semibold mb-2 text-apptext dark:text-apptext_dark">My Routines</Text>
                         <View className="flex-row items-center gap-4">
                            <TouchableOpacity onPress={handleCreateRoutine}>
                                <Text className="text-primary dark:text-primary_dark">+ New</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.push('/routines')}>
                                <Text className="text-primary dark:text-primary_dark">See All</Text>
                            </TouchableOpacity>
                         </View>
                    </View>
                    
                    {routines.length === 0 ? (
                        <View className="p-4 items-center justify-center border border-dashed border-surface dark:border-surface_dark rounded-xl">
                            <Text className="text-gray-500 dark:text-gray-400 mb-2">No routines yet.</Text>
                            <TouchableOpacity onPress={handleCreateRoutine} className="p-2.5 rounded-lg border border-surface dark:border-surface_dark bg-background dark:bg-background_dark">
                                <Text className="text-apptext dark:text-apptext_dark">Create a Routine</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={routines.slice(0, 5)}
                            scrollEnabled={false}
                            keyExtractor={(i) => i.id}
                            renderItem={({item}) => (
                                <RoutineCard 
                                    routine={item} 
                                    onPress={() => startActiveRoutine(item.id)}
                                    onEdit={() => handleEditRoutine(item)}
                                />
                            )}
                        />
                    )}
                    
			</ScrollView>
			</View>











		</SafeAreaView>

	);
}



