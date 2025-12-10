"use client"

import React, {useState} from "react";
import {
 	View,
 	Text,
 	StyleSheet,
 	FlatList,
 	TouchableOpacity,
 	Modal,
 	TextInput,
 	Alert,
 	ActivityIndicator,
    ScrollView
} from "react-native";

import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUITheme as useTheme } from '@mycsuite/ui';
import { useWorkoutManager } from '../../hooks/useWorkoutManager';

import { 
    createSequenceItem, 
    reorderSequence, 
} from '../../utils/workout-logic';

import { useActiveWorkout } from '../../providers/ActiveWorkoutProvider';
import { RoutineCard } from '../../components/workouts/RoutineCard';

// --- Component ---

export default function Workout() {

	const theme = useTheme();
	const router = useRouter();
    
	// consume shared state
    const {
        setExercises,
        isRunning,
        startWorkout,
        pauseWorkout,
        hasActiveSession
    } = useActiveWorkout();


	const [isLoadModalOpen, setLoadModalOpen] = useState(false);
	const [isCreateRoutineOpen, setCreateRoutineOpen] = useState(false);
	const [routineDraftName, setRoutineDraftName] = useState("");
	const [routineSequence, setRoutineSequence] = useState<any[]>([]);
	const [isWorkoutsListOpen, setWorkoutsListOpen] = useState(false);
    
    const { 
        savedWorkouts, 
        routines, 
        isSaving, 
        
        activeRoutine,
        startActiveRoutine,
        markRoutineDayComplete,
        clearActiveRoutine,
 
        deleteSavedWorkout, 
        saveRoutineDraft: saveRoutineDraftManager, 
        deleteRoutine 
    } = useWorkoutManager();


	function loadWorkout(id: string) {
        // Allow loading even if not "active" session (but might have default exercises)
        if (hasActiveSession) {
            Alert.alert(
                "Active Session", 
                "Please finish or cancel your current workout before loading a new one.",
                [
                    { text: "OK" }
                ]
            );
            return;
        }

		const w = savedWorkouts.find((x) => x.id === id);
		if (!w) return;
		setExercises(w.exercises || []);
		setWorkoutsListOpen(false);
		Alert.alert('Loaded', `Workout '${w.name}' loaded.`);
	}

	function handleSetRoutine(id: string) {
        if (hasActiveSession) {
            Alert.alert("Active Session", "Please finish or cancel your current workout before setting a new routine.");
            return;
        }
        
        const r = routines.find((x) => x.id === id);
        if (!r) return;

        // confirm
        Alert.alert(
            "Set Routine",
            `Do you want to set '${r.name}' as your current routine?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Set", 
                    onPress: () => {
                        startActiveRoutine(id);
                        // Load day 1
                        if (r.sequence && r.sequence.length > 0) {
                            const first = r.sequence[0];
                            if (first.type === 'workout' && first.workout) {
                                setExercises(first.workout.exercises || []);
                            }
                        }
                    }
                }
            ]
        );
	}
    
    // Derived state for current routine
    const activeRoutineObj = routines.find(r => r.id === activeRoutine?.id);
    const dayIndex = activeRoutine?.dayIndex || 0;
    const timelineDays = activeRoutineObj?.sequence?.slice(dayIndex, dayIndex + 7) || [];
    
    // Check if the current day has been completed today
    const isDayCompleted = !!(activeRoutine?.lastCompletedDate && 
        new Date(activeRoutine.lastCompletedDate).toDateString() === new Date().toDateString());


	async function saveRoutineDraft() {
		saveRoutineDraftManager(routineDraftName, routineSequence, () => {
			setRoutineDraftName("");
			setRoutineSequence([]);
			setCreateRoutineOpen(false);
		});
	}

	function addDayToSequence(item: any) {
		const newItem = createSequenceItem(item);
		setRoutineSequence((s) => [...s, newItem]);
	}

	function moveSequenceItem(index: number, dir: -1 | 1) {
		setRoutineSequence((s) => reorderSequence(s, index, dir));
	}

	function removeSequenceItem(id: string) {
		setRoutineSequence((s) => s.filter((x) => x.id !== id));
	}

    function handleStartWorkout() {
        startWorkout();
    }


	const styles = makeStyles(theme);

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>Workout</Text>

			</View>

			<View style={styles.controlsRow}>


				{!isRunning ? (
					<TouchableOpacity style={styles.controlButtonPrimary} onPress={handleStartWorkout} accessibilityLabel="Start workout">
						<Text style={styles.controlTextPrimary}>Start</Text>
					</TouchableOpacity>
				) : (
					<TouchableOpacity style={styles.controlButton} onPress={pauseWorkout} accessibilityLabel="Pause workout">
						<Text style={styles.controlText}>Pause</Text>
					</TouchableOpacity>
				)}

				<TouchableOpacity style={styles.controlButton} onPress={() => router.push('/workout-history' as any)} accessibilityLabel="History">
					<Text style={styles.controlText}>History</Text>
				</TouchableOpacity>
			</View>

			{/* Dashboard: Routines & Saved Workouts (Visible when inactive) */}
			{!hasActiveSession && (
				<ScrollView 
                    style={styles.dashboardContainer} 
                    contentContainerStyle={{paddingBottom: 40, flexGrow: 1}}
                    showsVerticalScrollIndicator={false}
                >
					
                    {/* Active Routine Section */}
                    {activeRoutineObj && (
                        <View style={{marginBottom: 24}}>
                             <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Active Routine - {activeRoutineObj.name}</Text>
                                <TouchableOpacity onPress={clearActiveRoutine}>
                                    <Text style={{color: theme.icon, fontSize: 12}}>Exit</Text>
                                </TouchableOpacity>
                            </View>
                            
                            <View style={styles.activeRoutineCard}>
                                {timelineDays.length === 0 ? (
                                    <View style={{padding: 20, alignItems: 'center'}}>
                                        <Text style={{fontSize: 18, fontWeight: '600', color: theme.primary, marginBottom: 8}}>Routine Completed!</Text>
                                        <Text style={{color: theme.icon, textAlign: 'center'}}>You have finished all days in this routine.</Text>
                                        <TouchableOpacity onPress={clearActiveRoutine} style={[styles.controlButton, {marginTop: 16}]}>
                                            <Text style={styles.controlText}>Close Routine</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={{paddingVertical: 8}}>
                                        {timelineDays.map((item: any, index: number) => {
                                            const isToday = index === 0;
                                            const isLast = index === timelineDays.length - 1;
                                            const globalDayNum = dayIndex + index + 1;
                                            const isCompletedToday = isToday && isDayCompleted;
                                            
                                            // Colors
                                            const dotColor = isCompletedToday 
                                                ? '#4CAF50' // Success Green 
                                                : (isToday ? theme.primary : theme.surface);
                                            
                                            return (
                                                <View key={index} style={{flexDirection: 'row'}}>
                                                    {/* Timeline Column */}
                                                    <View style={{width: 30, alignItems: 'center'}}>
                                                        <View style={{
                                                            width: 14, 
                                                            height: 14, 
                                                            borderRadius: 7, 
                                                            backgroundColor: dotColor,
                                                            borderWidth: isToday && !isCompletedToday ? 0 : 2,
                                                            borderColor: isToday ? dotColor : (theme.options?.borderColor || 'rgba(150,150,150,0.3)'),
                                                            zIndex: 2,
                                                            marginTop: 4
                                                        }} />
                                                        {/* Line - Alway show to create bar effect */}
                                                        <View style={{
                                                            width: 2, 
                                                            flex: 1, 
                                                            backgroundColor: theme.surface, 
                                                            marginVertical: -2,
                                                            zIndex: 1
                                                        }} />
                                                        {/* End Indicator if this is the last day of routine */}
                                                        {(index === timelineDays.length - 1 && globalDayNum === activeRoutineObj.sequence.length) && (
                                                             <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: theme.surface, marginTop: -4, zIndex: 2}} />
                                                        )}
                                                    </View>
                                                    
                                                    {/* Content Column */}
                                                    <View style={{flex: 1, paddingBottom: isLast ? 0 : 24, paddingLeft: 8}}>
                                                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                                                            <Text style={{
                                                                fontWeight: isToday ? '700' : '500', 
                                                                fontSize: isToday ? 18 : 16,
                                                                color: isCompletedToday ? theme.icon : (isToday ? theme.text : theme.icon),
                                                                textDecorationLine: isCompletedToday ? 'line-through' : 'none',
                                                                flex: 1,
                                                                marginRight: 8
                                                            }}>
                                                                {item.type === 'rest' ? 'Rest Day' : (item.name || "Unknown Workout")}
                                                            </Text>
                                                            {isToday && !isCompletedToday && (
                                                                <View style={{backgroundColor: theme.surface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4}}>
                                                                    <Text style={{fontSize: 10, color: theme.icon, fontWeight: '700'}}>TODAY</Text>
                                                                </View>
                                                            )}
                                                            {isCompletedToday && (
                                                                <View style={{backgroundColor: 'rgba(76, 175, 80, 0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4}}>
                                                                    <Text style={{fontSize: 10, color: '#4CAF50', fontWeight: '700'}}>DONE</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        
                                                        {/* Actions for Today */}
                                                        {isToday && !isCompletedToday && (
                                                            <View style={{flexDirection: 'row', gap: 12, marginTop: 8}}>
                                                                <TouchableOpacity 
                                                                    style={[styles.controlButtonPrimary, {flex: 1, alignItems: 'center', justifyContent: 'center'}]}
                                                                    onPress={() => {
                                                                        if (item?.type === 'workout' && item.workout) {
                                                                            setExercises(item.workout.exercises || []);
                                                                            Alert.alert("Loaded", "Workout loaded. Press Start below when ready!");
                                                                        } else {
                                                                             Alert.alert("Rest Day", "Enjoy your rest!", [
                                                                                 { text: "Mark Complete", onPress: () => markRoutineDayComplete() }
                                                                             ]);
                                                                        }
                                                                    }}
                                                                >
                                                                    <Text style={styles.controlTextPrimary}>
                                                                        {item?.type === 'rest' ? 'Mark Complete' : 'Load Workout'}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                                
                                                                <TouchableOpacity 
                                                                    style={[styles.controlButton, {paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center'}]}
                                                                    onPress={() => markRoutineDayComplete()}
                                                                >
                                                                    <Text style={styles.controlText}>Skip</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        </View>
                    )}

                    {/* Routines Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>My Routines</Text>
                        <TouchableOpacity onPress={() => setCreateRoutineOpen(true)}>
                            <Text style={{color: theme.primary}}>+ New</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {routines.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={{color: theme.icon, marginBottom: 8}}>No routines yet.</Text>
                            <TouchableOpacity onPress={() => setCreateRoutineOpen(true)} style={styles.controlButton}>
                                <Text style={styles.controlText}>Create a Routine</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <FlatList
                            data={routines}
                            scrollEnabled={false}
                            keyExtractor={(i) => i.id}
                            renderItem={({item}) => (
                                <RoutineCard 
                                    routine={item} 
                                    onPress={() => handleSetRoutine(item.id)}
                                    onLongPress={() => deleteRoutine(item.id)}
                                    onDelete={() => deleteRoutine(item.id)}
                                />
                            )}
                        />
                    )}

                    {/* Saved Workouts Section (Quick Access) */}
                    <View style={[styles.sectionHeader, {marginTop: 24}]}>
                         <Text style={styles.sectionTitle}>Saved Workouts</Text>
                         <TouchableOpacity onPress={() => setWorkoutsListOpen(true)}>
                            <Text style={{color: theme.primary}}>See All</Text>
                        </TouchableOpacity>
                    </View>
                     {savedWorkouts.length === 0 ? (
                        <Text style={{color: theme.icon}}>No saved workouts.</Text>
                    ) : (
                        <FlatList
                            data={savedWorkouts.slice(0, 5)} // Show top 5
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{paddingRight: 16}}
                            keyExtractor={(i) => i.id}
                            renderItem={({item}) => (
                                <TouchableOpacity 
                                    style={styles.workoutCard} 
                                    onPress={() => loadWorkout(item.id)}
                                    onLongPress={() => deleteSavedWorkout(item.id)}
                                >
                                    <Text style={styles.workoutCardTitle} numberOfLines={2}>{item.name}</Text>
                                    <Text style={{color: theme.icon, fontSize: 12}}>{item.exercises?.length || 0} Exercises</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}
                    
				</ScrollView>
			)}

			{/* Saved Workouts modal */}
			<Modal visible={isWorkoutsListOpen} animationType="slide" transparent={true}>
				<View style={styles.modalBackdrop}>
					<View style={[styles.modalCard, {maxHeight: '80%'}]}>
						<Text style={styles.modalTitle}>Saved Workouts</Text>
						{savedWorkouts.length === 0 ? (
							<Text style={{color: theme.icon}}>No saved workouts</Text>
						) : (
							<FlatList
								data={savedWorkouts}
								keyExtractor={(i) => i.id}
								renderItem={({item}) => (
									<View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8}}>
										<View>
											<Text style={{color: theme.text, fontWeight: '600'}}>{item.name}</Text>
											<Text style={{color: theme.icon, fontSize: 12}}>{new Date(item.createdAt).toLocaleString()}</Text>
										</View>
										<View style={{flexDirection: 'row'}}>
											<TouchableOpacity onPress={() => loadWorkout(item.id)} style={[styles.controlButton, {marginRight: 8}]}> 
												<Text style={styles.controlText}>Load</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => deleteSavedWorkout(item.id)} style={styles.controlButton}>
												<Text style={styles.controlText}>Delete</Text>
											</TouchableOpacity>
										</View>
									</View>
								)}
							/>
						)}
						<View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12}}>
							<TouchableOpacity onPress={() => setWorkoutsListOpen(false)} style={styles.controlButton}>
								<Text style={styles.controlText}>Close</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>

			{/* Create routine (schedule) modal */}
			<Modal visible={isCreateRoutineOpen} animationType="slide" transparent={true}>
				<View style={styles.modalBackdrop}>
					<View style={[styles.modalCard, {maxHeight: '85%'}]}>
						<Text style={styles.modalTitle}>Create Routine</Text>
						<TextInput placeholder="Routine name" value={routineDraftName} onChangeText={setRoutineDraftName} style={styles.input} />
						<Text style={{color: theme.icon, marginBottom: 8}}>Add days from saved workouts or add Rest days.</Text>
						<View style={{flexDirection: 'row', gap: 8, marginBottom: 8}}>
							<FlatList
								data={savedWorkouts}
								horizontal
								keyExtractor={(i) => i.id}
								renderItem={({item}) => (
									<TouchableOpacity onPress={() => addDayToSequence(item)} style={[styles.controlButton, {marginRight: 8}]}> 
										<Text style={styles.controlText}>{item.name}</Text>
									</TouchableOpacity>
								)}
							/>
							<TouchableOpacity onPress={() => addDayToSequence('rest')} style={styles.controlButton}>
								<Text style={styles.controlText}>Rest</Text>
							</TouchableOpacity>
						</View>

						{routineSequence.length === 0 ? (
							<Text style={{color: theme.icon}}>No days added</Text>
						) : (
							<FlatList
								data={routineSequence}
								keyExtractor={(i) => i.id}
								renderItem={({item, index}) => (
									<View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6}}>
										<View>
											<Text style={{color: theme.text, fontWeight: '600'}}>{index + 1}. {item.name}</Text>
											<Text style={{color: theme.icon, fontSize: 12}}>{item.type === 'rest' ? 'Rest day' : `Workout: ${item.name}`}</Text>
										</View>
										<View style={{flexDirection: 'row'}}>
											<TouchableOpacity onPress={() => moveSequenceItem(index, -1)} style={[styles.controlButton, {marginRight: 6}]}> 
												<Text style={styles.controlText}>↑</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => moveSequenceItem(index, 1)} style={[styles.controlButton, {marginRight: 6}]}> 
												<Text style={styles.controlText}>↓</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => removeSequenceItem(item.id)} style={styles.controlButton}> 
												<Text style={styles.controlText}>Remove</Text>
											</TouchableOpacity>
										</View>
									</View>
								)}
							/>
						)}

						<View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12}}>
							<TouchableOpacity onPress={() => { setCreateRoutineOpen(false); setRoutineSequence([]); setRoutineDraftName(''); }} style={[styles.controlButton, {marginRight: 8}]}> 
								<Text>Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity disabled={isSaving} onPress={saveRoutineDraft} style={[styles.controlButtonPrimary, isSaving ? styles.controlButtonDisabled : null]}>
								{isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.controlTextPrimary}>Save Routine</Text>}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>



			{/* Load routine modal */}
			<Modal visible={isLoadModalOpen} animationType="slide" transparent={true}>
				<View style={styles.modalBackdrop}>
					<View style={[styles.modalCard, {maxHeight: '80%'}]}>
						<Text style={styles.modalTitle}>Saved Routines</Text>
						{routines.length === 0 ? (
							<Text style={{color: theme.icon}}>No saved routines</Text>
						) : (
							<FlatList
								data={routines}
								keyExtractor={(i) => i.id}
								renderItem={({item}) => (
									<View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8}}>
										<View>
											<Text style={{color: theme.text, fontWeight: '600'}}>{item.name}</Text>
											<Text style={{color: theme.icon, fontSize: 12}}>{new Date(item.createdAt).toLocaleString()}</Text>
										</View>
										<View style={{flexDirection: 'row'}}>
											<TouchableOpacity onPress={() => handleSetRoutine(item.id)} style={[styles.controlButton, {marginRight: 8}]}>
												<Text style={styles.controlText}>Load</Text>
											</TouchableOpacity>
											<TouchableOpacity onPress={() => deleteRoutine(item.id)} style={styles.controlButton}>
												<Text style={styles.controlText}>Delete</Text>
											</TouchableOpacity>
										</View>
									</View>
								)}
							/>
						)}
						<View style={{flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12}}>
							<TouchableOpacity onPress={() => setLoadModalOpen(false)} style={styles.controlButton}>
								<Text style={styles.controlText}>Close</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>

	);
}

const makeStyles = (theme: any) =>
	StyleSheet.create({
		container: {flex: 1, padding: 16, backgroundColor: theme.background},
		header: {flexDirection: "row", justifyContent: "space-between", alignItems: "center"},
		title: {fontSize: 28, fontWeight: "700", color: theme.text},
		timer: {fontSize: 14, color: theme.icon},
		controlsRow: {flexDirection: "row", gap: 8, marginVertical: 12},
		controlButton: {padding: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.surface, marginRight: 8, backgroundColor: theme.background},
		controlButtonDisabled: {opacity: 0.6},
		controlButtonPrimary: {padding: 10, borderRadius: 8, backgroundColor: theme.primary},
		controlText: {color: theme.text},
		controlTextPrimary: {color: '#fff', fontWeight: "600"},
		currentContainer: {marginVertical: 8},
		sectionTitle: {fontSize: 18, fontWeight: "600", marginBottom: 8, color: theme.text},
		currentCard: {padding: 12, borderRadius: 8, borderWidth: 1, borderColor: theme.surface, backgroundColor: theme.surface},
		currentName: {fontSize: 20, fontWeight: "700", color: theme.text},
		currentInfo: {color: theme.icon, marginTop: 4},
		currentActions: {flexDirection: "row", justifyContent: "space-between", marginTop: 12},
		actionBtn: {padding: 8, borderRadius: 8, borderWidth: 1, borderColor: theme.surface},
		actionBtnPrimary: {padding: 8, borderRadius: 8, backgroundColor: theme.primary},
		restText: {marginTop: 8, color: theme.icon},
		listContainer: {flex: 1, marginTop: 12},
		item: {padding: 12, borderBottomWidth: 1, borderBottomColor: theme.surface, flexDirection: "row", alignItems: "center"},
		itemActive: {backgroundColor: theme.surface},
		itemName: {fontSize: 16, fontWeight: "600", color: theme.text},
		itemMeta: {color: theme.icon},
		itemDone: {marginLeft: 12, color: theme.primary, fontWeight: "700"},
		modalBackdrop: {flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.4)"},
		modalCard: {width: "90%", padding: 16, borderRadius: 12, backgroundColor: theme.background},
		modalTitle: {fontSize: 18, fontWeight: "700", marginBottom: 8, color: theme.text},
		input: {borderWidth: 1, borderColor: theme.surface, borderRadius: 8, padding: 10, marginBottom: 8, color: theme.text},
        dashboardContainer: {flex: 1, marginTop: 12},
        sectionHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12},
        emptyState: {padding: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.surface, borderRadius: 12, borderStyle: 'dashed'},
        workoutCard: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 12,
            width: 140,
            marginRight: 12,
            height: 100,
            justifyContent: 'space-between',
        },
        workoutCardTitle: {
            fontWeight: '600',
            color: theme.text,
            fontSize: 16,
        },
        activeRoutineCard: {
            backgroundColor: theme.surface,
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.options?.borderColor || 'rgba(150,150,150,0.1)',
        },
        activeRoutineTitle: {
            fontSize: 20, 
            fontWeight: '700', 
            color: theme.text,
        },
	});

