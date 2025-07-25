import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import Home from '../src/pages/Home'

describe('Home Component', () => {
  it('renders all tool cards', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    )

    // Check for the main heading
    expect(screen.getByText('Choose a Tool to Get Started')).toBeInTheDocument()

    // Check for each portal card link
    expect(screen.getByText('Open English Tool')).toBeInTheDocument()
    expect(screen.getByText('Open Math Tool')).toBeInTheDocument()
    expect(screen.getByText('Open Memorization Tool')).toBeInTheDocument()
    expect(screen.getByText('Open Writing Tool')).toBeInTheDocument()
    expect(screen.getByText('Open Debate Tool')).toBeInTheDocument()
    expect(screen.getByText('Open Translation Tool')).toBeInTheDocument()
    expect(screen.getByText('Open Resume Assistant')).toBeInTheDocument()
    expect(screen.getByText('Open Ethical Dilemma Tool')).toBeInTheDocument()
    expect(screen.getByText('Open Historical Tool')).toBeInTheDocument()
    expect(screen.getByText('Configure Settings')).toBeInTheDocument()
  })
})
