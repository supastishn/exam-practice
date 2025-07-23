import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const Settings = () => {
  useEffect(() => {
    // Initialize settings scripts if needed
  }, [])

  return (
    <>
      <header>
        <h1><i className="fas fa-cog"></i> Settings</h1>
        <button id="theme-toggle" className="theme-button" aria-label="Toggle dark mode">
          <i className="fas fa-moon"></i>
        </button>
      </header>
      <main>
        <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <Link to="/" className="button-like-link"><i className="fas fa-home"></i> Back to Portal</Link>
        </div>
        {/* Settings form components */}
      </main>
      <footer>
        <p><i className="fas fa-code"></i> Settings</p>
      </footer>
    </>
  )
}

export default Settings
