import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import English from '../src/pages/English'

describe('English Page', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows API key prompt if key does not exist', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
    
    render(
      <MemoryRouter>
        <English />
      </MemoryRouter>
    )

    expect(screen.getByText('API Credentials Needed')).toBeInTheDocument()
    expect(screen.getByText('Go to Settings')).toBeInTheDocument()
  })

  it('shows exercise generation form if API key exists', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'openai_api_key') return 'test-key'
      return null // for other keys like history
    })
    
    render(
      <MemoryRouter>
        <English />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /Generate Exercise/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Prompt \/ Instructions:/i)).toBeInTheDocument()
  })

  it('updates prompt field on user input', async () => {
    const user = userEvent.setup()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      if (key === 'openai_api_key') return 'test-key'
      return null
    })

    render(
      <MemoryRouter>
        <English />
      </MemoryRouter>
    )

    const promptTextarea = screen.getByLabelText(/Prompt \/ Instructions:/i)
    await user.type(promptTextarea, 'Test prompt')
    expect(promptTextarea.value).toBe('Test prompt')
  })
})
