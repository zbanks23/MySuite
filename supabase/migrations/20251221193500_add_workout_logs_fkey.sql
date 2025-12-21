-- Re-add workout_id column which was previously dropped
-- This is needed to link logs to specific saved workouts
ALTER TABLE "public"."workout_logs"
    ADD COLUMN IF NOT EXISTS "workout_id" UUID;

-- Add Foreign Key constraint to link workout_logs to workouts
-- This enables the "rich query" to fetch workout details via join
ALTER TABLE "public"."workout_logs"
    ADD CONSTRAINT "workout_logs_workout_id_fkey"
    FOREIGN KEY ("workout_id")
    REFERENCES "public"."workouts"("workout_id")
    ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_id ON public.workout_logs(workout_id);
