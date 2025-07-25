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
        <h3>Resume &amp; Cover Letter Assistant</h3>
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
          <i className="fas fa-sitemap"></i>
        </div>
        <h3>Argument Builder</h3>
        <Link to="/argument-builder" className="portal-button">
          Open Argument Builder
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-sliders-h"></i>
        </div>
        <h3>Tone Adjuster</h3>
        <Link to="/tone-adjuster" className="portal-button">
          Open Tone Adjuster
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-handshake"></i>
        </div>
        <h3>Negotiation Practice</h3>
        <Link to="/negotiation-practice" className="portal-button">
          Open Negotiation Tool
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-question-circle"></i>
        </div>
        <h3>Question Tutor</h3>
        <Link to="/question-tutor" className="portal-button">
          Open Question Tutor
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-layer-group"></i>
        </div>
        <h3>Flashcard Converter</h3>
        <Link to="/flashcard-converter" className="portal-button">
          Open Flashcard Tool
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-theater-masks"></i>
        </div>
        <h3>Satire &amp; Parody Generator</h3>
        <Link to="/satire-generator" className="portal-button">
          Open Satire Tool
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-file-contract"></i>
        </div>
        <h3>Legal Document Summarizer</h3>
        <Link to="/legal-summarizer" className="portal-button">
          Open Summarizer Tool
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-flask"></i>
        </div>
        <h3>Hypothesis &amp; Experiment Designer</h3>
        <Link to="/hypothesis-generator" className="portal-button">
          Open Designer Tool
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-book-open"></i>
        </div>
        <h3>Scientific Paper Summarizer</h3>
        <Link to="/scientific-paper-summarizer" className="portal-button">
          Open Summarizer Tool
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-square-root-alt"></i>
        </div>
        <h3>Math Proof Assistant</h3>
        <Link to="/math-proof-assistant" className="portal-button">
          Open Assistant
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-bug"></i>
        </div>
        <h3>Bug Report Formatter</h3>
        <Link to="/bug-report-formatter" className="portal-button">
          Open Formatter
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-code"></i>
        </div>
        <h3>Regex Builder</h3>
        <Link to="/regex-builder" className="portal-button">
          Open Builder
        </Link>
      </div>
      <div className="portal-card">
        <div className="portal-icon">
          <i className="fas fa-project-diagram"></i>
        </div>
        <h3>Algorithm Explainer</h3>
        <Link to="/algorithm-explainer" className="portal-button">
          Open Explainer
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
