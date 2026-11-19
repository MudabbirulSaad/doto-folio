import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import type { OutputBlockData, OutputData } from '@editorjs/editorjs'
import type { BlockContent, DefinitionContent, PhrasingContent, Root } from 'mdast'

const parser = unified().use(remarkParse).use(remarkGfm)

function unsupported(type: string, line?: number): never {
  const location = line ? ` on line ${line}` : ''
  throw new Error(`The editor cannot convert ${type}${location} without losing content.`)
}

function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function inline(nodes: PhrasingContent[]): string {
  return nodes.map(node => {
    switch (node.type) {
      case 'text': return escapeHtml(node.value).replaceAll('\n', '<br>')
      case 'break': return '<br>'
      case 'strong': return `<b>${inline(node.children)}</b>`
      case 'emphasis': return `<i>${inline(node.children)}</i>`
      case 'link':
        if (node.title || !/^(https?:\/\/|mailto:)/i.test(node.url)) {
          return unsupported('this link', node.position?.start.line)
        }
        return `<a href="${escapeHtml(node.url)}">${inline(node.children)}</a>`
      default: return unsupported(node.type, node.position?.start.line)
    }
  }).join('')
}

function convertBlock(node: Root['children'][number]): OutputBlockData {
  switch (node.type) {
    case 'heading': return { type: 'header', data: { level: node.depth, text: inline(node.children) } }
    case 'paragraph': return { type: 'paragraph', data: { text: inline(node.children) } }
    case 'thematicBreak': return { type: 'delimiter', data: {} }
    case 'code':
      if (node.lang || node.meta) return unsupported('code fence annotations', node.position?.start.line)
      return { type: 'code', data: { code: node.value } }
    case 'blockquote':
      return { type: 'quote', data: { text: singleParagraph(node.children, 'a multi-block quote'), caption: '', alignment: 'left' } }
    case 'list': {
      const items = node.children.map(item => {
        if (item.checked != null) return unsupported('a task list', item.position?.start.line)
        return { content: singleParagraph(item.children, 'a nested or multi-block list item'), meta: {}, items: [] }
      })
      return { type: 'list', data: {
        style: node.ordered ? 'ordered' : 'unordered',
        meta: node.ordered ? { start: node.start ?? 1, counterType: 'numeric' } : {},
        items
      } }
    }
    default: return unsupported(node.type, node.position?.start.line)
  }
}

function singleParagraph(children: (BlockContent | DefinitionContent)[], description: string) {
  if (children.length !== 1 || children[0].type !== 'paragraph') {
    return unsupported(description, children[0]?.position?.start.line)
  }
  return inline(children[0].children)
}

export function markdownToBlocks(markdown: string): OutputData {
  const blocks = parser.parse(markdown).children.map(convertBlock)
  if (!blocks.length) throw new Error('Enter some Markdown before converting.')
  return { blocks }
}

export function convertDraftMarkdown(draft: OutputData): OutputData {
  // Native blocks already have a representation. Only interpret plain-text paragraphs as Markdown.
  const blocks = draft.blocks.flatMap((block, index) => {
    if (block.type !== 'paragraph') return [block]
    const text: unknown = block.data.text
    if (typeof text !== 'string') return unsupported(`paragraph ${index + 1}`)
    const source = text.replace(/<br\s*\/?\s*>/gi, '\n')
    if (!source.trim() || /<\/?[a-z][^>]*>/i.test(source)) return [block]
    try {
      const [first, ...rest] = markdownToBlocks(source).blocks
      const data = first.type === block.type ? { ...block.data, ...first.data } : first.data
      return [{ ...block, ...first, data }, ...rest]
    } catch (error) {
      throw new Error(`Paragraph ${index + 1}. ${error instanceof Error ? error.message : 'Conversion failed.'}`)
    }
  })
  return { ...draft, blocks }
}
