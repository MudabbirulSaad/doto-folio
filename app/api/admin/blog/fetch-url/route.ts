import { NextRequest } from 'next/server'
import { withScopedAuth } from '@/lib/api/middleware'
import { createSuccessResponse, createErrorResponse } from '@/lib/api/response'
import { createApplicationOrInternalErrorResponse } from '@/lib/server/adapters/http/errors'
import { fetchEditorLinkMetadata } from '@/lib/server/application/blog/editor-tools'

export const runtime = 'nodejs'

// GET - Fetch URL metadata for Editor.js Link Tool
async function fetchUrlHandler({ request }: { request: NextRequest }) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return createErrorResponse('URL parameter is required', 400)
    }

    const metadata = await fetchEditorLinkMetadata(url, targetUrl => fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SAAD-Blog-Bot/1.0)',
      },
      redirect: 'manual',
      signal: AbortSignal.timeout(10000),
    }))

    return createSuccessResponse(metadata)

  } catch (error) {
    console.error('Error fetching URL:', error)
    return createApplicationOrInternalErrorResponse(error)
  }
}

export const GET = withScopedAuth(fetchUrlHandler, 'blog-tools:fetch-url')
