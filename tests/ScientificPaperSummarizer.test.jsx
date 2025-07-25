import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ScientificPaperSummarizer from '../src/pages/ScientificPaperSummarizer'

describe('ScientificPaperSummarizer Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows provider configuration prompt if not configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    render(<MemoryRouter><ScientificPaperSummarizer /></MemoryRouter>)
    expect(screen.getByText('API Provider Not Configured')).toBeInTheDocument()
  })

  it('shows the summarizer form if configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => key === 'openai_api_key' ? 'test-key' : null)
    render(<MemoryRouter><ScientificPaperSummarizer /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Scientific Paper Summarizer/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Paper Text:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Summarize Paper/i })).toBeInTheDocument()
  })
})
