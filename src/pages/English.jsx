import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const English = () => {
  const [apiKeyExists, setApiKeyExists] = useState(false)
  // Form state
  const [prompt, setPrompt] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('English')
  const [exerciseType, setExerciseType] = useState('multiple-choice')
  const [mcOptionsCount, setMcOptionsCount] = useState(4)
  const [model, setModel] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [exerciseCount, setExerciseCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [exerciseContent, setExerciseContent] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    const key = localStorage.getItem('openai_api_key')
    setApiKeyExists(!!key)
    // Load history from localStorage
    const storedHistory = localStorage.getItem('englishExerciseHistory')
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory))
    }
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setExerciseContent(null)

    const { apiKey, baseUrl, defaultModel } = {
      apiKey: localStorage.getItem('openai_api_key'),
      baseUrl: localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1',
      defaultModel: localStorage.getItem('openai_default_model') || 'gpt-3.5-turbo',
    }

    const systemPrompt = `You are an AI assistant that creates language learning exercises.
Your output MUST be a single block of valid HTML, without any surrounding text, comments, or markdown like \`\`\`html.
The HTML should be structured with divs for each question.
Each question should be in a div with class="question-container".
Inside, include the question text.
For 'multiple-choice', provide radio buttons for options. The name attribute for radio inputs for a given question should be the same, e.g., "q1", "q2".
For 'fill-in-the-blank', use an <input type="text" class="inline-blank"> for the blank.
For 'ai-judger', provide a textarea with class="ai-judger-textarea".
Crucially, include the correct answer within a hidden div: <div class="solution" style="display:none;">The correct answer is: ...</div>. This is vital for checking answers.
For multiple-choice, the solution should state the correct option label (e.g., "C"). For fill-in-the-blank, it should state the word(s) that go in the blank. For AI judger, the solution should provide model criteria for a good answer.`

    const userPrompt = `Please generate an English exercise with the following specifications:
- Exercise Type: ${exerciseType}
- Topic/Instructions: ${prompt}
- Target Language: ${targetLanguage}
- Difficulty: ${difficulty}
- Number of questions: ${exerciseCount}
${exerciseType === 'multiple-choice' ? `- Number of choices per question: ${mcOptionsCount}` : ''}

Generate the HTML now.`

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || defaultModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `API error: ${response.statusText}`)
      }

      const generatedContent = data.choices[0].message.content.replace(/```html/g, '').replace(/```/g, '').trim()
      setExerciseContent(generatedContent)
      
      // Save to history
      const newHistoryItem = {
        id: Date.now(),
        prompt,
        exerciseType,
        difficulty,
        timestamp: new Date().toISOString(),
        content: generatedContent,
      }
      const updatedHistory = [newHistoryItem, ...history]
      setHistory(updatedHistory)
      localStorage.setItem('englishExerciseHistory', JSON.stringify(updatedHistory))

    } catch (err) {
      setError(err.message)
      console.error('Error generating exercise:', err)
    } finally {
      setIsLoading(false)
    }
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
                <textarea id="prompt" name="prompt" rows="4" required placeholder="Describe the exercise you want to create..." value={prompt} onChange={e => setPrompt(e.target.value)}></textarea>
              </div>
              {/* Image Upload Placeholder */}
              <div>
                <label htmlFor="target-language"><i className="fas fa-globe"></i> Target Language:</label>
                <input type="text" id="target-language" name="target-language" value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} />
              </div>
              <div>
                <label htmlFor="exercise-type"><i className="fas fa-list-ul"></i> Exercise Type:</label>
                <select id="exercise-type" name="exercise-type" value={exerciseType} onChange={e => setExerciseType(e.target.value)}>
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="fill-in-the-blank">Fill-in-the-Blank</option>
                  <option value="ai-judger">AI Judger (Sentence/Text)</option>
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
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Generating...</> : <><i className="fas fa-magic"></i> Generate Exercise</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Generating exercise, please wait...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
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

export default English
