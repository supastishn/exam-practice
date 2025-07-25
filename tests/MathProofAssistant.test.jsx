import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import MathProofAssistant from '../src/pages/MathProofAssistant'

describe('MathProofAssistant Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows provider configuration prompt if not configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    render(<MemoryRouter><MathProofAssistant /></MemoryRouter>)
    expect(screen.getByText('API Provider Not Configured')).toBeInTheDocument()
  })

  it('shows the assistant setup form if configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => key === 'openai_api_key' ? 'test-key' : null)
    render(<MemoryRouter><MathProofAssistant /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Math Proof Assistant/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Statement to Prove:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Start Proof/i })).toBeInTheDocument()
  })
})
