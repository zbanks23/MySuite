import { useEffect, useState } from "react";
import { Alert } from "react-native";
import { supabase, useAuth } from "@mycsuite/auth";

export type Exercise = {
    id: string;
    name: string;
    sets: number;
    reps: number;
    completedSets?: number;
};

// --- Helper / API Functions (Outside Hook) ---

async function getOrCreateExercise(user: any, ex: any) {
    if (!user) return null;
    try {
        const { data: existing } = await supabase
            .from("exercises")
            .select("exercise_id")
            .ilike("exercise_name", ex.name)
            .eq("user_id", user.id)
            .maybeSingle();
        if (existing && existing.exercise_id) return existing.exercise_id;
        const { data: ins } = await supabase
            .from("exercises")
            .insert([{
                exercise_name: ex.name,
                exercise_type: "bodyweight_reps",
                description: null,
                user_id: user.id,
            }])
            .select()
            .single();
        return ins?.exercise_id ?? null;
    } catch {
        console.warn("getOrCreateExercise error");
        return null;
    }
}

async function fetchUserWorkouts(user: any) {
    if (!user) return { data: [], error: null };
    const { data, error } = await supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
    return { data, error };
}

async function fetchUserRoutines(user: any) {
    if (!user) return { data: [], error: null };
    // We rely on RLS policies to ensure users only see their own routines.
    const { data, error } = await supabase
        .from("routines")
        .select("*")
        .order("created_at", { ascending: false });
    return { data, error };
}

async function persistWorkoutToSupabase(
    user: any,
    workoutName: string,
    exercises: Exercise[],
) {
    if (!user) return { error: "User not logged in" };

    const { data: wdata, error: wErr } = await supabase
        .from("workouts")
        .insert([{
            user_id: user.id,
            workout_name: workoutName.trim(),
            notes: JSON.stringify(exercises),
        }])
        .select()
        .single();

    if (wErr || !wdata) {
        return { error: wErr || "Failed to create workout" };
    }

    const workoutId = wdata.workout_id;
    // For each exercise, find/create exercise, create workout_exercises and exercise_sets
    for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const exerciseId = await getOrCreateExercise(user, ex);
        if (!exerciseId) continue;

        // insert workout_exercises with explicit position
        const { data: weData, error: weErr } = await supabase
            .from("workout_exercises").insert([{
                workout_id: workoutId,
                exercise_id: exerciseId,
                position: i,
            }]).select().single();

        if (weErr || !weData) {
            console.warn("Failed to insert workout_exercise", weErr);
            continue;
        }

        const workoutExerciseId = weData.workout_exercise_id;
        // insert exercise_sets for the number of sets
        for (let s = 1; s <= (ex.sets || 1); s++) {
            try {
                await supabase.from("exercise_sets").insert([{
                    workout_exercise_id: workoutExerciseId,
                    set_number: s,
                    details: { reps: ex.reps },
                }]);
            } catch (esErr) {
                console.warn("Failed to insert exercise_set", esErr);
            }
        }
    }

    return { data: wdata };
}

async function deleteWorkoutFromSupabase(user: any, id: string) {
    if (!user) return;
    try {
        await supabase.from("workouts").delete().eq("workout_id", id);
    } catch (e) {
        console.warn("Failed to delete workout", e);
        throw e;
    }
}

async function persistRoutineToSupabase(
    user: any,
    routineName: string,
    sequence: any[],
) {
    if (!user) return { error: "User not logged in" };

    // Invoke the 'create-routine' Edge Function to handle the complex transaction
    const { data: responseData, error: invokeError } = await supabase.functions
        .invoke("create-routine", {
            body: {
                routine_name: routineName.trim(),
                exercises: sequence,
                user_id: user.id,
            },
        });

    const data = responseData?.data;
    const error = invokeError ||
        (responseData?.error ? new Error(responseData.error) : null);

    if (error || !data) {
        return { error: error || "Failed to create routine" };
    }

    return { data };
}

// --- Hook ---

export function useWorkoutManager() {
    const { user } = useAuth();
    const [savedWorkouts, setSavedWorkouts] = useState<any[]>([]);
    const [routines, setRoutines] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Load saved routines and saved workouts on mount
    useEffect(() => {
        // If user is signed in, fetch saved workouts from Supabase, otherwise load local
        async function fetchSaved() {
            try {
                if (user) {
                    // Fetch workouts
                    const { data: wData, error: wError } =
                        await fetchUserWorkouts(user);
                    if (!wError && Array.isArray(wData)) {
                        const mapped = wData.map((w: any) => {
                            let exercises = [];
                            try {
                                exercises = w.notes ? JSON.parse(w.notes) : [];
                            } catch {
                                // ignore parse error
                            }
                            return {
                                id: w.workout_id,
                                name: w.workout_name,
                                exercises,
                                createdAt: w.created_at,
                            };
                        });
                        setSavedWorkouts(mapped);
                    }

                    // Fetch routines
                    const { data: rData, error: rError } =
                        await fetchUserRoutines(user);
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
                } else {
                    if (typeof window !== "undefined" && window.localStorage) {
                        const rawW = window.localStorage.getItem(
                            "mycpo_saved_workouts",
                        );
                        if (rawW) setSavedWorkouts(JSON.parse(rawW));
                        const rawR = window.localStorage.getItem(
                            "mycpo_workout_routines",
                        );
                        if (rawR) setRoutines(JSON.parse(rawR));
                    }
                }
            } catch {
                // ignore
            }
        }
        fetchSaved();
    }, [user]);

    // Persist saved workouts and routines when changed
    useEffect(() => {
        try {
            if (typeof window !== "undefined" && window.localStorage) {
                window.localStorage.setItem(
                    "mycpo_saved_workouts",
                    JSON.stringify(savedWorkouts),
                );
                window.localStorage.setItem(
                    "mycpo_workout_routines",
                    JSON.stringify(routines),
                );
            }
        } catch {
            // ignore
        }
    }, [savedWorkouts, routines]);

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

        // If user is signed in, persist normalized rows to Supabase
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

    function deleteSavedWorkout(id: string) {
        Alert.alert("Delete workout", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    // If user is signed in, attempt server delete first
                    if (user) {
                        try {
                            await deleteWorkoutFromSupabase(user, id);
                        } catch {
                            // ignore server delete errors and continue to remove locally
                        }
                    }
                    setSavedWorkouts((s) => s.filter((x) => x.id !== id));
                },
            },
        ]);
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

        // If user is signed in, attempt to save to Supabase
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
                    // Add to local list using server id
                    const payload = {
                        id: data.routine_id,
                        name: data.routine_name,
                        sequence: routineSequence,
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

    function deleteRoutine(id: string) {
        Alert.alert("Delete routine", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: () =>
                    setRoutines((rs) => rs.filter((x) => x.id !== id)),
            },
        ]);
    }

    return {
        savedWorkouts,
        routines,
        isSaving,
        saveWorkout,
        deleteSavedWorkout,
        saveRoutineDraft,
        deleteRoutine,
    };
}
