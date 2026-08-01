"use client";

import { createBrowserClient } from "@supabase/ssr";
import { fetchWithTimeout } from "@/lib/supabase/fetchWithTimeout";

// This helper creates a Supabase client for Client Components.
// Use it inside "use client" files, like login forms, buttons, and dashboards.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: fetchWithTimeout,
      },
    },
  );
}
