import { updateSession } from '@/lib/supabase/middleware'
import { type NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  // Update user's auth session
  const { response, user } = await updateSession(request)

  // Check if this is an admin route (web pages)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Allow access to login page
    if (request.nextUrl.pathname === '/admin/login') {
      return response
    }

    // If not authenticated, redirect to login
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Enhanced security for admin API routes
  if (request.nextUrl.pathname.startsWith('/api/admin')) {
    // Allow auth endpoints (login, verify-recaptcha)
    if (request.nextUrl.pathname.startsWith('/api/admin/auth/')) {
      return response
    }

    // Add security headers for admin API routes
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')

    // Note: Authentication is handled by the withAuth middleware in each route
    // This provides defense in depth
  }

  return response
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
}
