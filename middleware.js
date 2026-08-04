import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { fetchWithTimeout } from "@/lib/supabase/fetchWithTimeout";

// updateSession refreshes Supabase Auth cookies before protected admin pages load.
// It runs for /admin routes and redirects signed-out visitors to /admin/login.
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headersToSet) {
          // Keep the request cookies in sync for this same request.
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          // Recreate the response, then write Supabase's refreshed cookies onto it.
          supabaseResponse = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });

          // Supabase may send cache headers when auth cookies change.
          Object.entries(headersToSet).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value);
          });
        },
      },
      global: {
        fetch: fetchWithTimeout,
      },
    },
  );

  let user = null;

  try {
    const {
      data: { user: activeUser },
    } = await supabase.auth.getUser();

    user = activeUser;
  } catch {
    // If Supabase is temporarily unreachable, treat the visitor as signed out
    // instead of letting the admin route hang or show a raw network overlay.
    user = null;
  }

  const pathname = request.nextUrl.pathname;
  const publicAdminPages = [
    "/admin/login",
    "/admin/forgot-password",
    "/admin/reset-password",
  ];
  const isPublicAdminPage = publicAdminPages.some((publicPath) => {
    return pathname.startsWith(publicPath);
  });

  if (!user && !isPublicAdminPage) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export async function middleware(request) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
