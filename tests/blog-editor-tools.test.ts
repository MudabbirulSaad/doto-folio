import assert from 'node:assert/strict'
import test from 'node:test'
import {
  convertMarkdownToEditorBlocks,
  fetchEditorLinkMetadata,
  type UrlMetadataFetcher
} from '../lib/server/application/blog/editor-tools'
import { ApplicationError } from '../lib/server/domain/errors'

test('convertMarkdownToEditorBlocks converts headings, inline formatting, lists, and images', async () => {
  const result = await convertMarkdownToEditorBlocks(`# Hello **world**

![Hero image](https://example.com/hero.png)

- One
- Two`)

  assert.equal(result.version, '2.28.2')
  assert.equal(typeof result.time, 'number')
  assert.deepEqual(result.blocks, [
    {
      type: 'header',
      data: {
        text: 'Hello <b>world</b>',
        level: 1
      }
    },
    {
      type: 'image',
      data: {
        url: 'https://example.com/hero.png',
        caption: 'Hero image',
        withBorder: false,
        withBackground: false,
        stretched: false
      }
    },
    {
      type: 'list',
      data: {
        style: 'unordered',
        items: ['One', 'Two']
      }
    }
  ])
})

test('fetchEditorLinkMetadata validates URLs and extracts editor link metadata', async () => {
  const fetcher: UrlMetadataFetcher = async url => {
    assert.equal(url, 'https://example.com/post')
    return {
      ok: true,
      status: 200,
      text: async () => `
        <html>
          <head>
            <title>Example Post</title>
            <meta name="description" content="A useful summary">
            <meta property="og:image" content="https://example.com/image.png">
          </head>
        </html>
      `
    }
  }

  const metadata = await fetchEditorLinkMetadata('https://example.com/post', fetcher)

  assert.deepEqual(metadata, {
    success: 1,
    meta: {
      title: 'Example Post',
      description: 'A useful summary',
      image: {
        url: 'https://example.com/image.png'
      }
    }
  })
})

test('fetchEditorLinkMetadata rejects invalid or failed URL metadata fetches', async () => {
  await assert.rejects(
    () => fetchEditorLinkMetadata('notaurl', async () => {
      throw new Error('should not fetch')
    }),
    (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR'
  )

  await assert.rejects(
    () => fetchEditorLinkMetadata('https://example.com/missing', async () => ({
      ok: false,
      status: 404,
      text: async () => ''
    })),
    (error: unknown) => error instanceof ApplicationError && error.code === 'EXTERNAL_SERVICE_ERROR'
  )
})
