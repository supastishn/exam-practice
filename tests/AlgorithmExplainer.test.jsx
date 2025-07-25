import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import AlgorithmExplainer from '../src/pages/AlgorithmExplainer'

describe('AlgorithmExplainer Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows provider configuration prompt if not configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    render(<MemoryRouter><AlgorithmExplainer /></MemoryRouter>)
    expect(screen.getByText('API Provider Not Configured')).toBeInTheDocument()
  })

  it('shows the explainer form if configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => key === 'openai_api_key' ? 'test-key' : null)
    render(<MemoryRouter><AlgorithmExplainer /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Algorithm Explainer/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Algorithm Name:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Explain Algorithm/i })).toBeInTheDocument()
  })
})
