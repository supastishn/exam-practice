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
      {/* Exercise generation form and display sections */}
    </main>
  )
}

export default Memorization
