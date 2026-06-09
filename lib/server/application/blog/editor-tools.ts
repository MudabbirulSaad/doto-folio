import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
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
  headers?: {
    get(name: string): string | null
  }
  body?: ReadableStream<Uint8Array> | null
  text(): Promise<string>
}

export type UrlMetadataFetcher = (url: string) => Promise<UrlMetadataResponse>
export type HostnameResolver = (hostname: string) => Promise<string[]>

export interface UrlMetadataOptions {
  resolveHostname?: HostnameResolver
  maxRedirects?: number
  maxBytes?: number
}

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
  fetcher: UrlMetadataFetcher,
  options: UrlMetadataOptions = {}
): Promise<EditorLinkMetadata> {
  const maxRedirects = options.maxRedirects ?? 3
  const maxBytes = options.maxBytes ?? 1024 * 1024
  const resolveHostname = options.resolveHostname ?? resolveHostnameToAddresses
  let currentUrl = await validatePublicHttpUrl(rawUrl, resolveHostname)

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
    const response = await fetcher(currentUrl.toString())
    const redirectLocation = getRedirectLocation(response)

    if (redirectLocation) {
      if (redirectCount === maxRedirects) {
        throw new ApplicationError('EXTERNAL_SERVICE_ERROR', 'Too many URL redirects')
      }

      currentUrl = await validatePublicHttpUrl(
        new URL(redirectLocation, currentUrl).toString(),
        resolveHostname
      )
      continue
    }

    if (!response.ok) {
      throw new ApplicationError('EXTERNAL_SERVICE_ERROR', 'Failed to fetch URL', [
        `Upstream status: ${response.status}`
      ])
    }

    return extractEditorLinkMetadata(await readLimitedResponseText(response, maxBytes))
  }

  throw new ApplicationError('EXTERNAL_SERVICE_ERROR', 'Failed to fetch URL')
}

async function resolveHostnameToAddresses(hostname: string) {
  const records = await lookup(hostname, { all: true, verbatim: true })
  return records.map(record => record.address)
}

async function validatePublicHttpUrl(rawUrl: string, resolveHostname: HostnameResolver) {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(rawUrl)
  } catch {
    throw new ApplicationError('VALIDATION_ERROR', 'Invalid URL format')
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new ApplicationError('VALIDATION_ERROR', 'Only HTTP and HTTPS URLs are supported')
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new ApplicationError('VALIDATION_ERROR', 'URL credentials are not allowed')
  }

  const hostname = parsedUrl.hostname.toLowerCase()
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new ApplicationError('VALIDATION_ERROR', 'Private network URLs are not allowed')
  }

  const directIp = normalizeIpAddress(hostname)
  const addresses = directIp ? [directIp] : await resolveHostname(hostname)
  if (addresses.length === 0 || addresses.some(address => isBlockedIpAddress(address))) {
    throw new ApplicationError('VALIDATION_ERROR', 'Private network URLs are not allowed')
  }

  return parsedUrl
}

function getRedirectLocation(response: UrlMetadataResponse) {
  if (response.status < 300 || response.status >= 400) return null
  return response.headers?.get('location') || null
}

async function readLimitedResponseText(response: UrlMetadataResponse, maxBytes: number) {
  if (!response.body) {
    const text = await response.text()
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new ApplicationError('EXTERNAL_SERVICE_ERROR', 'URL response is too large')
    }
    return text
  }

  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value) continue

    totalBytes += value.byteLength
    if (totalBytes > maxBytes) {
      await reader.cancel()
      throw new ApplicationError('EXTERNAL_SERVICE_ERROR', 'URL response is too large')
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder().decode(bytes)
}

function normalizeIpAddress(hostname: string) {
  const withoutBrackets = hostname.replace(/^\[|\]$/g, '')
  if (withoutBrackets.startsWith('::ffff:')) {
    return withoutBrackets.slice('::ffff:'.length)
  }
  return isIP(withoutBrackets) ? withoutBrackets : null
}

function isBlockedIpAddress(rawAddress: string) {
  const address = normalizeIpAddress(rawAddress)
  if (!address) return true

  if (isIP(address) === 4) {
    const octets = address.split('.').map(Number)
    const [a, b, c] = octets

    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0 && c === 0) ||
      (a === 192 && b === 0 && c === 2) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51 && c === 100) ||
      (a === 203 && b === 0 && c === 113) ||
      a >= 224
    )
  }

  const ipv6 = address.toLowerCase()
  return (
    ipv6 === '::' ||
    ipv6 === '::1' ||
    ipv6.startsWith('fc') ||
    ipv6.startsWith('fd') ||
    ipv6.startsWith('fe80:') ||
    ipv6.startsWith('ff')
  )
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
