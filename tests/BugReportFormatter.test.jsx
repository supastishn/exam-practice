import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import BugReportFormatter from '../src/pages/BugReportFormatter'

describe('BugReportFormatter Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows provider configuration prompt if not configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    render(<MemoryRouter><BugReportFormatter /></MemoryRouter>)
    expect(screen.getByText('API Provider Not Configured')).toBeInTheDocument()
  })

  it('shows the formatter form if configured', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => key === 'openai_api_key' ? 'test-key' : null)
    render(<MemoryRouter><BugReportFormatter /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /Bug Report Formatter/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Observed Behavior:/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Expected Behavior:/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Format Report/i })).toBeInTheDocument()
  })
})
