import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from "react-native";
import { useAuth } from "@mysuite/auth";
import {
    Exercise,
    SetLog,
    WorkoutLog,
    fetchUserWorkouts,
    fetchUserRoutines,
    fetchWorkoutHistory,
    fetchWorkoutLogDetails,
    persistWorkoutToSupabase,
    persistCompletedWorkoutToSupabase,
    deleteWorkoutFromSupabase,
    persistUpdateSavedWorkoutToSupabase,
    persistRoutineToSupabase,
    persistUpdateRoutineToSupabase,
    deleteRoutineFromSupabase,
    deleteWorkoutLogFromSupabase,
    createCustomExerciseInSupabase
} from "../utils/workout-api";
import { useRoutineManager } from "../hooks/routines/useRoutineManager";

// Re-export types for compatibility
export type { Exercise, SetLog, WorkoutLog };
export { fetchExercises, fetchMuscleGroups, fetchExerciseStats, fetchLastExercisePerformance } from "../utils/workout-api";


interface WorkoutManagerContextType {
    savedWorkouts: any[];
    routines: any[];
    activeRoutine: {
        id: string;
        dayIndex: number;
        lastCompletedDate?: string;
    } | null;
    startActiveRoutine: (id: string) => void;
    setActiveRoutineIndex: (index: number) => void;
    markRoutineDayComplete: () => void;
    clearActiveRoutine: () => void;
    isSaving: boolean;
    saveWorkout: (name: string, exercises: Exercise[], onSuccess: () => void) => Promise<void>;
    deleteSavedWorkout: (id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => void;
    updateSavedWorkout: (id: string, name: string, exercises: Exercise[], onSuccess: () => void) => Promise<void>;
    saveRoutineDraft: (name: string, sequence: any[], onSuccess: () => void) => Promise<void>;
    updateRoutine: (id: string, name: string, sequence: any[], onSuccess: () => void, suppressAlert?: boolean) => Promise<void>;
    deleteRoutine: (id: string, onSuccess?: () => void) => void;
    createCustomExercise: (name: string, type: string, primary?: string, secondary?: string[]) => Promise<{ data?: any, error?: any }>;
    workoutHistory: WorkoutLog[];
    fetchWorkoutLogDetails: (logId: string) => Promise<{ data: any[], error: any }>;
    saveCompletedWorkout: (name: string, exercises: Exercise[], duration: number, onSuccess?: () => void, note?: string, routineId?: string) => Promise<void>;
    deleteWorkoutLog: (id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => void;
}

const WorkoutManagerContext = createContext<WorkoutManagerContextType | undefined>(undefined);

export function WorkoutManagerProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [savedWorkouts, setSavedWorkouts] = useState<any[]>([]);
    const [routines, setRoutines] = useState<any[]>([]);
    const [workoutHistory, setWorkoutHistory] = useState<WorkoutLog[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const {
        activeRoutine,
        startActiveRoutine,
        setActiveRoutineIndex,
        markRoutineDayComplete,
        clearActiveRoutine,
        setRoutineState
    } = useRoutineManager(routines);

    // Load saved routines and saved workouts on mount
    useEffect(() => {
        // If user is signed in, fetch saved workouts from Supabase, otherwise load local
        async function fetchSaved() {
            try {
                if (user) {
                    // Fetch workouts
                    const { data: wData, error: wError } = await fetchUserWorkouts(user);
                    if (!wError && Array.isArray(wData)) {
                        const mapped = wData
                            .map((w: any) => {
                                let exercises = [];
                                try {
                                    exercises = w.notes
                                        ? JSON.parse(w.notes)
                                        : [];
                                } catch {
                                    // ignore parse error
                                }
                                return {
                                    id: w.workout_id,
                                    name: w.workout_name,
                                    exercises,
                                    createdAt: w.created_at,
                                };
                            })
                            .filter((w: any) =>
                                w.name && w.name.trim().toLowerCase() !== "rest"
                            ); // Filter out "Rest" workouts
                        setSavedWorkouts(mapped);
                    }

                    // Fetch routines
                    const { data: rData, error: rError } = await fetchUserRoutines(user);
                    if (!rError && Array.isArray(rData)) {
                        const mappedRoutines = rData.map((r: any) => {
                            let sequence = [];
                            try {
                                // Description field contains the JSON sequence of the routine
                                sequence = r.description
                                    ? JSON.parse(r.description)
                                    : [];
                            } catch {
                                // If parsing fails, default to empty sequence to prevent crash
                            }
                            return {
                                id: r.routine_id,
                                name: r.routine_name,
                                sequence,
                                createdAt: r.created_at,
                            };
                        });
                        setRoutines(mappedRoutines);
                    }

                    // Fetch history
                    const { data: hData, error: hError } = await fetchWorkoutHistory(user);
                    if (!hError) {
                        setWorkoutHistory(hData);
                    } else {
                        console.error("Failed to fetch workout history:", hError);
                        Alert.alert("History Error", "Failed to load workout history: " + (hError.message || JSON.stringify(hError)));
                    }
                } else {
                    const rawW = await AsyncStorage.getItem("myhealth_saved_workouts");
                    if (rawW) {
                        const parsed = JSON.parse(rawW);
                        // Filter out "Rest" workouts from local storage too
                        const filtered = Array.isArray(parsed)
                            ? parsed.filter((w: any) =>
                                w.name &&
                                w.name.trim().toLowerCase() !== "rest"
                            )
                            : [];
                        setSavedWorkouts(filtered);
                    }
                    const rawR = await AsyncStorage.getItem("myhealth_workout_routines");
                    if (rawR) setRoutines(JSON.parse(rawR));
                    
                    const rawActive = await AsyncStorage.getItem("myhealth_active_routine");
                    if (rawActive) setRoutineState(JSON.parse(rawActive));
                }
            } catch {
                // ignore
            }
        }
        fetchSaved();
    }, [user, setRoutineState]);

    // Persist saved workouts and routines when changed
    useEffect(() => {
        const persistData = async () => {
            try {
                await AsyncStorage.setItem("myhealth_saved_workouts", JSON.stringify(savedWorkouts));
                await AsyncStorage.setItem("myhealth_workout_routines", JSON.stringify(routines));
                
                if (activeRoutine) {
                    await AsyncStorage.setItem("myhealth_active_routine", JSON.stringify(activeRoutine));
                } else {
                    await AsyncStorage.removeItem("myhealth_active_routine");
                }
            } catch {
                // ignore
            }
        };
        persistData();
    }, [savedWorkouts, routines, activeRoutine]);

    async function saveWorkout(
        workoutName: string,
        exercises: Exercise[],
        onSuccess: () => void,
    ) {
        if (!workoutName || workoutName.trim() === "") {
            Alert.alert(
                "Name required",
                "Please enter a name for the workout.",
            );
            return;
        }

        if (workoutName.trim().toLowerCase() === "rest") {
            Alert.alert(
                "Invalid Name",
                "Workout cannot be named 'Rest'. This name is reserved.",
            );
            return;
        }

        if (user) {
            setIsSaving(true);
            try {
                const { data, error } = await persistWorkoutToSupabase(
                    user,
                    workoutName,
                    exercises,
                );

                if (error || !data) {
                    console.warn("Failed to create workout on server", error);
                    Alert.alert(
                        "Error",
                        "Failed to save workout to server. Saved locally instead.",
                    );
                } else {
                    const payload = {
                        id: data.workout_id,
                        name: data.workout_name,
                        exercises,
                        createdAt: data.created_at,
                    };
                    setSavedWorkouts((rs) => [payload, ...rs]);
                    onSuccess();
                    Alert.alert("Saved", `Workout '${payload.name}' saved.`);
                    return;
                }
            } finally {
                setIsSaving(false);
            }
        }

        // Fallback: save locally
        const id = Date.now().toString();
        const payload = {
            id,
            name: workoutName.trim(),
            exercises,
            createdAt: new Date().toISOString(),
        };
        setSavedWorkouts((rs) => [payload, ...rs]);
        onSuccess();
        Alert.alert("Saved", `Workout '${payload.name}' saved locally.`);
    }

    async function saveCompletedWorkout(
        name: string,
        exercises: Exercise[],
        duration: number,
        onSuccess?: () => void,
        note?: string,
        routineId?: string
    ) {
        if (user) {
            setIsSaving(true);
            try {
                const { error } = await persistCompletedWorkoutToSupabase(
                    user,
                    name,
                    exercises,
                    duration,
                    undefined,
                    note
                );

                if (error) {
                    Alert.alert("Error", "Failed to save workout log.");
                } else {
                    // Refresh history
                    const { data: hData } = await fetchWorkoutHistory(user);
                    if (hData) setWorkoutHistory(hData);

                    // Check for routine completion
                    if (routineId && activeRoutine?.id === routineId) {
                        markRoutineDayComplete();
                    }

                    onSuccess?.();
                }
            } finally {
                setIsSaving(false);
            }
        } else {
            // Local storage logic for history could go here, but for now just alert
            Alert.alert(
                "Completed",
                "Workout finished! (Not saved - login to save history)",
            );
            onSuccess?.();
        }
    }

    function deleteSavedWorkout(id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) {
        const performDelete = async () => {
            // If user is signed in, attempt server delete first
            if (user) {
                try {
                    await deleteWorkoutFromSupabase(user, id);
                } catch {
                    // ignore server delete errors and continue to remove locally
                }
            }
            setSavedWorkouts((s) => s.filter((x) => x.id !== id));
            options?.onSuccess?.();
        };

        if (options?.skipConfirmation) {
            performDelete();
        } else {
            Alert.alert("Delete workout", "Are you sure?", [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: performDelete,
                },
            ]);
        }
    }

    async function updateSavedWorkout(
        id: string,
        name: string,
        exercises: Exercise[],
        onSuccess: () => void
    ) {
        if (!name || name.trim() === "") {
            Alert.alert("Name required", "Please enter a name for the workout.");
            return;
        }

        if (user) {
            setIsSaving(true);
            try {
                const { data, error } = await persistUpdateSavedWorkoutToSupabase(user, id, name, exercises);
                if (error || !data) {
                    Alert.alert("Error", "Failed to update workout on server.");
                } else {
                    const payload = {
                        id: data.workout_id,
                        name: data.workout_name,
                        exercises,
                        createdAt: data.created_at,
                    };
                    setSavedWorkouts(prev => prev.map(w => w.id === id ? payload : w));
                    onSuccess();
                    Alert.alert("Updated", `Workout '${payload.name}' updated.`);
                }
            } finally {
                setIsSaving(false);
            }
        } else {
             // Local update
             const payload = {
                id,
                name: name.trim(),
                exercises,
                createdAt: new Date().toISOString(),
            };
            setSavedWorkouts(prev => prev.map(w => w.id === id ? { ...w, ...payload, createdAt: w.createdAt } : w));
            onSuccess();
            Alert.alert("Updated", `Workout '${name}' updated locally.`);
        }
    }

    async function saveRoutineDraft(
        routineDraftName: string,
        routineSequence: any[],
        onSuccess: () => void,
    ) {
        if (!routineDraftName || routineDraftName.trim() === "") {
            Alert.alert(
                "Name required",
                "Please enter a name for the routine.",
            );
            return;
        }
        if (routineSequence.length === 0) {
            Alert.alert(
                "Empty routine",
                "Please add at least one day to the routine.",
            );
            return;
        }

        if (user) {
            setIsSaving(true);
            try {
                const { data, error } = await persistRoutineToSupabase(
                    user,
                    routineDraftName,
                    routineSequence,
                );

                if (error || !data) {
                    console.warn("Supabase save routine error", error);
                    Alert.alert(
                        "Error",
                        "Failed to save routine to server. Saving locally instead.",
                    );
                } else {
                    let finalSequence = routineSequence;
                    try {
                        if (data.description) {
                            finalSequence = JSON.parse(data.description);
                        }
                    } catch (e) {
                         console.warn("Failed to parse returned sequence", e);
                    }

                    const payload = {
                        id: data.routine_id,
                        name: data.routine_name,
                        sequence: finalSequence, 
                        createdAt: data.created_at,
                    };
                    setRoutines((rs) => [payload, ...rs]);
                    onSuccess();
                    Alert.alert("Saved", `Routine '${payload.name}' saved.`);
                    return;
                }
            } finally {
                setIsSaving(false);
            }
        }

        // Fallback: save locally
        const id = Date.now().toString();
        const payload = {
            id,
            name: routineDraftName.trim(),
            sequence: routineSequence,
            createdAt: new Date().toISOString(),
        };
        setRoutines((rs) => [payload, ...rs]);
        onSuccess();
        Alert.alert("Saved", `Routine '${payload.name}' saved locally.`);
    }

    const updateRoutine = useCallback(async (
        id: string,
        name: string,
        sequence: any[],
        onSuccess: () => void,
        suppressAlert?: boolean
    ) => {
        if (!name || name.trim() === "") {
            Alert.alert("Name required", "Please enter a name for the routine.");
            return;
        }
        if (sequence.length === 0) {
            Alert.alert("Empty routine", "Please add at least one day.");
            return;
        }

        if (user) {
            setIsSaving(true);
            try {
                const { data, error } = await persistUpdateRoutineToSupabase(
                    user, 
                    id, 
                    name, 
                    sequence 
                );
                
                if (error || !data) {
                    Alert.alert("Error", "Failed to update routine on server.");
                } else {
                     let finalSequence = sequence;
                    try {
                        if (data.description) {
                            finalSequence = JSON.parse(data.description);
                        }
                    } catch (e) {
                         console.warn("Failed to parse returned sequence", e);
                    }

                    setRoutines(prev => prev.map(r => r.id === id ? { ...r, name: data.routine_name, sequence: finalSequence } : r));
                    onSuccess();
                    if (!suppressAlert) Alert.alert("Updated", `Routine '${name}' updated.`);
                }
            } finally {
                setIsSaving(false);
            }
        } else {
            // Local update
            setRoutines(prev => prev.map(r => r.id === id ? { ...r, name, sequence } : r));
            onSuccess();
            if (!suppressAlert) Alert.alert("Updated", `Routine '${name}' updated locally.`);
        }
    }, [user]);

    function deleteRoutine(id: string, onSuccess?: () => void) {
        Alert.alert("Delete routine", "Are you sure? This cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    if (user) {
                        try {
                           await deleteRoutineFromSupabase(user, id);
                        } catch (e) {
                             console.warn("Failed to delete routine on server", e);
                        }
                    }
                    setRoutines((rs) => rs.filter((x) => x.id !== id));
                    if (activeRoutine?.id === id) {
                        clearActiveRoutine();
                    }
                    onSuccess?.();

                },
            },
        ]);
    }

    const deleteWorkoutLog = async (id: string, options?: { onSuccess?: () => void; skipConfirmation?: boolean }) => {
        const performDelete = async () => {
            if (user) {
                try {
                    await deleteWorkoutLogFromSupabase(user, id);
                } catch (e) {
                    console.warn("Failed to delete workout log on server", e);
                }
            }
            setWorkoutHistory((h) => h.filter((x) => x.id !== id));
            options?.onSuccess?.();
        };

        if (options?.skipConfirmation) {
            await performDelete();
        } else {
            Alert.alert(
                "Delete Workout Log",
                "Are you sure? This cannot be undone.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: performDelete
                    }
                ]
            );
        }
    };

    const handleFetchWorkoutLogDetails = useCallback((logId: string) => {
        return fetchWorkoutLogDetails(user, logId);
    }, [user]);

    const value = {
        savedWorkouts,
        routines,
        activeRoutine,
        startActiveRoutine,
        setActiveRoutineIndex,
        markRoutineDayComplete,
        clearActiveRoutine,
        isSaving,
        saveWorkout,
        deleteSavedWorkout,
        updateSavedWorkout,
        saveRoutineDraft,
        updateRoutine,
        deleteRoutine,
        workoutHistory,
        fetchWorkoutLogDetails: handleFetchWorkoutLogDetails,
        saveCompletedWorkout,
        deleteWorkoutLog,
        createCustomExercise: async (name: string, type: string, primary?: string, secondary?: string[]) => {
            return createCustomExerciseInSupabase(user, name, type, primary, secondary);
        },
    };

    return (
        <WorkoutManagerContext.Provider value={value}>
            {children}
        </WorkoutManagerContext.Provider>
    );
}

export function useWorkoutManager() {
    const context = useContext(WorkoutManagerContext);
    if (context === undefined) {
        throw new Error('useWorkoutManager must be used within a WorkoutManagerProvider');
    }
    return context;
}
