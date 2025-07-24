import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

const Writing = () => {
  useEffect(() => {
    // Initialize scripts if needed
  }, [])
  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>
      {/* Writing setup, practice, feedback sections */}
    </main>
  )
}

export default Writing
