// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ??
  "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    // Accept routine_name or title (fallback)
    const { title, routine_name, user_id, exercises } = body || {};
    const name = routine_name || title;

    if (!name || typeof name !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid `routine_name`" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!user_id || typeof user_id !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing `user_id`" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // 1. Create Routine Row
    const { data: routineData, error: routineError } = await supabase.from(
      "routines",
    ).insert({
      routine_name: name.trim(),
      user_id,
      // We will update description with the final sequence later
      description: null,
    })
      .select().single();

    if (routineError || !routineData) {
      throw new Error(routineError?.message || "Failed to create routine");
    }

    const routineId = routineData.routine_id;
    let finalSequence = [];

    // 2. Process Sequence and Deep Copy Workouts
    if (Array.isArray(exercises)) {
      finalSequence = await Promise.all(exercises.map(async (item) => {
        // Check if item is a workout and needs copying
        // Since this is a NEW routine, ANY workout reference is effectively a template
        // that needs to be copied to this new routine context.
        // Items can be: { type: 'rest', ... } OR { type: 'workout', workout: { id: '...', name: '...' } }

        if (item.type === "workout" && item.workout) {
          // Determine source ID (template ID)
          const sourceWorkoutId = item.workout.id;
          let workoutToCopyDetails = item.workout;

          // Optimization: If we have an ID, we assume it's a saved workout and fetch FULL details (exercises/sets)
          // to make the copy accurate. The frontend might send partial data.
          if (sourceWorkoutId) {
            // Fetch full structure
            const { data: sourceData } = await supabase
              .from("workouts")
              .select(`
                            *,
                            workout_exercises(*, 
                                exercises(*), 
                                exercise_sets(*)
                            )
                        `)
              .eq("workout_id", sourceWorkoutId)
              .maybeSingle();

            if (sourceData) {
              // Re-construct the object shape for creation
              // Sort exercises by position
              const sortedExercises = (sourceData.workout_exercises || []).sort(
                (a: any, b: any) => a.position - b.position
              );

              workoutToCopyDetails = {
                name: sourceData.workout_name,
                exercises: sortedExercises.map((we: any) => ({
                  id: we.exercise_id, // Use existing ID
                  name: we.exercises?.exercise_name,
                  type: we.exercises?.exercise_type,
                  sets: we.exercise_sets?.length || 0,
                  setTargets: (we.exercise_sets || []).sort((a: any, b: any) =>
                    a.set_number - b.set_number
                  ).map((s: any) => s.details),
                  // Fallback
                  reps: we.exercise_sets?.[0]?.details?.reps || 0,
                })),
              };
            }
          }

          // Call create-workout logic (INTERNAL FUNCTION CALL or REPEAT LOGIC?)
          // Since we are in the same deploy bundle, we can't easily "invoke" another edge function locally via URL
          // without full URL. Easier to inline the logic or use a shared lib (not set up here).
          // We will perform the insert manually here.

          // Insert New Private Workout
          const { data: newWorkout } = await supabase
            .from("workouts")
            .insert({
              user_id,
              workout_name: workoutToCopyDetails.name || "Untitled Workout",
              routine_id: routineId, // LINK TO ROUTINE
              notes: JSON.stringify(workoutToCopyDetails.exercises || []),
            })
            .select()
            .single();

          if (newWorkout) {
            // Copy Exercises & Sets
            const exs = workoutToCopyDetails.exercises || [];
            for (let i = 0; i < exs.length; i++) {
              const ex = exs[i];
              // Expect ex.id/name resolved
              let exerciseId = ex.id;
              if (!exerciseId) {
                // try resolve by name
                const { data: existingEx } = await supabase.from("exercises")
                  .select("exercise_id").eq("exercise_name", ex.name || "").eq(
                    "user_id",
                    user_id,
                  ).maybeSingle();
                exerciseId = existingEx?.exercise_id;
                // Just strict: if no ID/Name found, might skip or create.
                if (!exerciseId && ex.name) {
                  const { data: newExRow } = await supabase.from("exercises")
                    .insert({ exercise_name: ex.name, user_id }).select()
                    .single();
                  exerciseId = newExRow?.exercise_id;
                }
              }

              if (exerciseId) {
                const { data: we } = await supabase.from("workout_exercises")
                  .insert({
                    workout_id: newWorkout.workout_id,
                    exercise_id: exerciseId,
                    position: i,
                  }).select().single();

                if (we) {
                  const targets = ex.setTargets || [];
                  const numSets = ex.sets || 1;
                  const setsPayload = [];
                  for (let s = 1; s <= numSets; s++) {
                    setsPayload.push({
                      workout_exercise_id: we.workout_exercise_id,
                      set_number: s,
                      details: targets[s - 1] || { reps: ex.reps || 0 },
                    });
                  }
                  if (setsPayload.length > 0) {
                    await supabase.from("exercise_sets").insert(setsPayload);
                  }
                }
              }
            }

            // Return updated item Structure
            return {
              ...item,
              workout: {
                ...item.workout,
                id: newWorkout.workout_id, // NEW PRIVATE ID
                name: newWorkout.workout_name,
                exercises: exs,
              },
            };
          }
        }
        // Return REST items or untouched if failed
        return item;
      }));
    }

    // 3. Update Routine Description with Final Sequence
    const { data: finalRoutine, error: updateError } = await supabase
      .from("routines")
      .update({ description: JSON.stringify(finalSequence) })
      .eq("routine_id", routineId)
      .select()
      .single();

    if (updateError) {
      throw new Error("Failed to save routine sequence");
    }

    return new Response(JSON.stringify({ data: finalRoutine }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Function error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
