import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const Debate = () => {
  useEffect(() => {
    // Initialize debate scripts if needed
  }, [])

  return (
    <>
      <header>
        <h1><i className="fas fa-gavel"></i> Debate Mode</h1>
        <button id="theme-toggle" className="theme-button" aria-label="Toggle dark mode">
          <i className="fas fa-moon"></i>
        </button>
      </header>
      <main>
        <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
        </div>
        <section id="debate-setup-section">
          {/* Debate setup form */}
        </section>
        <section id="debate-arena-section">
          {/* Debate arena and transcript */}
        </section>
        <section id="debate-analysis-section">
          {/* Final debate analysis */}
        </section>
      </main>
      <footer>
        <p><i className="fas fa-code"></i> Debate Mode</p>
        <p><a href="https://supastishn.github.io" target="_blank" rel="noopener noreferrer">See more cool stuff here</a></p>
        <p><a href="https://github.com/supastishn/exam-practice" target="_blank" rel="noopener noreferrer">See the source code</a></p>
      </footer>
    </>
  )
}

export default Debate
