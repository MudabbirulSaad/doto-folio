import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Redirect to the favicon.ico file in the app directory
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/favicon.ico'
    }
  })
}
