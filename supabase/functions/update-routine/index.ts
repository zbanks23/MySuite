
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
    const { routine_id, user_id } = body || {};
    // Allow routine_name from body
    const routine_name = body.routine_name;
    const exercises = body.exercises; // Sequence

    if (!routine_id || !user_id) {
       return new Response(JSON.stringify({ error: "Missing routine_id or user_id" }), { status: 400 });
    }

    // 1. Update Routine Name (if provided)
    if (routine_name) {
       const { error: updateErr } = await supabase.from("routines").update({ routine_name: routine_name.trim() })
          .eq("routine_id", routine_id)
          .eq("user_id", user_id);
       if (updateErr) throw new Error("Failed to update routine name");
    }

    let finalSequence = exercises || [];

    // 2. Process Sequence - Deep Copy NEW templates
    if (Array.isArray(exercises)) {
        finalSequence = await Promise.all(exercises.map(async (item) => {
             if (item.type === 'workout' && item.workout) {
                 const currentWorkoutId = item.workout.id;

                 // CHECK: Does this workout belong to this routine?
                 // If YES -> Keep it (it's already a private copy).
                 // If NO (or if we can't tell) -> We must check DB.
                 
                 let needsCopy = false;
                 if (currentWorkoutId) {
                     const { data: existing } = await supabase
                        .from("workouts")
                        .select("routine_id")
                        .eq("workout_id", currentWorkoutId)
                        .maybeSingle();
                     
                     // If it's undefined, or null, or different routine_id -> it's a template or foreign workout -> COPY
                     if (!existing || existing.routine_id !== routine_id) {
                         needsCopy = true;
                     }
                 } else {
                     // No ID -> New Draft -> Copy/Create
                     needsCopy = true;
                 }


                 if (needsCopy) {
                      // Perform Deep Copy (Logic identical to create-routine)
                      // Fetch Source Details if ID exists
                      let workoutToCopyDetails = item.workout;
                      if (currentWorkoutId) {
                            const { data: sourceData } = await supabase
                                .from("workouts")
                                .select(`*, workout_exercises(*, exercises(*), exercise_sets(*))`)
                                .eq("workout_id", currentWorkoutId)
                                .maybeSingle();
                            
                            if (sourceData) {
                                 const sortedExercises = (sourceData.workout_exercises || []).sort((a: any, b: any) => a.position - b.position);
                                 workoutToCopyDetails = {
                                     name: sourceData.workout_name,
                                     exercises: sortedExercises.map((we: any) => ({
                                         id: we.exercise_id,
                                         name: we.exercises?.exercise_name,
                                         type: we.exercises?.exercise_type,
                                         sets: we.exercise_sets?.length || 0,
                                         setTargets: (we.exercise_sets || []).sort((a:any, b:any) => a.set_number - b.set_number).map((s:any) => s.details),
                                         reps: we.exercise_sets?.[0]?.details?.reps || 0
                                     }))
                                 };
                            }
                      }

                      // Create Private Workout
                      const { data: newWorkout } = await supabase
                        .from("workouts")
                        .insert({
                            user_id,
                            workout_name: workoutToCopyDetails.name || "Untitled Workout",
                            routine_id: routine_id, // LINK TO ROUTINE
                            notes: JSON.stringify(workoutToCopyDetails.exercises || [])
                        })
                        .select()
                        .single();

                      if (newWorkout) {
                           // Copy Exercises
                           const exs = workoutToCopyDetails.exercises || [];
                           for (let i = 0; i < exs.length; i++) {
                               const ex = exs[i];
                               let exerciseId = ex.id;
                               if (!exerciseId) {
                                     const { data: existingEx } = await supabase.from("exercises").select("exercise_id").eq("exercise_name", ex.name || "").eq("user_id", user_id).maybeSingle();
                                     exerciseId = existingEx?.exercise_id;
                                     if (!exerciseId && ex.name) {
                                          const { data: newExRow } = await supabase.from("exercises").insert({ exercise_name: ex.name, user_id }).select().single();
                                          exerciseId = newExRow?.exercise_id;
                                     }
                               }

                               if (exerciseId) {
                                   const { data: we } = await supabase.from("workout_exercises").insert({
                                       workout_id: newWorkout.workout_id,
                                       exercise_id: exerciseId,
                                       position: i
                                   }).select().single();

                                   if (we) {
                                       const targets = ex.setTargets || [];
                                       const numSets = ex.sets || 1;
                                       const setsPayload = [];
                                       for(let s=1; s<=numSets; s++){
                                           setsPayload.push({
                                               workout_exercise_id: we.workout_exercise_id,
                                               set_number: s,
                                               details: targets[s-1] || { reps: ex.reps || 0 }
                                           });
                                       }
                                       if(setsPayload.length>0) await supabase.from("exercise_sets").insert(setsPayload);
                                   }
                               }
                           }
                           
                           return {
                               ...item,
                               workout: {
                                   ...item.workout,
                                   id: newWorkout.workout_id, // NEW ID
                                   name: newWorkout.workout_name,
                                   exercises: exs
                               }
                           };
                      }
                 }
             }
             return item;
        }));
    }

    // 3. Update Sequence
    const { data: finalRoutine, error: updateError } = await supabase
        .from("routines")
        .update({ description: JSON.stringify(finalSequence) })
        .eq("routine_id", routine_id)
        .select()
        .single();
    
    if (updateError) throw new Error(updateError.message);

    return new Response(JSON.stringify({ data: finalRoutine }), {
      status: 200,
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
