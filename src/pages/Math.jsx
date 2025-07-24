import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

const Math = () => {
  useEffect(() => {
    // Initialize scripts as needed
    // e.g., window.UI?.init()
  }, [])
  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>
      <section>
        <h2>Math Exercise Generator</h2>
        <p>This page will contain tools to generate math exercises.</p>
      </section>
    </main>
  )
}

export default Math
