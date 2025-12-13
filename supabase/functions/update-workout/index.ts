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
            return new Response(
                JSON.stringify({ error: "Method not allowed" }),
                {
                    status: 405,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        const body = await req.json().catch(() => null);
        const { workout_id, workout_name, exercises, user_id } = body || {};

        if (!workout_id || typeof workout_id !== "string") {
            return new Response(
                JSON.stringify({ error: "Missing `workout_id`" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }
        if (!user_id || typeof user_id !== "string") {
            return new Response(
                JSON.stringify({ error: "Missing `user_id`" }),
                {
                    status: 400,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        // 1. Update Workout Header
        const { data: workoutData, error: workoutError } = await supabase
            .from("workouts")
            .update({
                workout_name: workout_name ? workout_name.trim() : undefined,
                notes: exercises ? JSON.stringify(exercises) : undefined, // Keep JSON fallback
            })
            .eq("workout_id", workout_id)
            .eq("user_id", user_id) // Security check
            .select()
            .single();

        if (workoutError || !workoutData) {
            throw new Error(
                workoutError?.message || "Failed to update workout",
            );
        }

        // 2. Refresh Exercises (Delete Old -> Insert New)
        // Only if exercises array is provided
        if (Array.isArray(exercises)) {
            // Delete existing workout_exercises
            const { error: delErr } = await supabase
                .from("workout_exercises")
                .delete()
                .eq("workout_id", workout_id);

            if (delErr) {
                console.warn("Failed to clear old exercises", delErr);
                // We continue? Or throw? Best to continue and try to fix state by overwriting.
            }

            // Insert New Exercises (Same logic as create-workout)
            for (let i = 0; i < exercises.length; i++) {
                const ex = exercises[i];

                // Find or Create Exercise
                let exerciseId = ex.id;

                if (!exerciseId || exerciseId.length < 10) {
                    const { data: existing } = await supabase
                        .from("exercises")
                        .select("exercise_id")
                        .ilike("exercise_name", ex.name)
                        .eq("user_id", user_id)
                        .maybeSingle();

                    if (existing) {
                        exerciseId = existing.exercise_id;
                    } else {
                        const { data: newEx } = await supabase
                            .from("exercises")
                            .insert([{
                                exercise_name: ex.name,
                                exercise_type: ex.type || "bodyweight_reps",
                                user_id: user_id,
                            }])
                            .select()
                            .single();
                        exerciseId = newEx?.exercise_id;
                    }
                }

                if (!exerciseId) continue;

                const { data: weData, error: weErr } = await supabase
                    .from("workout_exercises").insert([{
                        workout_id: workout_id,
                        exercise_id: exerciseId,
                        position: i,
                    }]).select().single();

                if (weErr || !weData) continue;

                const numSets = ex.sets || 1;
                const targets = ex.setTargets || [];

                const setsPayload = [];
                for (let s = 1; s <= numSets; s++) {
                    const detail = targets[s - 1] || { reps: ex.reps };
                    setsPayload.push({
                        workout_exercise_id: weData.workout_exercise_id,
                        set_number: s,
                        details: detail,
                    });
                }

                if (setsPayload.length > 0) {
                    await supabase.from("exercise_sets").insert(setsPayload);
                }
            }
        }

        return new Response(JSON.stringify({ data: workoutData }), {
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
