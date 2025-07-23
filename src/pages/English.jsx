import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const English = () => {
  useEffect(() => {
    // Initialize scripts as needed
    // e.g., window.UI?.init()
  }, [])
  return (
    <>
      <header>
        <h1><i className="fas fa-language"></i> English Exercises Generator</h1>
        <button id="theme-toggle" className="theme-button" aria-label="Toggle dark mode">
          <i className="fas fa-moon"></i>
        </button>
      </header>
      <main>
        <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
        </div>
        {/* Exercise generation form and display sections */}
      </main>
      <footer>
        <p><i className="fas fa-code"></i> English Exercises Generator</p>
        <p><a href="https://supastishn.github.io" target="_blank" rel="noopener noreferrer">See more cool stuff here</a></p>
        <p><a href="https://github.com/supastishn/exam-practice" target="_blank" rel="noopener noreferrer">See the source code</a></p>
      </footer>
    </>
  )
}

export default English
