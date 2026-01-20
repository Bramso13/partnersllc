import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole } from "@/types/auth";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect /dashboard, /admin, and /agent routes
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/agent");

  if (isProtectedRoute) {
    if (!user) {
      // Redirect to login if not authenticated
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Fetch user profile with role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    const role: UserRole = profile?.role || "CLIENT";

    // Role-based access control
    if (pathname.startsWith("/admin")) {
      // Only ADMIN can access /admin routes
      if (role !== "ADMIN") {
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    } else if (pathname.startsWith("/agent")) {
      // AGENT and ADMIN can access /agent routes
      if (role !== "AGENT" && role !== "ADMIN") {
        const url = request.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    } else if (pathname.startsWith("/dashboard")) {
      // CLIENT and ADMIN can access /dashboard routes
      // AGENTs should use /agent workspace instead
      if (role === "AGENT") {
        const url = request.nextUrl.clone();
        url.pathname = "/agent";
        return NextResponse.redirect(url);
      }
      // ADMIN should be redirected to admin workspace
      // Redirect all /dashboard routes for ADMIN to avoid confusion
      if (role === "ADMIN") {
        const url = request.nextUrl.clone();
        url.pathname = "/admin/analytics";
        return NextResponse.redirect(url);
      }
      // CLIENT can access /dashboard, let them through
    }

    // Store role and status in headers for use in page components
    if (profile) {
      supabaseResponse.headers.set("x-user-role", profile.role);
      supabaseResponse.headers.set("x-user-status", profile.status);
    }
  }

  // Redirect authenticated users away from /login and /register
  if ((pathname === "/login" || pathname === "/register") && user) {
    // Fetch role to redirect to appropriate workspace
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role: UserRole = profile?.role || "CLIENT";
    const url = request.nextUrl.clone();

    // Redirect based on role
    if (role === "ADMIN") {
      url.pathname = "/admin/analytics";
    } else if (role === "AGENT") {
      url.pathname = "/agent";
    } else {
      url.pathname = "/dashboard";
    }

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
