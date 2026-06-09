import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { ApplicationError } from '@/lib/server/domain/errors'

export interface EditorBlock {
  type: string
  data: Record<string, unknown>
}

export interface EditorBlocksData {
  time: number
  blocks: EditorBlock[]
  version: string
}

export interface EditorLinkMetadata {
  success: 1
  meta: {
    title: string
    description: string
    image: {
      url: string
    }
  }
}

export interface UrlMetadataResponse {
  ok: boolean
  status: number
  text(): Promise<string>
}

export type UrlMetadataFetcher = (url: string) => Promise<UrlMetadataResponse>

type MarkdownNode = {
  type: string
  value?: string
  url?: string
  alt?: string
  depth?: number
  ordered?: boolean
  lang?: string
  children?: MarkdownNode[]
}

export async function convertMarkdownToEditorBlocks(markdown: string): Promise<EditorBlocksData> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)

  const tree = processor.parse(markdown) as MarkdownNode
  const blocks: EditorBlock[] = []

  const visitNode = (node: MarkdownNode) => {
    if (node.type === 'root') {
      node.children?.forEach(visitNode)
      return
    }

    if (node.type === 'heading') {
      blocks.push({
        type: 'header',
        data: {
          text: extractText(node),
          level: node.depth
        }
      })
      return
    }

    if (node.type === 'paragraph') {
      const onlyChild = node.children?.length === 1 ? node.children[0] : undefined
      if (onlyChild?.type === 'image') {
        blocks.push(createImageBlock(onlyChild))
        return
      }

      blocks.push({
        type: 'paragraph',
        data: {
          text: extractText(node)
        }
      })
      return
    }

    if (node.type === 'list') {
      blocks.push({
        type: 'list',
        data: {
          style: node.ordered ? 'ordered' : 'unordered',
          items: node.children?.map(listItem => extractText(listItem.children?.[0] || listItem)) || []
        }
      })
      return
    }

    if (node.type === 'code') {
      blocks.push({
        type: 'code',
        data: {
          code: node.value,
          language: node.lang || 'plaintext'
        }
      })
      return
    }

    if (node.type === 'blockquote') {
      blocks.push({
        type: 'quote',
        data: {
          text: node.children?.map(extractText).join('') || '',
          caption: '',
          alignment: 'left'
        }
      })
      return
    }

    if (node.type === 'thematicBreak') {
      blocks.push({ type: 'delimiter', data: {} })
      return
    }

    if (node.type === 'image') {
      blocks.push(createImageBlock(node))
    }
  }

  visitNode(tree)

  return {
    time: Date.now(),
    blocks,
    version: '2.28.2'
  }
}

export async function fetchEditorLinkMetadata(
  rawUrl: string,
  fetcher: UrlMetadataFetcher
): Promise<EditorLinkMetadata> {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    throw new ApplicationError('VALIDATION_ERROR', 'Invalid URL format')
  }

  const response = await fetcher(parsedUrl.toString())
  if (!response.ok) {
    throw new ApplicationError('EXTERNAL_SERVICE_ERROR', 'Failed to fetch URL', [
      `Upstream status: ${response.status}`
    ])
  }

  return extractEditorLinkMetadata(await response.text())
}

export function extractEditorLinkMetadata(html: string): EditorLinkMetadata {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  const descriptionMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i)
  const imageMatch =
    html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i) ||
    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["'][^>]*>/i)

  return {
    success: 1,
    meta: {
      title: titleMatch ? titleMatch[1].trim() : '',
      description: descriptionMatch ? descriptionMatch[1].trim() : '',
      image: {
        url: imageMatch ? imageMatch[1].trim() : ''
      }
    }
  }
}

function createImageBlock(node: MarkdownNode): EditorBlock {
  return {
    type: 'image',
    data: {
      url: node.url,
      caption: node.alt || '',
      withBorder: false,
      withBackground: false,
      stretched: false
    }
  }
}

function extractText(node: MarkdownNode): string {
  if (node.type === 'text') return node.value || ''
  if (node.type === 'inlineCode') return `<code>${node.value || ''}</code>`
  if (node.type === 'strong') return `<b>${node.children?.map(extractText).join('') || ''}</b>`
  if (node.type === 'emphasis') return `<i>${node.children?.map(extractText).join('') || ''}</i>`
  if (node.type === 'delete') return `<s>${node.children?.map(extractText).join('') || ''}</s>`
  if (node.type === 'link') return `<a href="${node.url}">${node.children?.map(extractText).join('') || ''}</a>`
  if (node.type === 'image') return `<img src="${node.url}" alt="${node.alt || ''}" />`
  return node.children?.map(extractText).join('') || ''
}
