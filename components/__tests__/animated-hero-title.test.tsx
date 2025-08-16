import { render, screen } from '@testing-library/react'
import { AnimatedHeroTitle } from '../animations'

// Mock GSAP
jest.mock('gsap', () => ({
  gsap: {
    registerPlugin: jest.fn(),
    set: jest.fn(),
    to: jest.fn(),
    timeline: jest.fn(() => ({
      to: jest.fn()
    }))
  },
  ScrollTrigger: {
    getAll: jest.fn(() => []),
  }
}))

describe('AnimatedHeroTitle', () => {
  const defaultProps = {
    text: "I build beautiful and intelligent digital experiences.",
    className: "test-class",
    delay: 0.5
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the title text correctly', () => {
    render(<AnimatedHeroTitle {...defaultProps} />)
    
    // Check if all words are rendered
    expect(screen.getByText('I')).toBeInTheDocument()
    expect(screen.getByText('build')).toBeInTheDocument()
    expect(screen.getByText('beautiful')).toBeInTheDocument()
    expect(screen.getByText('and')).toBeInTheDocument()
    expect(screen.getByText('intelligent')).toBeInTheDocument()
    expect(screen.getByText('digital')).toBeInTheDocument()
    expect(screen.getByText('experiences.')).toBeInTheDocument()
  })

  it('applies the correct className', () => {
    render(<AnimatedHeroTitle {...defaultProps} />)
    
    const titleElement = screen.getByRole('heading')
    expect(titleElement).toHaveClass('test-class')
  })

  it('splits text into individual word spans', () => {
    render(<AnimatedHeroTitle {...defaultProps} />)
    
    const titleElement = screen.getByRole('heading')
    const wordSpans = titleElement.querySelectorAll('span')
    
    // Should have 7 words
    expect(wordSpans).toHaveLength(7)
    
    // Each span should have the correct classes
    wordSpans.forEach(span => {
      expect(span).toHaveClass('inline-block', 'cursor-pointer')
    })
  })

  it('handles empty text gracefully', () => {
    render(<AnimatedHeroTitle text="" className="test-class" />)
    
    const titleElement = screen.getByRole('heading')
    expect(titleElement).toBeInTheDocument()
    expect(titleElement).toHaveClass('test-class')
  })

  it('handles single word text', () => {
    render(<AnimatedHeroTitle text="Hello" className="test-class" />)
    
    expect(screen.getByText('Hello')).toBeInTheDocument()
    
    const titleElement = screen.getByRole('heading')
    const wordSpans = titleElement.querySelectorAll('span')
    expect(wordSpans).toHaveLength(1)
  })
})
