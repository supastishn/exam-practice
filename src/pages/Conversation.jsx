import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const Conversation = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Setup state
  const [scenario, setScenario] = useState('')
  const [model, setModel] = useState('')

  // Conversation state
  const [conversationState, setConversationState] = useState(null) // { scenario, transcript }
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [analysis, setAnalysis] = useState('')
  
  useEffect(() => {
    // Check for API provider config
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleSetupSubmit = (e) => {
    e.preventDefault()
    if (!scenario.trim()) {
      alert('Please describe a scenario.')
      return
    }
    setConversationState({
      scenario,
      transcript: [],
    })
  }

  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    if (!userInput.trim() || isLoading) return

    const newTranscript = [...conversationState.transcript, { speaker: 'user', text: userInput }]
    setConversationState({ ...conversationState, transcript: newTranscript })
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

        const systemPrompt = `You are a conversation partner. The user wants to practice a conversation.
        Scenario: "${conversationState.scenario}".
        Your role is to respond naturally within this scenario. Keep your responses conversational and concise. Stay in character.`
        
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
        setConversationState(prevState => ({
            ...prevState,
            transcript: [...prevState.transcript, { speaker: 'ai', text: aiResponse }],
        }))

    } catch (error) {
        console.error('Error getting AI response:', error)
        setConversationState(prevState => ({
            ...prevState,
            transcript: [...prevState.transcript, { speaker: 'system', text: `Error: ${error.message}` }],
        }))
    } finally {
        setIsLoading(false)
    }
  }

  const handleEndConversation = async () => {
    if (!confirm('Are you sure you want to end the conversation and get feedback?')) return
    setIsLoading(true)
    setAnalysis('Analyzing conversation...')

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

        const analysisPrompt = `You are a helpful language coach. Analyze the user's side of the following conversation based on the scenario: "${conversationState.scenario}".
        Provide constructive feedback on their grammar, tone, clarity, and how well they stayed in character. Use Markdown for formatting.
        
        Transcript:
        ${conversationState.transcript.filter(m => m.speaker === 'user').map(m => `User: ${m.text}`).join('\n')}
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
        setAnalysis(`Error analyzing conversation: ${error.message}`)
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
        <section id="credentials-prompt-section">
          <h2><i className="fas fa-key"></i> API Provider Not Configured</h2>
          <p>To use the Conversation Simulator, you need to select a provider in settings.</p>
          <p>You can use the free AI Hack Club provider or your own custom API key.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : !conversationState ? (
        <section id="conversation-setup-section">
          <h2><i className="fas fa-cogs"></i> Conversation Setup</h2>
          <form id="conversation-setup-form" onSubmit={handleSetupSubmit}>
            <div>
              <label htmlFor="conversation-scenario"><i className="fas fa-bullhorn"></i> Conversation Scenario:</label>
              <textarea id="conversation-scenario" rows="4" value={scenario} onChange={e => setScenario(e.target.value)} required placeholder="e.g., Practicing a job interview for a software engineer role." />
            </div>
            <div>
              <label htmlFor="conversation-model"><i className="fas fa-robot"></i> AI Model (optional):</label>
              <input type="text" id="conversation-model" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4.1" />
            </div>
            <button type="submit"><i className="fas fa-play-circle"></i> Start Conversation</button>
          </form>
        </section>
      ) : (
        <>
          <section id="conversation-arena-section">
            <h2>Scenario: {conversationState.scenario}</h2>
            <div id="debate-transcript">
              {conversationState.transcript.map((msg, index) => (
                <div key={index} className={`transcript-message ${msg.speaker}-message`}>
                  <span className="message-speaker">{msg.speaker}</span>
                  <div>{msg.text}</div>
                </div>
              ))}
            </div>
            <form id="conversation-input-form" onSubmit={handleMessageSubmit}>
              <textarea id="user-input" rows="3" placeholder="Type your message..." value={userInput} onChange={e => setUserInput(e.target.value)} disabled={isLoading} />
              <div className="form-buttons" style={{ marginTop: '1rem' }}>
                <button type="submit" id="submit-message-button" disabled={isLoading}>
                  {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Thinking...</> : <><i className="fas fa-paper-plane"></i> Send</>}
                </button>
                <button type="button" id="end-conversation-button" onClick={handleEndConversation} disabled={isLoading}><i className="fas fa-flag-checkered"></i> End & Get Feedback</button>
              </div>
            </form>
          </section>
          {analysis && (
            <section id="conversation-analysis-section">
              <h2><i className="fas fa-chart-bar"></i> Conversation Feedback</h2>
              <div id="conversation-analysis-output" className="solution-box">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default Conversation
