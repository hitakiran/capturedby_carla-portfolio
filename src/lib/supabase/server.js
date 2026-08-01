import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { fetchWithTimeout } from "@/lib/supabase/fetchWithTimeout";

// This helper creates a new Supabase client for each Server Component request.
// It reads the user's auth cookies so server-rendered admin pages know who is signed in.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /*
              Server Components cannot always write cookies.
              That is okay here because middleware.js refreshes the session
              before protected /admin pages render.
            */
          }
        },
      },
      global: {
        fetch: fetchWithTimeout,
      },
    },
  );
}
