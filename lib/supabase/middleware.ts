import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const responseCookies: Parameters<SetAllCookies>[0] = []
  const responseHeaders = new Headers()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          responseCookies.push(...cookiesToSet)
          Object.entries(headers).forEach(([name, value]) => responseHeaders.set(name, value))
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const { data: { user } } = await supabase.auth.getUser()

  const response = NextResponse.next({ request, headers: responseHeaders })
  responseCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
  return { response, user }
}
