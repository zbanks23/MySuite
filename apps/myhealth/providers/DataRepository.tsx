import { storage } from "../utils/storage";
import type { LocalWorkoutLog, Exercise } from "../utils/workout-api/types";
import uuid from 'react-native-uuid';
import ExerciseDefaultData from '../assets/data/default-exercises.json';

export const TABLES = {
    EXERCISES: "exercises",
    WORKOUTS: "workouts", // Templates
    WORKOUT_LOGS: "workout_logs", // History Headers
    SET_LOGS: "set_logs", // History Details
    BODY_MEASUREMENTS: "body_measurements",
};

// Legacy keys for migration support
const LEGACY_KEYS = {
    WORKOUTS: "myhealth_saved_workouts",
    HISTORY: "myhealth_workout_history",
};

// --- Generic Table AccessHelpers ---
const table = async <T extends unknown>(tableName: string) => {
    const raw = await storage.getItem<T[]>(tableName);
    return raw || [];
};

const upsert = async <T extends { id?: string }>(tableName: string, data: T | T[]) => {
    const current = await table<T>(tableName);
    const items = Array.isArray(data) ? data : [data];
    
    let updated = [...current];
    items.forEach(item => {
        if (!item.id) item.id = uuid.v4() as string;
        const index = updated.findIndex(existing => existing.id === item.id);
        if (index >= 0) {
            updated[index] = { ...updated[index], ...item };
        } else {
            updated.push(item);
        }
    });
    
    await storage.setItem(tableName, updated);
    return items;
};

