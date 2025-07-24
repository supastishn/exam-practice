import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Math = () => {
  const [apiKeyExists, setApiKeyExists] = useState(false)
  // Form state
  const [prompt, setPrompt] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('English')
  const [exerciseType, setExerciseType] = useState('multiple-choice')
  const [mcOptionsCount, setMcOptionsCount] = useState(4)
  const [model, setModel] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [batchCount, setBatchCount] = useState(1)
  const [exerciseCount, setExerciseCount] = useState(5)

  const [exerciseContent, setExerciseContent] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    const key = localStorage.getItem('openai_api_key')
    setApiKeyExists(!!key)
    // Load history from localStorage
    const storedHistory = localStorage.getItem('mathExerciseHistory')
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory))
    }
  }, [])

  const handleFormSubmit = (e) => {
    e.preventDefault()
    // Placeholder for exercise generation logic
    console.log('Generating Math exercise with settings:', { prompt, exerciseType })
    setExerciseContent('<p>Exercise generation is not yet implemented.</p>')
  }

  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>
      {!apiKeyExists ? (
        <section id="credentials-prompt-section">
          <h2><i className="fas fa-key"></i> API Credentials Needed</h2>
          <p>To generate exercises, you need to set up your API credentials.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section id="exercise-generation-section">
            <h2><i className="fas fa-edit"></i> Generate Exercise</h2>
            <form id="exercise-form" onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="prompt"><i className="fas fa-comment-alt"></i> Prompt / Instructions:</label>
                <textarea id="prompt" name="prompt" rows="4" required placeholder="Describe the math exercise..." value={prompt} onChange={e => setPrompt(e.target.value)}></textarea>
              </div>
              {/* Image Upload Placeholder */}
              <div>
                <label htmlFor="target-language"><i className="fas fa-globe"></i> Language for Word Problems:</label>
                <input type="text" id="target-language" name="target-language" value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} />
              </div>
              <div>
                <label htmlFor="exercise-type"><i className="fas fa-list-ul"></i> Exercise Type:</label>
                <select id="exercise-type" name="exercise-type" value={exerciseType} onChange={e => setExerciseType(e.target.value)}>
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="fill-in-the-blank">Fill-in-the-Blank</option>
                  <option value="ai-judger">AI Judger (Explanations)</option>
                </select>
              </div>
              {exerciseType === 'multiple-choice' && (
                <div id="mc-options-count-group">
                  <label htmlFor="mc-options-count"><i className="fas fa-list-ol"></i> Number of Choices (for MC):</label>
                  <input type="number" id="mc-options-count" name="mc-options-count" min="2" max="10" value={mcOptionsCount} onChange={e => setMcOptionsCount(e.target.value)} />
                </div>
              )}
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> OpenAI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <div>
                <label htmlFor="difficulty"><i className="fas fa-chart-line"></i> Difficulty:</label>
                <select id="difficulty" name="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label htmlFor="exercise-count"><i className="fas fa-list-ol"></i> Questions per Exercise:</label>
                <input type="number" id="exercise-count" name="exercise-count" min="1" max="20" value={exerciseCount} onChange={e => setExerciseCount(e.target.value)} />
              </div>
              <button type="submit"><i className="fas fa-magic"></i> Generate Exercise</button>
            </form>
          </section>

          {exerciseContent && (
            <section id="exercise-display-section">
              <h2><i className="fas fa-file-alt"></i> Generated Exercise</h2>
              <div id="exercise-output" dangerouslySetInnerHTML={{ __html: exerciseContent }}></div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default Math
