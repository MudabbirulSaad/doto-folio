import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import type {
    Blockquote,
    Delete,
    Emphasis,
    Heading,
    Image,
    InlineCode,
    Link,
    ListItem,
    Root,
    RootContent,
    Strong,
    Text
} from 'mdast'

type MarkdownBlock = Root | RootContent
type MarkdownTextNode =
    | Blockquote
    | Delete
    | Emphasis
    | Heading
    | Image
    | InlineCode
    | Link
    | ListItem
    | Root
    | RootContent
    | Strong
    | Text
type MarkdownParentNode = Extract<MarkdownTextNode, { children: MarkdownTextNode[] }>

type EditorBlock =
    | { type: 'header'; data: { text: string; level: Heading['depth'] } }
    | { type: 'paragraph'; data: { text: string } }
    | { type: 'list'; data: { style: 'ordered' | 'unordered'; items: string[] } }
    | { type: 'code'; data: { code: string; language: string } }
    | { type: 'quote'; data: { text: string; caption: string; alignment: 'left' } }
    | { type: 'delimiter'; data: Record<string, never> }
    | {
        type: 'image'
        data: {
            file: { url: string }
            caption: string
            withBorder: false
            withBackground: false
            stretched: false
        }
    }

export async function markdownToBlocks(markdown: string) {
    const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)

    const tree = processor.parse(markdown) as Root
    const blocks: EditorBlock[] = []

    visit(tree, (node: MarkdownBlock) => {
        // Skip root node
        if (node.type === 'root') return

        // Handle different node types
        switch (node.type) {
            case 'heading':
                blocks.push({
                    type: 'header',
                    data: {
                        text: extractText(node),
                        level: node.depth
                    }
                })
                return 'skip' // Don't visit children

            case 'paragraph':
                // Skip empty paragraphs or paragraphs inside other blocks (handled by extractText)
                // But top-level paragraphs should be blocks
                blocks.push({
                    type: 'paragraph',
                    data: {
                        text: extractText(node)
                    }
                })
                return 'skip'

            case 'list':
                const items = node.children.map((listItem: ListItem) => {
                    // Handle nested content in list items
                    // For simplicity, we'll extract text, but EditorJS list items can be strings
                    return extractText(listItem)
                })

                blocks.push({
                    type: 'list',
                    data: {
                        style: node.ordered ? 'ordered' : 'unordered',
                        items: items
                    }
                })
                return 'skip'

            case 'code':
                blocks.push({
                    type: 'code',
                    data: {
                        code: node.value,
                        language: node.lang || ''
                    }
                })
                return 'skip'

            case 'blockquote':
                blocks.push({
                    type: 'quote',
                    data: {
                        text: extractText(node),
                        caption: '', // Markdown blockquotes don't strictly have captions
                        alignment: 'left'
                    }
                })
                return 'skip'

            case 'thematicBreak':
                blocks.push({
                    type: 'delimiter',
                    data: {}
                })
                return 'skip'

            case 'image':
                blocks.push({
                    type: 'image',
                    data: {
                        file: {
                            url: node.url
                        },
                        caption: node.alt || '',
                        withBorder: false,
                        withBackground: false,
                        stretched: false
                    }
                })
                return 'skip'

            // Add more cases as needed (table, etc.)
        }
    })

    return {
        time: Date.now(),
        blocks: blocks,
        version: "2.28.2"
    }
}

// Helper to extract text from a node and its children, preserving some inline formatting
function hasMarkdownChildren(node: MarkdownTextNode): node is MarkdownParentNode {
    return 'children' in node && Array.isArray(node.children)
}

function extractText(node: MarkdownTextNode): string {
    if (node.type === 'text') return node.value
    if (node.type === 'inlineCode') return `<code class="inline-code">${node.value}</code>`
    if (node.type === 'strong') return `<b>${node.children.map(extractText).join('')}</b>`
    if (node.type === 'emphasis') return `<i>${node.children.map(extractText).join('')}</i>`
    if (node.type === 'delete') return `<s>${node.children.map(extractText).join('')}</s>`
    if (node.type === 'link') return `<a href="${node.url}">${node.children.map(extractText).join('')}</a>`
    if (node.type === 'image') return `<img src="${node.url}" alt="${node.alt || ''}" />`

    if (hasMarkdownChildren(node)) {
        return node.children.map(extractText).join('')
    }

    return ''
}
