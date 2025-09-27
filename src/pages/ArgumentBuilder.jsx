import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import ImagePicker from '../components/ImagePicker'

const ArgumentBuilder = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Setup state
  const [claim, setClaim] = useState('')
  const [model, setModel] = useState('')

  // Interaction state
  const [argumentState, setArgumentState] = useState(null) // { claim, transcript }
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [attachedImage, setAttachedImage] = useState(null)
  const [attachedImages, setAttachedImages] = useState([])
  
  useEffect(() => {
    // Check for API provider config
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleSetupSubmit = async (e) => {
    e.preventDefault()
    if (!claim.trim()) {
      alert('Please enter a claim or thesis statement.')
      return
    }
    
    setIsLoading(true);
    setError(null);

    const initialTranscript = [{ speaker: 'system', text: `Let's build an argument for the claim: "${claim}". You can ask me to brainstorm supporting points, find counterarguments, or help structure the essay.` }]

    try {
        const apiKey = localStorage.getItem('openai_api_key')
        const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1'
        const defaultModel = localStorage.getItem('openai_default_model') || 'gpt-4o-mini'
        const fetchUrl = `${baseUrl}/chat/completions`
        const fetchHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
        const fetchModel = model || defaultModel

        const systemPrompt = `You are an expert in rhetoric and argumentation. You are helping a user build a strong argument for their claim: "${claim}". Your goal is to help them brainstorm, find evidence, anticipate counterarguments, and structure their thoughts. Start by providing a few initial supporting points for their claim to get them started.`
        
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify({ model: fetchModel, messages: [{ role: 'system', content: systemPrompt }], max_tokens: 500 }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error?.message || 'API Error')
        
        const aiResponse = data.choices[0].message.content
        
        setArgumentState({
          claim,
          transcript: [...initialTranscript, { speaker: 'ai', text: aiResponse }]
        })

    } catch (err) {
        setError(err.message)
    } finally {
        setIsLoading(false)
    }
  }

  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    if (!userInput.trim() || isLoading) return

    const newTranscript = [...argumentState.transcript, { speaker: 'user', text: userInput }]
    setArgumentState({ ...argumentState, transcript: newTranscript })
    setUserInput('')
    setIsLoading(true)
    setError(null)
    
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

        const systemPrompt = `You are an expert in rhetoric and argumentation. You are helping a user build a strong argument for their claim: "${argumentState.claim}". Continue the conversation, responding to the user's latest request.`
        
        const messages = [
            { role: 'system', content: systemPrompt },
            ...newTranscript.filter(m => m.speaker !== 'system').map(m => ({
                role: m.speaker === 'user' ? 'user' : 'assistant',
                content: m.text
            })),
            ...((attachedImage || (attachedImages && attachedImages.length)) ? [{ role: 'user', content: [ { type: 'text', text: '(Attached image context)' }, ...((attachedImages && attachedImages.length ? attachedImages : [attachedImage]).map(url => ({ type: 'image_url', image_url: { url } })) ) ] }] : [])
        ]
        
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify({ model: fetchModel, messages, max_tokens: 800 }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error?.message || 'API Error')
        
        const aiResponse = data.choices[0].message.content
        setArgumentState(prevState => ({
            ...prevState,
            transcript: [...prevState.transcript, { speaker: 'ai', text: aiResponse }],
        }))

    } catch (err) {
        setError(err.message)
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
          <p>To use the Argument Builder, you need to select a provider in settings.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : !argumentState ? (
        <section>
          <h2><i className="fas fa-sitemap"></i> Argument Builder Setup</h2>
            <form onSubmit={handleSetupSubmit}>
              <div>
                <label htmlFor="argument-claim"><i className="fas fa-bullhorn"></i> Your Thesis / Main Claim:</label>
                <textarea id="argument-claim" rows="3" value={claim} onChange={e => setClaim(e.target.value)} required placeholder="e.g., 'All public high school students should be required to complete a semester of financial literacy.'" />
              </div>
              <div>
                <ImagePicker id="argument-image" label="Attach supporting image (optional) or use camera" onChange={setAttachedImage} onChangeAll={setAttachedImages} />
              </div>
              <div>
                <label htmlFor="argument-model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="argument-model" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4.1" />
              </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Starting...</> : <><i className="fas fa-play-circle"></i> Build Argument</>}
            </button>
            {error && <div style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</div>}
          </form>
        </section>
      ) : (
        <>
          <section>
            <h2>Building Argument for: {argumentState.claim}</h2>
            <div id="debate-transcript" style={{ whiteSpace: 'pre-wrap' }}>
              {argumentState.transcript.map((msg, index) => (
                <div key={index} className={`transcript-message ${msg.speaker}-message`}>
                  <span className="message-speaker">{msg.speaker}</span>
                  <div><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                </div>
              ))}
            </div>
            <form onSubmit={handleMessageSubmit}>
              <textarea id="user-input" rows="3" placeholder="Ask for supporting points, counterarguments, structure, etc." value={userInput} onChange={e => setUserInput(e.target.value)} disabled={isLoading} />
              <div className="form-buttons" style={{ marginTop: '1rem' }}>
                <button type="submit" id="submit-message-button" disabled={isLoading}>
                  {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Thinking...</> : <><i className="fas fa-paper-plane"></i> Send</>}
                </button>
              </div>
               {error && <div style={{ color: 'red', marginTop: '1rem' }}>Error: {error}</div>}
            </form>
          </section>
        </>
      )}
    </main>
  )
}

export default ArgumentBuilder
