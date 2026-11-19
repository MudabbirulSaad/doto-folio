import assert from 'node:assert/strict'
import test from 'node:test'
import { convertDraftMarkdown, markdownToBlocks } from '../lib/markdown-converter'

test('converts live paragraphs in place among existing blocks', () => {
  const list = { id: 'list', type: 'list', data: { style: 'unordered', items: ['Unsaved item'] } }
  const code = { id: 'code', type: 'code', data: { code: '## literal code' } }
  const formatted = { id: 'rich', type: 'paragraph', data: { text: '<b>Existing formatting</b>' } }
  const draft = { blocks: [
    list,
    { id: 'text', type: 'paragraph', data: { text: '## Unsaved heading<br><br>New body' } },
    formatted,
    code
  ] }
  const converted = convertDraftMarkdown(draft)
  assert.deepEqual(converted.blocks, [
    list,
    { id: 'text', type: 'header', data: { text: 'Unsaved heading', level: 2 } },
    { type: 'paragraph', data: { text: 'New body' } },
    formatted,
    code
  ])
  assert.equal(draft.blocks.length, 4)
})

test('reports unsupported Markdown anywhere in the draft before replacing blocks', () => {
  const draft = { blocks: [
    { type: 'paragraph', data: { text: '## First change' } },
    { type: 'paragraph', data: { text: '| Name |<br>| --- |<br>| Unsaved |' } }
  ] }
  const original = structuredClone(draft)
  assert.throws(() => convertDraftMarkdown(draft), /Paragraph 2.*table on line 1/)
  assert.deepEqual(draft, original)
  assert.throws(() => markdownToBlocks('- Before\n  - Nested'), /nested or multi-block list item/)
  assert.throws(() => markdownToBlocks('Text ![Diagram](about:blank)'), /image URL on line 1/)
  assert.throws(() => markdownToBlocks('- ![Diagram](/diagram.png)'), /inline image in this block/)
})

test('converts all four paragraph features in place with escaped image metadata', () => {
  const markdown = 'Before **bold**, *italic*, ~~old~~, ![A & "B"](images/map.png "Plan & scope") after.'
  const text = 'Before <b>bold</b>, <i>italic</i>, <s>old</s>, <img src="/blog/images/map.png" alt="A &amp; &quot;B&quot;" title="Plan &amp; scope"> after.'
  assert.deepEqual(markdownToBlocks(markdown).blocks, [{ type: 'paragraph', data: { text } }])
  const draft = { blocks: [{ id: 'edited', type: 'paragraph', data: { text: markdown } }] }
  assert.deepEqual(convertDraftMarkdown(draft).blocks, [{ id: 'edited', type: 'paragraph', data: { text } }])
})
