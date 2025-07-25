import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import HypothesisGenerator from '../src/pages/HypothesisGenerator'

describe('HypothesisGenerator Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows provider configuration prompt if not configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    render(<MemoryRouter><HypothesisGenerator /></MemoryRouter>)
    expect(screen.getByText('API Provider Not Configured')).toBeInTheDocument()
    expect(screen.getByText('Go to Settings')).toBeInTheDocument()
  })

  it('shows the generator form if configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => key === 'openai_api_key' ? 'test-key' : null)
    render(<MemoryRouter><HypothesisGenerator /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Hypothesis & Experiment Designer/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Your Observation:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generate Hypothesis/i })).toBeInTheDocument()
  })
})
