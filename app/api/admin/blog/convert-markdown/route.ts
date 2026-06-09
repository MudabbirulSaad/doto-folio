import { NextRequest, NextResponse } from 'next/server'
import { withScopedAuth } from '@/lib/api/middleware'
import { convertMarkdownToEditorBlocks } from '@/lib/server/application/blog/editor-tools'

async function convertMarkdownHandler({ request }: { request: NextRequest }) {
  try {
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    return NextResponse.json(await convertMarkdownToEditorBlocks(content))
  } catch (error) {
    console.error('Error converting markdown:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export const POST = withScopedAuth(convertMarkdownHandler, 'blog-tools:convert-markdown')
