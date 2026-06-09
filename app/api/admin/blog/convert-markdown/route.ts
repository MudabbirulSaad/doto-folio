import type { NextRequest } from 'next/server'
import { withScopedAuth } from '@/lib/api/middleware'
import {
  createInternalErrorResponse,
  createSuccessResponse,
  createValidationErrorResponse
} from '@/lib/api/response'
import { convertMarkdownToEditorBlocks } from '@/lib/server/application/blog/editor-tools'

export async function convertMarkdownHandler({ request }: { request: Pick<NextRequest, 'json'> }) {
  try {
    const { content } = await request.json()

    if (!content) {
      return createValidationErrorResponse('Content is required')
    }

    return createSuccessResponse(await convertMarkdownToEditorBlocks(content), 'Markdown converted successfully')
  } catch (error) {
    console.error('Error converting markdown:', error)
    return createInternalErrorResponse(
      'Failed to convert markdown',
      error instanceof Error ? [error.message] : undefined
    )
  }
}

export const POST = withScopedAuth(convertMarkdownHandler, 'blog-tools:convert-markdown')
