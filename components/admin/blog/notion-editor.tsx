'use client'

import { useEffect, useRef, useState } from 'react'

// Global registry to track active editors and prevent duplicates
const editorRegistry = new Map<string, boolean>()
import EditorJS, { OutputData, type ToolConstructable } from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Paragraph from '@editorjs/paragraph'
import Quote from '@editorjs/quote'
import Code from '@editorjs/code'
import Delimiter from '@editorjs/delimiter'
import Table from '@editorjs/table'
import LinkTool from '@editorjs/link'
import Embed from '@editorjs/embed'

interface NotionEditorProps {
  data?: OutputData
  onChange?: (data: OutputData) => void
  placeholder?: string
  readOnly?: boolean
}

export default function NotionEditor({
  data,
  onChange,
  placeholder = "Tell your story...",
  readOnly = false
}: NotionEditorProps) {
  const editorRef = useRef<EditorJS | null>(null)
  const holderRef = useRef<HTMLDivElement>(null)
  const [isReady, setIsReady] = useState(false)
  const initializingRef = useRef(false)
  const editorIdRef = useRef(`editor-${Math.random().toString(36).substr(2, 9)}`)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!holderRef.current) return

    const editorId = editorIdRef.current

    // Prevent double initialization using global registry
    if (editorRef.current || initializingRef.current || editorRegistry.has(editorId)) {
      return
    }

    // Check if holder already has EditorJS content
    if (holderRef.current.querySelector('.codex-editor')) {
      return
    }

    // Register this editor instance
    editorRegistry.set(editorId, true)
    mountedRef.current = true
    initializingRef.current = true

    // Clear any existing content in the holder
    if (holderRef.current) {
      holderRef.current.innerHTML = ''
    }

    // Initialize Editor.js
    const editor = new EditorJS({
      holder: holderRef.current,
      placeholder,
      readOnly,
      data: data || {
        time: Date.now(),
        blocks: [],
        version: "2.28.2"
      },
      tools: {
        header: {
          class: Header as unknown as ToolConstructable,
          config: {
            placeholder: 'Enter a header',
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 2
          },
          shortcut: 'CMD+SHIFT+H'
        },
        paragraph: {
          class: Paragraph as unknown as ToolConstructable,
          inlineToolbar: true,
          config: {
            placeholder: 'Start writing or press "/" for commands...'
          }
        },
        list: {
          class: List as unknown as ToolConstructable,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered'
          },
          shortcut: 'CMD+SHIFT+L'
        },
        quote: {
          class: Quote,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Enter a quote',
            captionPlaceholder: 'Quote\'s author',
          },
          shortcut: 'CMD+SHIFT+O'
        },
        code: {
          class: Code,
          config: {
            placeholder: 'Enter code here...'
          },
          shortcut: 'CMD+SHIFT+C'
        },
        delimiter: {
          class: Delimiter,
          shortcut: 'CMD+SHIFT+D'
        },
        table: {
          class: Table as unknown as ToolConstructable,
          inlineToolbar: true,
          config: {
            rows: 2,
            cols: 3,
          },
          shortcut: 'CMD+ALT+T'
        },
        linkTool: {
          class: LinkTool,
          config: {
            endpoint: '/api/admin/blog/fetch-url', // You'll need to create this endpoint
          }
        },
        embed: {
          class: Embed,
          config: {
            services: {
              youtube: true,
              coub: true,
              codepen: {
                regex: /https?:\/\/codepen\.io\/([^\/\?\&]*)\/pen\/([^\/\?\&]*)/,
                embedUrl: 'https://codepen.io/<%= remote_id %>?height=300&theme-id=0&default-tab=css,result&embed-version=2',
                html: "<iframe height='300' scrolling='no' frameborder='no' allowtransparency='true' allowfullscreen='true' style='width: 100%;'></iframe>",
                height: 300,
                width: 600,
                id: (groups: string[]) => groups.join('/embed/')
              }
            }
          }
        }
      },
      onChange: async () => {
        if (onChange && editorRef.current) {
          try {
            const outputData = await editorRef.current.save()
            onChange(outputData)
          } catch (error) {
            console.error('Error saving editor data:', error)
          }
        }
      },
      onReady: () => {
        setIsReady(true)
        console.log('Editor.js is ready to work!')

        // Attach markdown shortcuts listener
        const holder = holderRef.current
        if (holder) {
          holder.addEventListener('keyup', handleMarkdownShortcuts)
        }
      },
      autofocus: !readOnly,
      logLevel: 'ERROR' as any
    })

    editorRef.current = editor

    return () => {
      const editorId = editorIdRef.current

      // Remove listener
      if (holderRef.current) {
        holderRef.current.removeEventListener('keyup', handleMarkdownShortcuts)
      }

      if (editorRef.current) {
        try {
          if (typeof editorRef.current.destroy === 'function') {
            editorRef.current.destroy()
          }
        } catch (error) {
          console.error('Error destroying editor:', error)
        } finally {
          editorRef.current = null
          setIsReady(false)
          initializingRef.current = false
          mountedRef.current = false
          // Unregister this editor instance
          editorRegistry.delete(editorId)
        }
      }
    }
  }, [])

  const handleMarkdownShortcuts = async (e: KeyboardEvent) => {
    if (e.key !== ' ') return

    const editor = editorRef.current
    if (!editor) return

    try {
      const index = editor.blocks.getCurrentBlockIndex()
      const block = editor.blocks.getBlockByIndex(index)

      if (!block) return

      const savedData = await block.save()
      if (!savedData) return
      const text = savedData.data.text || ''

      // Check patterns
      if (text === '#') {
        // Header 1 (using level 2 as default big header)
        editor.blocks.insert('header', { text: '', level: 1 }, {}, index, true)
        editor.caret.setToBlock(index)
        editor.blocks.delete(index + 1) // Remove the old block which was pushed down? No, insert with replace=true replaces it? 
        // Actually insert(..., true) replaces.
      } else if (text === '##') {
        editor.blocks.insert('header', { text: '', level: 2 }, {}, index, true)
        editor.caret.setToBlock(index)
      } else if (text === '###') {
        editor.blocks.insert('header', { text: '', level: 3 }, {}, index, true)
        editor.caret.setToBlock(index)
      } else if (text === '*' || text === '-') {
        editor.blocks.insert('list', { style: 'unordered', items: [] }, {}, index, true)
        editor.caret.setToBlock(index)
      } else if (text === '1.') {
        editor.blocks.insert('list', { style: 'ordered', items: [] }, {}, index, true)
        editor.caret.setToBlock(index)
      } else if (text === '>') {
        editor.blocks.insert('quote', { text: '', caption: '' }, {}, index, true)
        editor.caret.setToBlock(index)
      } else if (text === '```') {
        editor.blocks.insert('code', { code: '' }, {}, index, true)
        editor.caret.setToBlock(index)
      }
    } catch (err) {
      console.error('Error handling markdown shortcut:', err)
    }
  }

  // Update editor data when prop changes
  // useEffect(() => {
  //   if (isReady && editorRef.current && data && data.blocks && data.blocks.length > 0) {
  //     // Add a small delay to ensure editor is fully ready
  //     const timer = setTimeout(() => {
  //       if (editorRef.current && typeof editorRef.current.render === 'function') {
  //         editorRef.current.render(data).catch((error: any) => {
  //           console.error('Error rendering editor data:', error)
  //         })
  //       }
  //     }, 100)

  //     return () => clearTimeout(timer)
  //   }
  // }, [data, isReady])

  const save = async (): Promise<OutputData | null> => {
    if (editorRef.current) {
      try {
        return await editorRef.current.save()
      } catch (error) {
        console.error('Error saving editor data:', error)
        return null
      }
    }
    return null
  }

  const clear = async () => {
    if (editorRef.current) {
      try {
        await editorRef.current.clear()
      } catch (error) {
        console.error('Error clearing editor:', error)
      }
    }
  }

  // Expose methods to parent component
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).notionEditor = {
        save,
        clear
      }
    }
  }, [])

  return (
    <div className="notion-editor">
      <div
        ref={holderRef}
        id={editorIdRef.current}
        className="prose prose-lg max-w-none dark:prose-invert focus:outline-none"
        style={{
          minHeight: '400px',
          fontSize: '16px',
          lineHeight: '1.6',
          color: 'hsl(var(--foreground))',
        }}
      />
      {/* Hide duplicate editors created by React Strict Mode */}
      <style jsx>{`
        .notion-editor .codex-editor:not(:first-child) {
          display: none !important;
        }
      `}</style>

      <style jsx global>{`
        .notion-editor .codex-editor {
          z-index: 1;
        }
        
        .notion-editor .codex-editor__redactor {
          padding: 0 !important;
        }
        
        .notion-editor .ce-block__content {
          max-width: none !important;
          margin: 0 !important;
          padding: 8px 0 !important;
        }
        
        .notion-editor .ce-paragraph {
          font-size: 16px !important;
          line-height: 1.6 !important;
          color: hsl(var(--foreground)) !important;
          margin: 0 !important;
          padding: 8px 0 !important;
        }
        
        .notion-editor .ce-header {
          color: hsl(var(--foreground)) !important;
          margin: 16px 0 8px 0 !important;
          font-weight: 600 !important;
        }
        
        .notion-editor .ce-header[data-level="1"] {
          font-size: 2.25rem !important;
          line-height: 1.2 !important;
        }
        
        .notion-editor .ce-header[data-level="2"] {
          font-size: 1.875rem !important;
          line-height: 1.3 !important;
        }
        
        .notion-editor .ce-header[data-level="3"] {
          font-size: 1.5rem !important;
          line-height: 1.4 !important;
        }
        
        .notion-editor .ce-quote {
          border-left: 4px solid hsl(var(--primary)) !important;
          padding-left: 16px !important;
          margin: 16px 0 !important;
          font-style: italic !important;
          color: hsl(var(--muted-foreground)) !important;
        }
        
        .notion-editor .ce-code {
          background: hsl(var(--muted)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          padding: 16px !important;
          margin: 16px 0 !important;
          font-family: var(--font-mono) !important;
          font-size: 14px !important;
          color: hsl(var(--foreground)) !important;
        }
        
        .notion-editor .ce-list {
          margin: 8px 0 !important;
        }
        
        .notion-editor .ce-list__item {
          color: hsl(var(--foreground)) !important;
          line-height: 1.6 !important;
          margin: 4px 0 !important;
        }
        
        .notion-editor .ce-delimiter {
          margin: 32px 0 !important;
          text-align: center !important;
        }
        
        .notion-editor .ce-delimiter::before {
          content: "***" !important;
          color: hsl(var(--muted-foreground)) !important;
          font-size: 24px !important;
        }
        
        .notion-editor .ce-table {
          margin: 16px 0 !important;
        }
        
        .notion-editor .tc-table {
          border-collapse: collapse !important;
          width: 100% !important;
        }
        
        .notion-editor .tc-cell {
          border: 1px solid hsl(var(--border)) !important;
          padding: 8px 12px !important;
          color: hsl(var(--foreground)) !important;
        }
        
        .notion-editor .ce-toolbar__content {
          max-width: none !important;
        }
        
        .notion-editor .ce-inline-toolbar {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          box-shadow: var(--shadow-lg) !important;
        }
        
        .notion-editor .ce-conversion-toolbar {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          box-shadow: var(--shadow-lg) !important;
        }
        
        .notion-editor .ce-settings {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          box-shadow: var(--shadow-lg) !important;
        }
        
        .notion-editor .ce-popover {
          background: hsl(var(--popover)) !important;
          border: 1px solid hsl(var(--border)) !important;
          border-radius: 8px !important;
          box-shadow: var(--shadow-lg) !important;
          color: hsl(var(--popover-foreground)) !important;
        }
        
        .notion-editor .ce-popover__item {
          color: hsl(var(--popover-foreground)) !important;
        }
        
        .notion-editor .ce-popover__item:hover {
          background: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        
        .notion-editor .ce-toolbar__plus {
          color: hsl(var(--muted-foreground)) !important;
        }
        
        .notion-editor .ce-toolbar__plus:hover {
          background: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        
        .notion-editor .ce-toolbar__settings-btn {
          color: hsl(var(--muted-foreground)) !important;
        }
        
        .notion-editor .ce-toolbar__settings-btn:hover {
          background: hsl(var(--accent)) !important;
          color: hsl(var(--accent-foreground)) !important;
        }
        
        .notion-editor .cdx-block {
          padding: 0 !important;
        }
        
        .notion-editor .cdx-block:first-child {
          margin-top: 0 !important;
        }
        
        .notion-editor .ce-block--selected .ce-block__content {
          background: hsl(var(--accent) / 0.1) !important;
          border-radius: 4px !important;
        }
      `}</style>
    </div>
  )
}
