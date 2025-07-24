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
        {/* Debate setup form */}
      </section>
      <section id="debate-arena-section">
        {/* Debate arena and transcript */}
      </section>
      <section id="debate-analysis-section">
        {/* Final debate analysis */}
      </section>
    </main>
  )
}

export default Debate
