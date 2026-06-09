import { NextResponse } from 'next/server'
import { convertMarkdownToEditorBlocks } from '@/lib/server/application/blog/editor-tools'

export async function POST(request: Request) {
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
