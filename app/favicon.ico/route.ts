// Favicon redirect route

export async function GET() {
  // Redirect to the favicon.ico file in the app directory
  return new Response(null, {
    status: 302,
    headers: {
      'Location': '/favicon.ico'
    }
  })
}
