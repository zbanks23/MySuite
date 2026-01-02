import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@mysuite/auth";
import { DataRepository } from "../providers/DataRepository";
import {
    fetchFullWorkoutHistory,
    fetchUserWorkouts,
    persistCompletedWorkoutToSupabase,
    persistWorkoutToSupabase,
} from "../utils/workout-api";

export function useSyncService() {
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const isSyncingRef = useRef(false);

    const pullData = useCallback(async () => {
        if (!user) return;
        try {
            console.log("Pulling data...");
            // 1. Pull History
            const { data: historyData, error: historyError } =
                await fetchFullWorkoutHistory(user);

            if (!historyError && historyData) {
                // Merge strategy: Keep local 'pending' (unsynced) items, replace others with cloud truth
                const currentHistory = await DataRepository.getHistory();
                const pendingLocal = currentHistory.filter((h) =>
                    h.syncStatus === "pending"
                );

                // Deduplicate: If a pending item somehow got synced but status wasn't updated?
                // Unlikely in this flow. Just simple concat is safer to avoid data loss.
                // However, we want to ensure we don't have duplicates if we just pushed them?
                // If we just pushed them, they are 'synced' now (in pushData).
                // So pendingLocal should strictly be items that FAILED to push.

                // We also need to handle the case where we just pushed an item, it became 'synced' locally,
                // and now we pull it back from server.
                // The server version is the source of truth for synced items.

                // So: New History = (Local Pending) + (Cloud History)
                const mergedHistory = [
                    ...pendingLocal,
                    ...historyData,
                ] as any[];

                await DataRepository.saveHistory(mergedHistory);
            }

            // 2. Pull Saved Workouts
            const { data: wData, error: wError } = await fetchUserWorkouts(
                user,
            );
            if (!wError && wData) {
                const mapped = wData.map((w: any) => ({
                    id: w.workout_id,
                    name: w.workout_name,
                    exercises: w.notes ? JSON.parse(w.notes) : [],
                    createdAt: w.created_at,
                    syncStatus: "synced" as const,
                    updatedAt: new Date(w.created_at).getTime(),
                }));
                // Similar merge for workouts?
                // For now, let's keep the existing overwrite behavior for workouts or improve it too?
                // Existing code: await DataRepository.saveWorkouts(mapped);
                // Let's improve it to be safe for pending workouts too.
                const currentWorkouts = await DataRepository.getWorkouts();
                const pendingWorkouts = currentWorkouts.filter((w: any) =>
                    w.syncStatus === "pending"
                );

                const mergedWorkouts = [...pendingWorkouts, ...mapped];
                await DataRepository.saveWorkouts(mergedWorkouts);
            }
        } catch (e) {
            console.error("Pull failed", e);
        }
    }, [user]);

    const pushData = useCallback(async () => {
        if (!user) return;
        try {
            console.log("Pushing data...");
            // 1. Push History
            const history = await DataRepository.getHistory();
            const pendingHistory = history.filter((h) =>
                h.syncStatus === "pending"
            );

            for (const log of pendingHistory) {
                const { error } = await persistCompletedWorkoutToSupabase(
                    user,
                    log.name,
                    log.exercises,
                    log.duration,
                    log.date,
                    log.note,
                );

                if (!error) {
                    log.syncStatus = "synced";
                }
            }
            await DataRepository.saveHistory(history);

            // 2. Push Saved Workouts
            const workouts = await DataRepository.getWorkouts();
            const pendingWorkouts = workouts.filter((w: any) =>
                w.syncStatus === "pending"
            );

            for (const w of pendingWorkouts) {
                const { data, error } = await persistWorkoutToSupabase(
                    user,
                    w.name,
                    w.exercises,
                );
                if (!error && data) {
                    w.id = data.workout_id;
                    w.syncStatus = "synced";
                }
            }
            await DataRepository.saveWorkouts(workouts);
        } catch (e) {
            console.error("Push failed", e);
        }
    }, [user]);

    const sync = useCallback(async () => {
        if (isSyncingRef.current || !user) return;

        isSyncingRef.current = true;
        setIsSyncing(true);

        try {
            await pushData();
            await pullData();
            console.log("Data sync complete");
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
        }
    }, [user, pushData, pullData]);

    useEffect(() => {
        if (user) {
            sync();
        }
    }, [user, sync]);

    return {
        isSyncing,
        sync,
    };
}
