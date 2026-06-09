declare module '@editorjs/link' {
  import type { ToolConstructable } from '@editorjs/editorjs'

  const LinkTool: ToolConstructable
  export default LinkTool
}

declare module '@editorjs/embed' {
  import type { ToolConstructable } from '@editorjs/editorjs'

  const Embed: ToolConstructable
  export default Embed
}
