import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { RichContentRenderer } from '@/components/markdown/markdown-renderer'

function article(...blocks: unknown[]) {
  return render(<RichContentRenderer content={JSON.stringify({ blocks })} policy="trustedBlog" />)
}

it('preserves table structure, inline formatting, literal punctuation and empty cells', () => {
  article(
    { type: 'table', data: { withHeadings: true, content: [['Owner', 'Note'], ['<b>Zoë</b>', '1. *literal* | value'], ['李', '']] } },
    { type: 'table', data: { content: [['One row']] } }
  )
  const [headed, plain] = screen.getAllByRole('table').map(table => within(table))
  expect(headed.getAllByRole('columnheader').map(cell => cell.textContent)).toEqual(['Owner', 'Note'])
  expect(headed.getAllByRole('cell').map(cell => cell.textContent)).toEqual(['Zoë', '1. *literal* | value', '李', ''])
  expect(headed.getByText('Zoë').tagName).toBe('B')
  expect(plain.getByRole('cell')).toHaveTextContent('One row')
  expect(plain.queryByRole('columnheader')).toBeNull()
})

it('preserves nested order, inline links, checklist state and legacy string items', () => {
  article(
    { type: 'list', data: { style: 'ordered', meta: { start: 4, counterType: 'lower-roman' }, items: [
      { content: 'Parent', items: [{ content: '<a href="/guide">Child</a>', items: [{ content: 'Grandchild' }] }] },
      { content: 'Sibling' }
    ] } },
    { type: 'list', data: { style: 'checklist', items: [
      { content: 'Review', meta: { checked: false }, items: [{ content: 'Approve', meta: { checked: true } }] }
    ] } },
    { type: 'list', data: { style: 'unordered', items: ['Older item'] } }
  )
  const root = screen.getByText('Parent').closest('ol')!
  expect(root).toHaveAttribute('start', '4')
  expect(root.style.listStyleType).toBe('lower-roman')
  expect(root.children).toHaveLength(2)
  expect(root.querySelector(':scope > li > ol > li > ol > li')).toHaveTextContent('Grandchild')
  expect(within(root).getByRole('link', { name: 'Child' })).toHaveAttribute('href', '/guide')
  expect(screen.getByRole('checkbox', { name: 'Review' })).not.toBeChecked()
  expect(screen.getByRole('checkbox', { name: 'Approve' })).toBeChecked()
  expect(screen.getByText('Older item').closest('ul')).toBeInTheDocument()
})

it.each([
  ['youtube', 'YouTube', 'https://www.youtube.com/embed/jfKfPfyJRdk?start=12'],
  ['coub', 'Coub', 'https://coub.com/embed/abc12'],
  ['codepen', 'CodePen', 'https://codepen.io/designer/embed/abc123?default-tab=css,result']
])('renders the configured %s player with its saved parameters and caption', (service, name, embed) => {
  article({ type: 'embed', data: { service, embed, caption: '<i>Walkthrough</i>' } })
  expect(screen.getByTitle(`${name} player`)).toHaveAttribute('src', embed)
  expect(screen.getByText('Walkthrough').tagName).toBe('I')
  expect(screen.getByRole('link')).toHaveAttribute('href', embed)
})

it('uses a readable source link when an embed is unsupported or its URL is not a provider player', () => {
  const source = 'https://video.example.com/watch/release'
  const { container } = article(
    { type: 'embed', data: { service: 'video', embed: source, source, caption: 'Release demo' } },
    { type: 'embed', data: { service: 'youtube', embed: source, source } },
    { type: 'embed', data: { service: 'youtube', embed: 'https://www.youtube.com/watch?v=demo' } }
  )
  expect(container.querySelector('iframe')).toBeNull()
  expect(screen.getByText('Release demo')).toBeVisible()
  expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', source)
})

it('only creates players from structured article embeds', () => {
  const { container, rerender } = article({
    type: 'table', data: { content: [['Before <iframe title="inline frame"></iframe> after']] }
  })
  expect(container.querySelector('iframe')).toBeNull()
  expect(screen.getByRole('cell')).toHaveTextContent('Before after')

  const blocks = [{ type: 'embed', data: { service: 'coub', embed: 'https://coub.com/embed/abc12' } }]
  rerender(<RichContentRenderer content={JSON.stringify({ blocks })} policy="userComment" mode="comment" />)
  expect(container.querySelector('iframe')).toBeNull()
})

it('renders saved link metadata and keeps cards with missing metadata readable', () => {
  const url = 'https://docs.example.com/guide'
  article(
    { type: 'linkTool', data: { link: url, meta: { title: 'Guide', description: 'Start here', image: { url: '/cover.jpg' } } } },
    { type: 'linkTool', data: { link: url } },
    { type: 'linkTool', data: { link: 'about:blank', meta: { title: 'Archived guide' } } }
  )
  const card = screen.getByRole('link', { name: 'Guide' })
  expect(card).toHaveAttribute('href', url)
  expect(card).toHaveAccessibleDescription('Start here')
  expect(card.querySelector('img')).toHaveAttribute('src', 'https://docs.example.com/cover.jpg')
  expect(screen.getByRole('link', { name: url })).toHaveAttribute('href', url)
  expect(screen.getByText('Archived guide').closest('a')).toBeNull()
})
