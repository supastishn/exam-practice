import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Debate = () => {
  const [apiKeyExists, setApiKeyExists] = useState(false)
  const [topic, setTopic] = useState('')
  const [userStance, setUserStance] = useState('for')
  const [model, setModel] = useState('')

  const [debateState, setDebateState] = useState(null) // { topic, userStance, aiStance, transcript, currentTurn }
  const [userArgument, setUserArgument] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState('')

  useEffect(() => {
    const key = localStorage.getItem('openai_api_key')
    setApiKeyExists(!!key)
  }, [])

  const handleSetupSubmit = (e) => {
    e.preventDefault()
    if (!topic.trim()) {
      alert('Please enter a debate topic.')
      return
    }

    const determinedUserStance = userStance === 'random' ? (Math.random() < 0.5 ? 'for' : 'against') : userStance
    const aiStance = determinedUserStance === 'for' ? 'against' : 'for'

    setDebateState({
      topic,
      userStance: determinedUserStance,
      aiStance,
      transcript: [{ speaker: 'system', text: `The debate begins. Topic: "${topic}". User is ${determinedUserStance}, AI is ${aiStance}.` }],
      currentTurn: 'user',
    })
  }

  const handleArgumentSubmit = async (e) => {
    e.preventDefault()
    if (!userArgument.trim() || isLoading) return

    const newTranscript = [...debateState.transcript, { speaker: 'user', text: userArgument }]
    setDebateState({ ...debateState, transcript: newTranscript, currentTurn: 'ai' })
    setUserArgument('')
    setIsLoading(true)

    // API call for AI argument
    try {
      // This logic is a simplified version of what was in api.js
      const { apiKey, baseUrl, defaultModel } = {
        apiKey: localStorage.getItem('openai_api_key'),
        baseUrl: localStorage.getItem('openai_base_url'),
        defaultModel: localStorage.getItem('openai_default_model'),
      }
      const systemPrompt = `You are a skilled debater. The topic is: "${debateState.topic}". Your stance is: ${debateState.aiStance}. Counter the user's arguments and introduce your own points.`
      const messages = [
        { role: 'system', content: systemPrompt },
        ...newTranscript.filter(m => m.speaker !== 'system').map(m => ({
          role: m.speaker === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      ]

      const response = await fetch(`${baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model || defaultModel || 'gpt-3.5-turbo',
          messages,
          max_tokens: 500,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')

      const aiResponse = data.choices[0].message.content
      setDebateState(prevState => ({
        ...prevState,
        transcript: [...prevState.transcript, { speaker: 'ai', text: aiResponse }],
        currentTurn: 'user',
      }))
    } catch (error) {
      console.error('Error getting AI argument:', error)
      setDebateState(prevState => ({
        ...prevState,
        transcript: [...prevState.transcript, { speaker: 'system', text: `Error: ${error.message}` }],
        currentTurn: 'user',
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndDebate = async () => {
    if (!confirm('Are you sure you want to end the debate?')) return
    setIsLoading(true)
    setAnalysis('Analyzing debate...')
    // Simplified analysis API call
    try {
      const { apiKey, baseUrl, defaultModel } = {
        apiKey: localStorage.getItem('openai_api_key'),
        baseUrl: localStorage.getItem('openai_base_url'),
        defaultModel: localStorage.getItem('openai_default_model'),
      }
      const analysisPrompt = `Analyze the following debate transcript on the topic "${debateState.topic}". Provide a summary, critique for both sides, and declare a winner based on the arguments.\n\nTranscript:\n${debateState.transcript.map(m => `${m.speaker}: ${m.text}`).join('\n')}`
      const response = await fetch(`${baseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: model || defaultModel || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: analysisPrompt }],
          max_tokens: 1000,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')
      setAnalysis(data.choices[0].message.content)
    } catch (error) {
      setAnalysis(`Error analyzing debate: ${error.message}`)
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
          <p>To use Debate Mode, you need to set up your API credentials.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : !debateState ? (
        <section id="debate-setup-section">
          <h2><i className="fas fa-cogs"></i> Debate Setup</h2>
          <form id="debate-setup-form" onSubmit={handleSetupSubmit}>
            <div>
              <label htmlFor="debate-topic"><i className="fas fa-bullhorn"></i> Debate Topic:</label>
              <input type="text" id="debate-topic" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="e.g., 'Social media does more good than harm.'" />
            </div>
            <div>
              <label htmlFor="user-stance"><i className="fas fa-hand-paper"></i> Your Stance:</label>
              <select id="user-stance" value={userStance} onChange={e => setUserStance(e.target.value)}>
                <option value="for">For</option>
                <option value="against">Against</option>
                <option value="random">Let AI Decide</option>
              </select>
            </div>
            <div>
              <label htmlFor="debate-model"><i className="fas fa-robot"></i> OpenAI Model (optional):</label>
              <input type="text" id="debate-model" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4.1" />
            </div>
            <button type="submit"><i className="fas fa-play-circle"></i> Start Debate</button>
          </form>
        </section>
      ) : (
        <>
          <section id="debate-arena-section">
            <h2>Debate on: {debateState.topic}</h2>
            <p><strong>Your Stance:</strong> {debateState.userStance} | <strong>AI's Stance:</strong> {debateState.aiStance}</p>
            <div id="debate-transcript">
              {debateState.transcript.map((msg, index) => (
                <div key={index} className={`transcript-message ${msg.speaker}-message`}>
                  <span className="message-speaker">{msg.speaker}</span>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>
            <form id="debate-input-form" onSubmit={handleArgumentSubmit}>
              <textarea id="user-argument-input" rows="5" placeholder="Enter your argument..." value={userArgument} onChange={e => setUserArgument(e.target.value)} disabled={isLoading || debateState.currentTurn !== 'user'} />
              <div className="form-buttons" style={{ marginTop: '1rem' }}>
                <button type="submit" id="submit-argument-button" disabled={isLoading || debateState.currentTurn !== 'user'}>
                  {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Thinking...</> : <><i className="fas fa-paper-plane"></i> Submit Argument</>}
                </button>
                <button type="button" id="end-debate-button" onClick={handleEndDebate} disabled={isLoading}><i className="fas fa-flag-checkered"></i> End Debate & Analyze</button>
              </div>
            </form>
          </section>
          {analysis && (
            <section id="debate-analysis-section">
              <h2><i className="fas fa-chart-bar"></i> Debate Analysis</h2>
              <div id="debate-analysis-output" className="solution-box" style={{ whiteSpace: 'pre-wrap' }}>{analysis}</div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default Debate
