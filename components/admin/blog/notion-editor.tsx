'use client'

import { useEffect, useRef, useState } from 'react'
import EditorJS, { OutputData } from '@editorjs/editorjs'
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

  useEffect(() => {
    if (!holderRef.current) return

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
          class: Header,
          config: {
            placeholder: 'Enter a header',
            levels: [1, 2, 3, 4, 5, 6],
            defaultLevel: 2
          },
          shortcut: 'CMD+SHIFT+H'
        },
        paragraph: {
          class: Paragraph,
          inlineToolbar: true,
          config: {
            placeholder: 'Start writing or press "/" for commands...'
          }
        },
        list: {
          class: List,
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
          class: Table,
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
      },
      autofocus: !readOnly,
      logLevel: 'ERROR' as const
    })

    editorRef.current = editor

    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        editorRef.current.destroy()
        editorRef.current = null
      }
    }
  }, [])

  // Update editor data when prop changes
  useEffect(() => {
    if (isReady && editorRef.current && data) {
      editorRef.current.render(data)
    }
  }, [data, isReady])

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
        className="prose prose-lg max-w-none dark:prose-invert focus:outline-none"
        style={{
          minHeight: '400px',
          fontSize: '16px',
          lineHeight: '1.6',
          color: 'hsl(var(--foreground))',
        }}
      />
      
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