export const DataRepository = {
    // Expose helpers if needed (though internal usage is preferred)
    table,
    upsert,
    
    // --- Workouts (Templates) ---
    getWorkouts: async (): Promise<any[]> => {
        // Try new table first
        let workouts = await table<any>(TABLES.WORKOUTS);
        
        // Migration Check: If empty, check legacy and migrate
        if (workouts.length === 0) {
             const legacy = await storage.getItem<any[]>(LEGACY_KEYS.WORKOUTS);
             if (legacy && legacy.length > 0) {
                 console.log("Migrating Legacy Workouts...");
                 await upsert(TABLES.WORKOUTS, legacy);
                 workouts = legacy;
             }
        }

        return workouts.filter((w: any) => !w.deletedAt);
    },

    saveWorkouts: async (workouts: any[]): Promise<void> => {
        // Overwrite full list (legacy behavior compatibility)
        await storage.setItem(TABLES.WORKOUTS, workouts);
    },

    saveWorkout: async (workout: any): Promise<void> => {
       await upsert(TABLES.WORKOUTS, {
           ...workout,
           updatedAt: Date.now(),
           syncStatus: 'pending',
       });
    },

    deleteWorkout: async (id: string): Promise<void> => {
        const workouts = await DataRepository.getWorkouts();
        const index = workouts.findIndex((w: any) => w.id === id);
        if (index >= 0) {
            workouts[index].deletedAt = Date.now();
            workouts[index].syncStatus = 'pending';
            await DataRepository.saveWorkouts(workouts);
        }
    },


    // --- History (Logs) ---
    
    /**
     * Reconstructs full workout history by joining workout_logs and set_logs.
     * Use this for UI display.
     */
    getHistory: async (): Promise<LocalWorkoutLog[]> => {
        const logs = await table<any>(TABLES.WORKOUT_LOGS);
        const setLogs = await table<any>(TABLES.SET_LOGS);
        
        // Migration Check
        if (logs.length === 0) {
             const legacy = await storage.getItem<LocalWorkoutLog[]>(LEGACY_KEYS.HISTORY);
             if (legacy && legacy.length > 0) {
                 console.log("Migrating Legacy History...");
                 // This is complex: split legacy logs into headers and sets
                 // For now, let's return legacy if new tables are empty to avoid data loss during dev
                 // Ideally we run a one-time migration script.
                 // Let's implement an on-the-fly migration to new tables:
                 const migratedLogs: any[] = [];
                 const migratedSets: any[] = [];
                 
                 legacy.forEach(l => {
                     const logId = l.id || uuid.v4();
                     migratedLogs.push({
                         id: logId, // workout_log_id
                         user_id: l.userId,
                         workout_time: l.date,
                         workout_name: l.name,
                         duration: l.duration,
                         note: l.note,
                         created_at: l.createdAt,
                         syncStatus: 'synced', // Assume legacy was synced if we are migrating
                     });
                     
                     if (l.exercises) {
                         l.exercises.forEach((ex: any) => {
                             if (ex.logs) {
                                 ex.logs.forEach((s: any) => {
                                     migratedSets.push({
                                         id: s.id || uuid.v4(),
                                         workout_log_id: logId,
                                         exercise_id: ex.id,
                                         details: {
                                             ...s,
                                             exercise_name: ex.name, // denormalize name for easy display if ex missing
                                             exercise_id: ex.id
                                         },
                                         created_at: l.createdAt
                                     });
                                 });
                             }
                         });
                     }
                 });
                 
                 await storage.setItem(TABLES.WORKOUT_LOGS, migratedLogs);
                 await storage.setItem(TABLES.SET_LOGS, migratedSets);
                 
                 // Renamed vars for consistency below
                 return DataRepository.getHistory(); // Recursive call now that data is migrated
             }
        }

        // Perform Join
        return logs.map(log => {
            // Find sets for this log
            const sets = setLogs.filter(s => s.workout_log_id === log.id);
            
            // Group sets by exercise to reconstruct the nested structure UI expects
            const exercisesMap = new Map<string, Exercise>();
            
            sets.forEach(set => {
                const exId = set.exercise_id || set.details?.exercise_id || 'unknown';
                const exName = set.details?.exercise_name || 'Unknown Exercise';
                
                if (!exercisesMap.has(exId)) {
                    exercisesMap.set(exId, {
                        id: exId,
                        name: exName,
                        sets: 0,
                        reps: 0,
                        completedSets: 0,
                        logs: [],
                        // Properties would ideally come from Exercises table join
                    });
                }
                
                const ex = exercisesMap.get(exId)!;
                ex.logs?.push({
                     id: set.id,
                     weight: set.details?.weight,
                     reps: set.details?.reps,
                     distance: set.details?.distance,
                     duration: set.details?.duration,
                     bodyweight: set.details?.bodyweight,
                });
                ex.completedSets = (ex.completedSets || 0) + 1;
            });
            
            return {
                id: log.id,
                workoutId: log.workout_id, // if linked to template
                userId: log.user_id,
                date: log.workout_time,
                workoutTime: log.workout_time,
                name: log.workout_name,
                duration: log.duration,
                note: log.note,
                notes: log.note,
                exercises: Array.from(exercisesMap.values()),
                createdAt: log.created_at,
                syncStatus: log.syncStatus || 'synced',
                updatedAt: log.updatedAt || new Date(log.created_at).getTime(),
            };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },

    saveHistory: async (logs: LocalWorkoutLog[]): Promise<void> => {
        // This method is usually called by Sync Service to overwrite local with cloud state
        // We need to decompose the rich object back into tables
        
        const workoutLogs: any[] = [];
        const setLogs: any[] = [];
        
        logs.forEach(l => {
             workoutLogs.push({
                 id: l.id,
                 // map back fields
                 user_id: l.userId,
                 workout_time: l.date || l.workoutTime,
                 workout_name: l.name,
                 duration: l.duration,
                 note: l.note,
                 created_at: l.createdAt,
                 syncStatus: l.syncStatus,
                 updatedAt: l.updatedAt
             });
             
             if (l.exercises) {
                 l.exercises.forEach(ex => {
                     if (ex.logs) {
                         ex.logs.forEach(s => {
                             setLogs.push({
                                 id: s.id || uuid.v4(),
                                 workout_log_id: l.id,
                                 exercise_id: ex.id,
                                 details: {
                                     ...s,
                                     exercise_name: ex.name,
                                     exercise_id: ex.id
                                 },
                                 created_at: l.createdAt
                             });
                         });
                     }
                 });
             }
        });
        
        await storage.setItem(TABLES.WORKOUT_LOGS, workoutLogs);
        await storage.setItem(TABLES.SET_LOGS, setLogs);
    },

    saveLog: async (log: Omit<LocalWorkoutLog, 'updatedAt' | 'syncStatus' | 'id'> & { id?: string }): Promise<LocalWorkoutLog> => {
        const id = log.id || (uuid.v4() as string);
        const now = Date.now();
        const timestamp = new Date().toISOString(); 
        
        // 1. Save Header
        await upsert(TABLES.WORKOUT_LOGS, {
            id: id,
            user_id: log.userId,
            workout_time: log.date || timestamp,
            workout_name: log.name,
            duration: log.duration,
            note: log.note,
            created_at: timestamp,
            updatedAt: now,
            syncStatus: 'pending'
        });
        
        // 2. Save Sets
        const newSets: any[] = [];
        if (log.exercises) {
            log.exercises.forEach(ex => {
                if (ex.logs) {
                    ex.logs.forEach(s => {
                        newSets.push({
                            id: s.id || uuid.v4(),
                            workout_log_id: id,
                            exercise_id: ex.id,
                            details: {
                                ...s,
                                exercise_name: ex.name,
                                exercise_id: ex.id
                            },
                            created_at: timestamp,
                            syncStatus: 'pending' // Technically set_logs don't have syncStatus in SQL, but useful for local tracking? 
                            // Actually sync service pushes by workout_log usually.
                        });
                    });
                }
            });
        }
        
        if (newSets.length > 0) {
            await upsert(TABLES.SET_LOGS, newSets);
        }

        // Return full object for UI
        return {
            ...log,
            id,
            updatedAt: now,
            syncStatus: 'pending'
        } as LocalWorkoutLog;
    },
    
    // --- Stats ---
    getExerciseStats: async (exerciseName: string) => {
        // More efficient query now: just scan set_logs
        const setLogs = await table<any>(TABLES.SET_LOGS);
        
        let maxWeight = 0;
        let totalVolume = 0;
        let prDate = null;

        // Filter and iterate
        // In SQL: SELECT * FROM set_logs WHERE details->>'exercise_name' = ?
        for (const set of setLogs) {
            if (set.details?.exercise_name === exerciseName) {
                const weight = set.details.weight;
                const reps = set.details.reps;
                
                if (weight && weight > maxWeight) {
                    maxWeight = weight;
                    // We need date. set_logs has created_at
                    prDate = set.created_at;
                }
                if (weight && reps) {
                    totalVolume += weight * reps;
                }
            }
        }

        return {
            maxWeight,
            prDate,
            totalVolume
        };
    },
    
    // --- Base Data ---
    getDefaultExercises: async () => {
        return ExerciseDefaultData;
    }
};
