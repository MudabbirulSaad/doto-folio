import { NextResponse } from 'next/server'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'

// Helper to extract text from nodes (handling inline styles)
function extractText(node: any): string {
    if (node.type === 'text') return node.value
    if (node.type === 'inlineCode') return `<code>${node.value}</code>`
    if (node.type === 'strong') return `<b>${node.children.map(extractText).join('')}</b>`
    if (node.type === 'emphasis') return `<i>${node.children.map(extractText).join('')}</i>`
    if (node.type === 'delete') return `<s>${node.children.map(extractText).join('')}</s>`
    if (node.type === 'link') return `<a href="${node.url}">${node.children.map(extractText).join('')}</a>`
    if (node.type === 'image') return `<img src="${node.url}" alt="${node.alt || ''}" />`
    if (node.children) return node.children.map(extractText).join('')
    return ''
}

export async function POST(request: Request) {
    try {
        const { content } = await request.json()

        if (!content) {
            return NextResponse.json({ error: 'Content is required' }, { status: 400 })
        }

        const processor = unified()
            .use(remarkParse)
            .use(remarkGfm)

        const tree = processor.parse(content)
        const blocks: any[] = []

        // Traverse the AST and create EditorJS blocks
        const visit = (node: any) => {
            if (node.type === 'root') {
                node.children.forEach(visit)
            } else if (node.type === 'heading') {
                blocks.push({
                    type: 'header',
                    data: {
                        text: extractText(node),
                        level: node.depth
                    }
                })
            } else if (node.type === 'paragraph') {
                // Check if paragraph contains only an image
                if (node.children.length === 1 && node.children[0].type === 'image') {
                    blocks.push({
                        type: 'image',
                        data: {
                            url: node.children[0].url,
                            caption: node.children[0].alt || '',
                            withBorder: false,
                            withBackground: false,
                            stretched: false
                        }
                    })
                } else {
                    blocks.push({
                        type: 'paragraph',
                        data: {
                            text: extractText(node)
                        }
                    })
                }
            } else if (node.type === 'list') {
                const style = node.ordered ? 'ordered' : 'unordered'
                const items = node.children.map((listItem: any) => {
                    // List items usually have a paragraph as a child
                    const content = listItem.children[0]
                    return extractText(content)
                })
                blocks.push({
                    type: 'list',
                    data: {
                        style,
                        items
                    }
                })
            } else if (node.type === 'code') {
                blocks.push({
                    type: 'code',
                    data: {
                        code: node.value,
                        language: node.lang || 'plaintext'
                    }
                })
            } else if (node.type === 'blockquote') {
                blocks.push({
                    type: 'quote',
                    data: {
                        text: node.children.map(extractText).join(''),
                        caption: '',
                        alignment: 'left'
                    }
                })
            } else if (node.type === 'thematicBreak') {
                blocks.push({
                    type: 'delimiter',
                    data: {}
                })
            } else if (node.type === 'image') {
                blocks.push({
                    type: 'image',
                    data: {
                        url: node.url,
                        caption: node.alt || '',
                        withBorder: false,
                        withBackground: false,
                        stretched: false
                    }
                })
            }
        }

        visit(tree)

        return NextResponse.json({
            time: Date.now(),
            blocks,
            version: "2.28.2"
        })

    } catch (error) {
        console.error('Error converting markdown:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
