import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

const Debate = () => {
  useEffect(() => {
    // Initialize debate scripts if needed
  }, [])

  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>
      <section id="debate-setup-section">
        <h2>Debate Setup</h2>
        <p>Configure your debate topic and settings here.</p>
      </section>
      <section id="debate-arena-section">
        <h2>Debate Arena</h2>
        <p>The debate will take place here.</p>
      </section>
      <section id="debate-analysis-section">
        <h2>Debate Analysis</h2>
        <p>Post-debate analysis will be displayed here.</p>
      </section>
    </main>
  )
}

export default Debate
