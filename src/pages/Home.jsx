import React from 'react'

const Home = () => (
  <>
    <header>
      <h1><i className="fas fa-language"></i> Language Exercise Tools</h1>
      <button id="theme-toggle" className="theme-button" aria-label="Toggle dark mode">
        <i className="fas fa-moon"></i>
      </button>
    </header>
    <main>
      <section id="portal-section">
        <h2>Welcome!</h2>
        <p>Choose an option below to get started:</p>
        <div className="portal-buttons">
          <a href="/english" className="button-like-link portal-button">
            <i className="fas fa-graduation-cap"></i> English Exercise Generator
          </a>
          <a href="/math" className="button-like-link portal-button">
            <i className="fas fa-calculator"></i> Math Exercise Generator
          </a>
          <a href="/memorization" className="button-like-link portal-button">
            <i className="fas fa-brain"></i> Memorization Quiz Generator
          </a>
          <a href="/writing" className="button-like-link portal-button">
            <i className="fas fa-pencil-alt"></i> Writing Playground
          </a>
          <a href="/debate" className="button-like-link portal-button">
            <i className="fas fa-gavel"></i> Debate Mode
          </a>
          <a href="/settings" className="button-like-link portal-button">
            <i className="fas fa-cog"></i> API Key Settings
          </a>
        </div>
      </section>
    </main>
    <footer>
      <p><i className="fas fa-code"></i> Language Exercise Tools</p>
      <p><a href="https://supastishn.github.io" target="_blank" rel="noopener noreferrer">See more cool stuff here</a></p>
      <p><a href="https://github.com/supastishn/exam-practice" target="_blank" rel="noopener noreferrer">See the source code</a></p>
    </footer>
  </>
)

export default Home
