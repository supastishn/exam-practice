import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Writing = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  const [noteTopic, setNoteTopic] = useState('')
  const [wordCount, setWordCount] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [writingModel, setWritingModel] = useState('')
  const [userWriting, setUserWriting] = useState('')
  const [feedback, setFeedback] = useState('')
  const [showPracticeSection, setShowPracticeSection] = useState(false)

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleTopicSubmit = (e) => {
    e.preventDefault()
    if (!noteTopic.trim()) {
      alert('Please enter a title.')
      return
    }
    setShowPracticeSection(true)
  }

  const handleFeedbackSubmit = () => {
    // Placeholder for feedback submission logic
    console.log('Submitting for feedback:', { noteTopic, userWriting })
    setFeedback('Feedback generation is not yet implemented.')
  }

  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>

      {!isConfigured ? (
        <section id="credentials-prompt-section">
          <h2><i className="fas fa-key"></i> API Provider Not Configured</h2>
          <p>To use the Writing Collaborator, you need to select a provider in settings.</p>
          <p>You can use the free AI Hack Club provider or your own custom API key.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section id="writing-setup-section" style={{ display: showPracticeSection ? 'none' : 'block' }}>
            <h2><i className="fas fa-lightbulb"></i> Choose Note Title</h2>
            <form id="topic-generation-form" onSubmit={handleTopicSubmit}>
              <div>
                <label htmlFor="note-topic">Note Topic / Title:</label>
                <input type="text" id="note-topic" value={noteTopic} onChange={e => setNoteTopic(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="note-word-count">Approximate Word Count (optional):</label>
                <input type="number" id="note-word-count" value={wordCount} onChange={e => setWordCount(e.target.value)} />
              </div>
              <div>
                <label htmlFor="note-grade-level">Approximate Grade Level (optional):</label>
                <input type="text" id="note-grade-level" value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} />
              </div>
              <div>
                <label htmlFor="writing-model">OpenAI Model (optional):</label>
                <input type="text" id="writing-model" value={writingModel} onChange={e => setWritingModel(e.target.value)} />
              </div>
              <button type="submit">Start Writing</button>
            </form>
          </section>

          {showPracticeSection && (
            <>
              <section id="writing-practice-section">
                <h2><i className="fas fa-pencil-alt"></i> Writing Area</h2>
                <h3>Topic: {noteTopic}</h3>
                <div className="timer-controls">
                  <label htmlFor="timer-duration-input">Set Timer (minutes):</label>
                  <input type="number" id="timer-duration-input" min="1" />
                  <button id="start-timer-button"><i className="fas fa-play"></i> Start</button>
                  <button id="pause-timer-button" style={{ display: 'none' }}><i className="fas fa-pause"></i> Pause</button>
                  <button id="reset-timer-button"><i className="fas fa-undo"></i> Reset</button>
                  <div id="timer-display" className="timer-display">00:00</div>
                </div>
                <textarea id="user-writing-area" rows="15" placeholder="Start writing here..." value={userWriting} onChange={e => setUserWriting(e.target.value)}></textarea>
                <button id="submit-writing-button" onClick={handleFeedbackSubmit}><i className="fas fa-check"></i> Grade My Writing</button>
              </section>

              <section id="feedback-display-section" style={{ display: feedback ? 'block' : 'none' }}>
                <h2><i className="fas fa-tasks"></i> Writing Feedback</h2>
                <div className="feedback-tabs">
                  <button className="tab-button active" data-tab="assessment">Assessment</button>
                  <button className="tab-button" data-tab="revision">Full Revision</button>
                  <button className="tab-button" data-tab="diff">Line-by-Line</button>
                </div>

                <div id="assessment-tab" className="tab-content active">
                  <div id="feedback-output">{feedback}</div>
                </div>
                <div id="revision-tab" className="tab-content">
                  <div id="revised-text-output"></div>
                </div>
                <div id="diff-tab" className="tab-content">
                  <pre id="diff-pre"></pre>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </main>
  )
}

export default Writing
