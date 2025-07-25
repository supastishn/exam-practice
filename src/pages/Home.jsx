import React from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

const Home = () => (
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
          <i className="fas fa-search"></i>
        </div>
        <h3>Fallacy Detector</h3>
        <Link to="/fallacy-detector" className="portal-button">
          Open Fallacy Detector
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-language"></i>
        </div>
        <h3>Translation Practice Tool</h3>
        <Link to="/translation-practice" className="portal-button">
          Open Translation Tool
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-briefcase"></i>
        </div>
        <h3>Resume & Cover Letter Assistant</h3>
        <Link to="/resume-assistant" className="portal-button">
          Open Resume Assistant
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-balance-scale"></i>
        </div>
        <h3>Ethical Dilemma Simulator</h3>
        <Link to="/ethical-dilemma" className="portal-button">
          Open Ethical Dilemma Tool
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-scroll"></i>
        </div>
        <h3>Historical "What If" Scenarios</h3>
        <Link to="/historical-what-if" className="portal-button">
          Open Historical Tool
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-comments"></i>
        </div>
        <h3>Conversation Simulator</h3>
        <Link to="/conversation" className="portal-button">
          Open Conversation Tool
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
)

export default Home
