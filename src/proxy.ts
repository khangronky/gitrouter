import { type NextRequest, NextResponse } from 'next/server';
import { AUTH_PATHS, PUBLIC_PATHS } from './constants/common';
import { updateSession } from './lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  const { res, user } = await updateSession(request);

  // If the auth middleware returned a redirect response, return it
  if (res.headers.has('Location')) {
    return res;
  }

  // Skip locale handling for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    return res;
  }

  // Determine if the current path is public
  const isPublicPath =
    request.nextUrl.pathname === '/' ||
    [...PUBLIC_PATHS, ...AUTH_PATHS].some((path) =>
      request.nextUrl.pathname.startsWith(path)
    );

  if (!isPublicPath && !user) {
    const reqOrigin = request.nextUrl.origin;
    const path = request.nextUrl.pathname;

    // Encode the full returnUrl to redirect back after login
    const returnUrl = encodeURIComponent(path);

    // Redirect to the central login page with the returnUrl as a query parameter
    const loginUrl = `${reqOrigin}/login?returnUrl=${returnUrl}`;

    console.log('Redirecting to:', loginUrl);
    const redirectResponse = NextResponse.redirect(loginUrl);

    return redirectResponse;
  }

  const isAuthPath = AUTH_PATHS.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPath && user) {
    const reqOrigin = request.nextUrl.origin;
    const searchParams = request.nextUrl.searchParams;
    const returnUrl = searchParams.get('returnUrl') || '/dashboard';
    const decodedReturnUrl = decodeURIComponent(returnUrl);

    const protectedUrl = `${reqOrigin}${decodedReturnUrl}`;

    console.log('Redirecting to:', protectedUrl);
    const redirectResponse = NextResponse.redirect(protectedUrl);

    return redirectResponse;
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
