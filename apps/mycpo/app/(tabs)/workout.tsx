import React, {useState, useRef} from "react";
import {
 	View,
 	Text,
 	FlatList,
 	TouchableOpacity,
 	Alert,
    ScrollView,
    useWindowDimensions
} from "react-native";

import { ThemedView } from '../../components/ui/ThemedView';
import { useRouter } from 'expo-router';
// import { useUITheme as useTheme } from '@mycsuite/ui'; // Unused now
import { useWorkoutManager } from '../../hooks/useWorkoutManager';

import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { RoutineCard } from '../../components/workouts/RoutineCard';
import { ActiveRoutineCard } from '../../components/workouts/ActiveRoutineCard';

// import { useFloatingButton } from '../../providers/FloatingButtonContext'; // Unused now

import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { 
    useAnimatedStyle, 
    useAnimatedReaction, 
    runOnJS, 
    interpolate, 
    Extrapolation, 
    SharedValue,
    useSharedValue
} from 'react-native-reanimated';
import { IconSymbol } from '../../components/ui/icon-symbol';
import * as Haptics from 'expo-haptics';

import { ScreenHeader } from '../../components/ui/ScreenHeader';

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
        deleteSavedWorkout,
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

    // Actions component that monitors drag distance
    const RightAction = ({ 
        dragX, 
        progress, 
        onDelete,
        onEdit,
        onSetReadyToDelete
    }: { 
        dragX: SharedValue<number>; 
        progress: SharedValue<number>;
        onDelete: () => void;
        onEdit: () => void;
        onSetReadyToDelete: (ready: boolean) => void;
    }) => {
        const { width } = useWindowDimensions();
        const hasTriggered = useSharedValue(false);
        // Trigger when card is swiped past 45% of screen width (less strict than 50%)
        // dragX is negative when swiping left
        const TRIGGER_THRESHOLD = -width * 0.45;
        
        const BUTTON_HEIGHT = 40; 
        const GAP = 10; // Between buttons
        const MARGIN = 20; // Right edge margin
        const CARD_GAP = 10; // Padding from the card
        
        // Layout width for TWO buttons + all spacing
        const LAYOUT_WIDTH = (BUTTON_HEIGHT * 2) + GAP + MARGIN + CARD_GAP;

        // Monitor drag value to trigger haptic feedback on long swipe
        useAnimatedReaction(
            () => dragX.value,
            (currentDrag) => {
                if (currentDrag < TRIGGER_THRESHOLD && !hasTriggered.value) {
                    hasTriggered.value = true;
                    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Medium);
                    // Mark parent as ready to delete
                    runOnJS(onSetReadyToDelete)(true);
                } else if (currentDrag > TRIGGER_THRESHOLD + 40 && hasTriggered.value) {
                    hasTriggered.value = false;
                    // Unmark if user swipes back
                    runOnJS(onSetReadyToDelete)(false);
                }
            }
        );

        // Delete Button (Red Blob) Animation
        const deleteStyle = useAnimatedStyle(() => {
            const drag = dragX.value;
            const absDrag = Math.abs(drag);
            
            let w = BUTTON_HEIGHT;
            let borderRadius = BUTTON_HEIGHT / 2;
            
            // Only expand if we are dragging PAST the trigger threshold (deep swipe)
            // or at least past the layout width significantly.
            // We want the red blob to stay 50px wide while the user sees both buttons.
            
            // If drag is deeper than the layout width + a buffer, start expanding
            const EXPANSION_START = LAYOUT_WIDTH + 10;
            
            if (absDrag > EXPANSION_START) {
                // We are pulling past the buttons
                // But we mainly want to fill the space if we are deleting.
                
                // Let's make it expand only when we get close to the trigger
                // TRIGGER_THRESHOLD is negative (e.g. -160).
                // drag is negative.
                
                if (drag < TRIGGER_THRESHOLD + 20) {
                     w = Math.max(absDrag - MARGIN, BUTTON_HEIGHT);
                }
            }

            const scale = interpolate(
                drag,
                [-50, 0], // Quick pop in
                [1, 0], 
                Extrapolation.CLAMP
            );

            // Fade in
            const opacity = interpolate(
                drag,
                [-50, -10],
                [1, 0],
                Extrapolation.CLAMP
            );
            
            // Ensure Edit button stays visible/clickable unless we are definitely deleting
            const isDeleting = drag < TRIGGER_THRESHOLD;

            return {
                width: w, 
                height: BUTTON_HEIGHT,
                borderRadius: borderRadius, 
                transform: [{ scale }],
                opacity,
                zIndex: isDeleting ? 10 : 0, 
            };
        });

        // Edit Button Animation
        const editStyle = useAnimatedStyle(() => {
            const drag = dragX.value;
            // Staggered animation: Edit appears AFTER delete is mostly visible
            // Delete appears 0 -> -50.
            // Edit should appear -50 -> -110 approx.
            
             const scale = interpolate(
                drag,
                [-110, -50], 
                [1, 0], 
                Extrapolation.CLAMP
            );
            const opacity = interpolate(
                drag,
                [-110, -60],
                [1, 0],
                Extrapolation.CLAMP
            );
            
            const isDeleting = drag < TRIGGER_THRESHOLD;

            return {
                transform: [{ scale }],
                opacity: isDeleting ? 0 : opacity,
            };
        });
        
        const deleteIconStyle = useAnimatedStyle(() => {
             const scale = interpolate(
                dragX.value,
                [-50, 0],
                [1, 0.5],
                Extrapolation.CLAMP
            );
            return { transform: [{ scale }] };
        });

        const deleteTextStyle = useAnimatedStyle(() => {
             const scale = interpolate(
                dragX.value,
                [-50, 0],
                [1, 0], 
                Extrapolation.CLAMP
            );
            const opacity = interpolate(
                dragX.value,
                [-50, -20],
                [1, 0],
                Extrapolation.CLAMP
            );
            return {
                opacity,
                transform: [{ scale }]
            };
        });

        return (
            <View style={{ width: LAYOUT_WIDTH, height: '100%', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}>
                 
                 {/* Gap from Card */}
                 <View style={{ width: CARD_GAP }} />

                 {/* Edit Button Wrapper */}
                 <View style={{ marginRight: GAP, alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.View style={[editStyle]} className="justify-center items-center">
                        <TouchableOpacity 
                            onPress={onEdit} 
                            activeOpacity={0.8}
                            style={{ 
                                width: BUTTON_HEIGHT, 
                                height: BUTTON_HEIGHT, 
                                borderRadius: BUTTON_HEIGHT/2, 
                                backgroundColor: '#2563eb', // blue-600 (Primary)
                                justifyContent: 'center', 
                                alignItems: 'center',
                            }}
                            className="bg-primary dark:bg-primary_dark"
                        >
                            <IconSymbol name="pencil" size={18} color="white" />
                        </TouchableOpacity>
                        <Animated.Text className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold mt-1">
                            Edit
                        </Animated.Text>
                    </Animated.View>
                 </View>

                 {/* Delete Button Wrapper */}
                <View style={{ marginRight: MARGIN, alignItems: 'center' }}>
                    <Animated.View 
                        className="bg-red-500 justify-center items-center" 
                        style={[deleteStyle, { position: 'absolute', right: 0 }]} 
                    >
                         <View style={{ width: BUTTON_HEIGHT, height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                            <TouchableOpacity onPress={onDelete} activeOpacity={0.8}>
                                <Animated.View style={[deleteIconStyle]}>
                                    <IconSymbol name="trash.fill" size={16} color="white" />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                    
                    {/* Placeholder for layout */}
                     <View style={{ width: BUTTON_HEIGHT, height: BUTTON_HEIGHT }} pointerEvents="none" />
                     
                    <Animated.Text 
                        className="text-gray-500 dark:text-gray-400 text-[10px] font-semibold mt-1"
                        style={[deleteTextStyle]} 
                    >
                        Trash
                    </Animated.Text>
                </View>
            </View>
        );
    };

    const SavedWorkoutItem = ({ 
        item, 
        isExpanded, 
        onPress, 
        onEdit, 
        onStart,
        onDelete 
    }: { 
        item: any, 
        isExpanded: boolean, 
        onPress: () => void, 
        onEdit: () => void, 
        onStart: () => void,
        onDelete: () => void
    }) => {
        // Track if we are deep enough to delete
        const shouldDelete = useRef(false);

        // Callback to update the ref from the shared value listener
        const setReadyToDelete = (ready: boolean) => {
            shouldDelete.current = ready;
        };

        return (
            <Swipeable
                renderRightActions={(progress, dragX) => (
                    <RightAction 
                        dragX={dragX} 
                        progress={progress} 
                        onDelete={onDelete} 
                        onEdit={onEdit}
                        onSetReadyToDelete={setReadyToDelete}
                    />
                )}
                overshootRight={true} // Allow overshooting to swipe fully
                friction={2}
                rightThreshold={40} // Easy to open (Reveal threshold)
                onSwipeableWillOpen={() => {
                    // Trigger delete ONLY if we dragged past the deep threshold
                    if (shouldDelete.current) {
                        onDelete();
                    }
                    // If not deep enough, it just opens (revealing the button)
                }}
                containerStyle={{ overflow: 'visible' }}
            >
                <TouchableOpacity 
                    onPress={onPress}
                    activeOpacity={0.9}
                    className="bg-surface dark:bg-surface_dark rounded-xl border border-black/5 dark:border-white/10 shadow-sm overflow-hidden"
                >
                    <View className={`flex-row justify-between items-center p-3 ${isExpanded ? 'border-b border-black/5 dark:border-white/10' : ''}`}>
                        <TouchableOpacity 
                            className="flex-1 mr-2"
                            onPress={onPress}
                        >
                            <Text className="font-semibold text-apptext dark:text-apptext_dark text-lg mb-1" numberOfLines={1}>{item.name}</Text>
                            <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.exercises?.length || 0} Exercises</Text>
                        </TouchableOpacity>
                        
                        <View className="flex-row items-center gap-2">
                            <TouchableOpacity 
                                onPress={onStart}
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
                </TouchableOpacity>
            </Swipeable>
        );
    };

	return (
		<ThemedView className="flex-1 p-4">
			<ScreenHeader title="Workout" />

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
                            ItemSeparatorComponent={() => <View className="h-3" />}
							renderItem={({item}) => {
                                const isExpanded = expandedWorkoutId === item.id;
                                return (
                                    <SavedWorkoutItem
                                        item={item}
                                        isExpanded={isExpanded}
                                        onPress={() => setExpandedWorkoutId(isExpanded ? null : item.id)}
                                        onEdit={() => handleEditSavedWorkout(item)}
                                        onStart={() => handleStartSavedWorkout(item)}
                                        onDelete={() => deleteSavedWorkout(item.id, { skipConfirmation: true })}
                                    />
                                );
                            }}
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
			</ThemedView>
	);
}