import { NextRequest } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'

// GET - Fetch URL metadata for Editor.js Link Tool
async function fetchUrlHandler({ request }: { request: NextRequest }) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return createErrorResponse('URL parameter is required', 400)
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return createErrorResponse('Invalid URL format', 400)
    }

    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SAAD-Blog-Bot/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      return createErrorResponse('Failed to fetch URL', response.status)
    }

    const html = await response.text()

    // Extract metadata using regex (simple approach)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descriptionMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i) ||
                            html.match(/<meta[^>]*content=["\']([^"']+)["\'][^>]*name=["\']description["\'][^>]*>/i)
    const imageMatch = html.match(/<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i) ||
                      html.match(/<meta[^>]*content=["\']([^"']+)["\'][^>]*property=["\']og:image["\'][^>]*>/i)

    const metadata = {
      success: 1,
      meta: {
        title: titleMatch ? titleMatch[1].trim() : '',
        description: descriptionMatch ? descriptionMatch[1].trim() : '',
        image: {
          url: imageMatch ? imageMatch[1].trim() : ''
        }
      }
    }

    return createSuccessResponse(metadata)

  } catch (error) {
    console.error('Error fetching URL:', error)
    return createErrorResponse('Failed to fetch URL metadata', 500)
  }
}

export const GET = withAuth(fetchUrlHandler)
