import React from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from '../components/ThemeToggle'
import './Home.css'

const Home = () => (
  <>
    <header>
      <h1><i className="fas fa-language"></i> Language Exercise Tools Portal</h1>
      <ThemeToggle />
    </header>
    <div className="portal-container">
      <h2 style={{ textAlign: 'center', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
        Choose a Tool to Get Started
      </h2>
      <div className="portal-grid">
        <div className="portal-card">
          <div className="portal-icon">
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h3>English Exercise Generator</h3>
          <Link to="/english" className="portal-button">
            Open English Tool
          </Link>
        </div>
        <div className="portal-card">
          <div className="portal-icon">
            <i className="fas fa-calculator"></i>
          </div>
          <h3>Math Exercise Generator</h3>
          <Link to="/math" className="portal-button">
            Open Math Tool
          </Link>
        </div>
        <div className="portal-card">
          <div className="portal-icon">
            <i className="fas fa-brain"></i>
          </div>
          <h3>Memorization Quiz Generator</h3>
          <Link to="/memorization" className="portal-button">
            Open Memorization Tool
          </Link>
        </div>
        <div className="portal-card">
          <div className="portal-icon">
            <i className="fas fa-pencil-alt"></i>
          </div>
          <h3>Writing Collaborator</h3>
          <Link to="/writing" className="portal-button">
            Open Writing Tool
          </Link>
        </div>
        <div className="portal-card">
          <div className="portal-icon">
            <i className="fas fa-gavel"></i>
          </div>
          <h3>Debate Mode</h3>
          <Link to="/debate" className="portal-button">
            Open Debate Tool
          </Link>
        </div>
        <div className="portal-card">
          <div className="portal-icon">
            <i className="fas fa-cog"></i>
          </div>
          <h3>Settings</h3>
          <Link to="/settings" className="portal-button">
            Configure Settings
          </Link>
        </div>
      </div>
    </div>
    <footer>
      <p><i className="fas fa-code"></i> Language Exercise Tools</p>
      <p>
        <a href="https://supastishn.github.io" target="_blank" rel="noopener noreferrer">
          See more cool stuff here
        </a> | 
        <a href="https://github.com/supastishn/exam-practice" target="_blank" rel="noopener noreferrer">
          See the source code
        </a>
      </p>
    </footer>
  </>
)

export default Home
