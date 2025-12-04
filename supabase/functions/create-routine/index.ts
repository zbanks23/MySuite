// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

// Simple Supabase Edge Function to create a `routine` record.
// Expects JSON POST body with at least:
//   { "title": "My Routine", "user_id": "uuid", "exercises": [...] }
// For local testing:
// 1. Run `supabase start`
// 2. Invoke with:
//
// curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-routine' \
//   --header 'Content-Type: application/json' \
//   --data '{"title":"Upper Body","user_id":"<user-uuid>","exercises":[]}'

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_SERVICE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ??
  "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "Supabase URL or key not found in environment. Function will still load but DB operations will fail.",
  );
}

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
        JSON.stringify({ error: "Missing `user_id` (provide a user UUID)" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Map exercises to description as JSON string, matching frontend behavior
    const description = exercises ? JSON.stringify(exercises) : null;

    const payload: Record<string, unknown> = {
      routine_name: name,
      user_id,
      description,
    };

    const { data, error } = await supabase.from("routines").insert(payload)
      .select().single();
    if (error) {
      console.error("DB insert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
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
