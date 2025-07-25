import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import RegexBuilder from '../src/pages/RegexBuilder'

describe('RegexBuilder Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows provider configuration prompt if not configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    render(<MemoryRouter><RegexBuilder /></MemoryRouter>)
    expect(screen.getByText('API Provider Not Configured')).toBeInTheDocument()
  })

  it('shows the builder form if configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => key === 'openai_api_key' ? 'test-key' : null)
    render(<MemoryRouter><RegexBuilder /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Regex Builder/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Describe what the regex should match:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Build Regex/i })).toBeInTheDocument()
  })
})
