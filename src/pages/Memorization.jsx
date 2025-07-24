import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

const Memorization = () => {
  useEffect(() => {
    // Initialize scripts as needed
  }, [])
  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>
      <section>
        <h2>Memorization Quiz Generator</h2>
        <p>This page will contain tools to generate memorization quizzes.</p>
      </section>
    </main>
  )
}

export default Memorization
