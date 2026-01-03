# Local Database Schema (AsyncStorage)

This document describes the local storage schema used by `DataRepository`, which mirrors the Supabase SQL schema to support offline-first functionality and easier synchronization.

## collections

Data is stored in `AsyncStorage` using collection keys.

### `workout_logs` (Table)
Stores the header information for a performed workout.

**Key:** `workout_logs`
**Type:** `Array<LocalWorkoutLogHeader>`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Unique ID (generated locally). Matches `workout_log_id` in Supabase. |
| `user_id` | String | Owner ID. |
| `workout_time` | ISO String | Date/Time of the workout. |
| `workout_name` | String | Name of the workout. |
| `duration` | Number | Duration in seconds. |
| `note` | String (Optional) | User notes. |
| `created_at` | ISO String | Creation timestamp. |
| `updatedAt` | Number | Last update timestamp (for sync). |
| `syncStatus` | 'pending' \| 'synced' | Sync status. |

### `set_logs` (Table)
Stores the individual set performance data. Linked to `workout_logs`.

**Key:** `set_logs`
**Type:** `Array<LocalSetLog>`

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Unique ID. Matches `set_log_id`. |
| `workout_log_id` | UUID | Foreign Key to `workout_logs`. |
| `exercise_id` | UUID | Foreign Key to `exercises`. |
| `details` | Object | Performance data. |
| `details.weight` | Number | Weight lifted. |
| `details.reps` | Number | Reps performed. |
| `details.bodyweight` | Number | Bodyweight at time of set. |
| `details.exercise_name` | String | Denormalized name (snapshot). |
| `created_at` | ISO String | Creation timestamp. |

### `workouts` (Templates)
Stores workout templates.

**Key:** `workouts`
**Type:** `Array<WorkoutTemplate>`

### `exercises`
Stores available exercises.

**Key:** `exercises`
**Type:** `Array<ExerciseRef>`

## Relationships

- `workout_logs` 1 : N `set_logs` (joined via `workout_log_id`)
- `DataRepository.getHistory()` performs an in-memory join of these collections to produce the rich `LocalWorkoutLog` object used by the UI.
