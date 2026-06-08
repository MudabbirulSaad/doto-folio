import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

function SmokeCard() {
  return <section aria-label="frontend test harness">Client test harness ready</section>
}

describe('frontend test harness', () => {
  it('renders React components in jsdom', () => {
    render(<SmokeCard />)

    expect(screen.getByRole('region', { name: 'frontend test harness' })).toHaveTextContent(
      'Client test harness ready'
    )
  })
})
