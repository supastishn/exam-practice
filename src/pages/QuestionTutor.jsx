import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const QuestionTutor = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Setup state
  const [topic, setTopic] = useState('')
  const [model, setModel] = useState('')

  // Interaction state
  const [tutorState, setTutorState] = useState(null) // { topic, transcript }
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleSetupSubmit = async (e) => {
    e.preventDefault()
    if (!topic.trim()) {
      alert('Please enter a topic to explore.')
      return
    }
    
    setIsLoading(true);
    setError(null);
    
    const initialState = {
      topic,
      transcript: []
    }

    await makeApiCall(initialState, `Let's begin. My topic is "${topic}". What is your first question?`);
  }

  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    if (!userInput.trim() || isLoading) return

    const newTranscript = [...tutorState.transcript, { speaker: 'user', text: userInput }]
    setTutorState({ ...tutorState, transcript: newTranscript })
    setUserInput('')
    
    await makeApiCall({ ...tutorState, transcript: newTranscript }, userInput);
  }

  const makeApiCall = async (currentState, prompt) => {
    setIsLoading(true)
    setError(null)

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

    const systemPrompt = `You are a Socratic tutor. The user wants to understand the topic of "${currentState.topic}". Your goal is to guide them by asking insightful questions, one at a time. Do not give direct answers or long explanations. Analyze the user's response, then ask the next logical question to deepen their understanding or challenge their assumptions. Keep your questions concise.`
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...currentState.transcript.map(m => ({ role: m.speaker === 'user' ? 'user' : 'assistant', content: m.text })),
      { role: 'user', content: prompt }
    ]

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({ model: fetchModel, messages, max_tokens: 300 }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')
      
      const aiResponse = data.choices[0].message.content
      const finalTranscript = [...currentState.transcript, { speaker: 'user', text: prompt }, { speaker: 'ai', text: aiResponse }]
      
      setTutorState({ 
        ...currentState, 
        transcript: currentState.transcript.length === 0 
          ? [{ speaker: 'ai', text: aiResponse }] 
          : [...currentState.transcript, { speaker: 'ai', text: aiResponse }]
      })

    } catch (err) {
      setError(err.message)
      console.error(err)
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
          <p>To use the Question Tutor, you need to select a provider in settings.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : !tutorState ? (
        <section>
          <h2><i className="fas fa-cogs"></i> Question Tutor Setup</h2>
          <form onSubmit={handleSetupSubmit}>
            <div>
              <label htmlFor="tutor-topic"><i className="fas fa-book-open"></i> What topic do you want to explore?</label>
              <input type="text" id="tutor-topic" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="e.g., The theory of relativity" />
            </div>
            <div>
              <label htmlFor="tutor-model"><i className="fas fa-robot"></i> AI Model (optional):</label>
              <input type="text" id="tutor-model" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4.1" />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Starting...</> : <><i className="fas fa-play-circle"></i> Start Session</>}
            </button>
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> {error}</div>}
          </form>
        </section>
      ) : (
        <section>
          <h2>Tutor Session: {tutorState.topic}</h2>
          <div id="debate-transcript">
            {tutorState.transcript.map((msg, index) => (
              <div key={index} className={`transcript-message ${msg.speaker}-message`}>
                <span className="message-speaker">{msg.speaker}</span>
                <div><ReactMarkdown>{msg.text}</ReactMarkdown></div>
              </div>
            ))}
             {isLoading && <div className="transcript-message ai-message"><i className="fas fa-spinner fa-spin"></i> Thinking...</div>}
          </div>
          <form onSubmit={handleMessageSubmit}>
            <textarea rows="4" placeholder="Respond to the question..." value={userInput} onChange={e => setUserInput(e.target.value)} disabled={isLoading} />
            <div className="form-buttons" style={{ marginTop: '1rem' }}>
              <button type="submit" disabled={isLoading || !userInput.trim()}>
                {isLoading ? 'Waiting...' : 'Submit Response'}
              </button>
            </div>
          </form>
          {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> {error}</div>}
        </section>
      )}
    </main>
  )
}

export default QuestionTutor
