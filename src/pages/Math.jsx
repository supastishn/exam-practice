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
      {/* Exercise generation form and display sections */}
    </main>
  )
}

export default Math
