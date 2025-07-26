import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const NegotiationPractice = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Setup state
  const [scenario, setScenario] = useState('')
  const [model, setModel] = useState('')

  // Conversation state
  const [negotiationState, setNegotiationState] = useState(null) // { scenario, transcript }
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState('')
  
  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleSetupSubmit = (e) => {
    e.preventDefault()
    if (!scenario.trim()) {
      alert('Please describe a negotiation scenario.')
      return
    }
    setNegotiationState({
      scenario,
      transcript: [],
    })
  }

  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    if (!userInput.trim() || isLoading) return

    const newTranscript = [...negotiationState.transcript, { speaker: 'user', text: userInput }]
    setNegotiationState({ ...negotiationState, transcript: newTranscript })
    setUserInput('')
    setIsLoading(true)
    
    try {
        const provider = localStorage.getItem('api_provider') || 'custom'
        let fetchUrl, fetchHeaders, fetchModel

        if (provider === 'hackclub') {
            fetchUrl = 'https://ai.hackclub.com/chat/completions'
            fetchHeaders = { 'Content-Type': 'application/json' }
            fetchModel = model || 'mistral-7b-instruct'
        } else {
            const apiKey = localStorage.getItem('openai_api_key')
            const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1'
            const defaultModel = localStorage.getItem('openai_default_model') || 'gpt-3.5-turbo'
            fetchUrl = `${baseUrl}/chat/completions`
            fetchHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
            fetchModel = model || defaultModel
        }

        const systemPrompt = `You are a negotiation partner. You are playing a role in a scenario.
        Scenario: "${negotiationState.scenario}".
        Your role is to respond realistically to the user's negotiation tactics. Be firm but fair, and try to reach a mutually beneficial agreement if possible. Stay in character based on the scenario.`
        
        const messages = [
            { role: 'system', content: systemPrompt },
            ...newTranscript.map(m => ({
                role: m.speaker === 'user' ? 'user' : 'assistant',
                content: m.text
            }))
        ]
        
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify({ model: fetchModel, messages, max_tokens: 400 }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error?.message || 'API Error')
        
        const aiResponse = data.choices[0].message.content
        setNegotiationState(prevState => ({
            ...prevState,
            transcript: [...prevState.transcript, { speaker: 'ai', text: aiResponse }],
        }))

    } catch (error) {
        console.error('Error getting AI response:', error)
        setNegotiationState(prevState => ({
            ...prevState,
            transcript: [...prevState.transcript, { speaker: 'system', text: `Error: ${error.message}` }],
        }))
    } finally {
        setIsLoading(false)
    }
  }

  const handleEndNegotiation = async () => {
    if (!confirm('Are you sure you want to end the negotiation and get feedback?')) return
    setIsLoading(true)
    setAnalysis('Analyzing negotiation...')

    try {
        const provider = localStorage.getItem('api_provider') || 'custom'
        let fetchUrl, fetchHeaders, fetchModel

        if (provider === 'hackclub') {
            fetchUrl = 'https://ai.hackclub.com/chat/completions'
            fetchHeaders = { 'Content-Type': 'application/json' }
            fetchModel = model || 'mistral-7b-instruct'
        } else {
            const apiKey = localStorage.getItem('openai_api_key')
            const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1'
            const defaultModel = localStorage.getItem('openai_default_model') || 'gpt-3.5-turbo'
            fetchUrl = `${baseUrl}/chat/completions`
            fetchHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
            fetchModel = model || defaultModel
        }

        const analysisPrompt = `You are an expert negotiation coach. Analyze the user's performance in the following negotiation based on the scenario: "${negotiationState.scenario}".
        Provide constructive feedback on their strategy, communication, and tactics. What did they do well? What could they improve? Use Markdown for formatting.
        
        Transcript:
        ${negotiationState.transcript.filter(m => m.speaker === 'user').map(m => `User: ${m.text}`).join('\n')}
        `
        
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify({ model: fetchModel, messages: [{ role: 'system', content: analysisPrompt }], max_tokens: 1000 }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error?.message || 'API Error')
        
        setAnalysis(data.choices[0].message.content)

    } catch (error) {
        setAnalysis(`Error analyzing negotiation: ${error.message}`)
    } finally {
        setIsLoading(false)
    }
  }

  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>

      {!isConfigured ? (
        <section>
          <h2><i className="fas fa-key"></i> API Provider Not Configured</h2>
          <p>To use the Negotiation Simulator, you need to select a provider in settings.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : !negotiationState ? (
        <section>
          <h2><i className="fas fa-cogs"></i> Negotiation Setup</h2>
          <form onSubmit={handleSetupSubmit}>
            <div>
              <label htmlFor="negotiation-scenario"><i className="fas fa-bullhorn"></i> Negotiation Scenario:</label>
              <textarea id="negotiation-scenario" rows="4" value={scenario} onChange={e => setScenario(e.target.value)} required placeholder="e.g., 'Negotiating a salary for a software engineer role. I am the candidate, AI is the hiring manager. My target is $120k, they offered $100k.'" />
            </div>
            <div>
              <label htmlFor="negotiation-model"><i className="fas fa-robot"></i> AI Model (optional):</label>
              <input type="text" id="negotiation-model" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4.1" />
            </div>
            <button type="submit"><i className="fas fa-play-circle"></i> Start Negotiation</button>
          </form>
        </section>
      ) : (
        <>
          <section>
            <h2>Scenario: {negotiationState.scenario}</h2>
            <div id="debate-transcript">
              {negotiationState.transcript.map((msg, index) => (
                <div key={index} className={`transcript-message ${msg.speaker}-message`}>
                  <span className="message-speaker">{msg.speaker}</span>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={handleMessageSubmit}>
              <textarea id="user-input" rows="3" placeholder="Type your response..." value={userInput} onChange={e => setUserInput(e.target.value)} disabled={isLoading} />
              <div className="form-buttons" style={{ marginTop: '1rem' }}>
                <button type="submit" id="submit-message-button" disabled={isLoading}>
                  {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Thinking...</> : <><i className="fas fa-paper-plane"></i> Send</>}
                </button>
                <button type="button" id="end-negotiation-button" onClick={handleEndNegotiation} disabled={isLoading}><i className="fas fa-flag-checkered"></i> End & Get Feedback</button>
              </div>
            </form>
          </section>
          {analysis && (
            <section>
              <h2><i className="fas fa-chart-bar"></i> Negotiation Feedback</h2>
              <div className="solution-box">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default NegotiationPractice
