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
        const { routine_id, user_id } = body || {};

        if (!routine_id || !user_id) {
            return new Response(
                JSON.stringify({ error: "Missing routine_id or user_id" }),
                { status: 400 },
            );
        }

        // 1. Delete the Routine
        const { error: delRoutineErr } = await supabase
            .from("routines")
            .delete()
            .eq("routine_id", routine_id)
            .eq("user_id", user_id);

        if (delRoutineErr) {
            throw new Error(delRoutineErr.message);
        }

        // 2. Cleanup Private Workouts
        // Workouts that have `routine_id` set to this deleted routine are "private" to it.
        // We should delete them to avoid orphans.
        // Note: If postgres cascade is set up, this is automatic. But we enforce it here to be safe and explicit.
        const { error: delWorkoutsErr } = await supabase
            .from("workouts")
            .delete()
            .eq("routine_id", routine_id)
            .eq("user_id", user_id);

        if (delWorkoutsErr) {
            console.warn("Failed to cleanup private workouts", delWorkoutsErr);
            // We don't fail the request, as the main routine is gone.
        }

        return new Response(JSON.stringify({ success: true }), {
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
