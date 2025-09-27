import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import ImagePicker from '../components/ImagePicker'

const HistoricalWhatIf = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  const [topic, setTopic] = useState('')
  const [model, setModel] = useState('')

  const [explorationState, setExplorationState] = useState(null)
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachedImage, setAttachedImage] = useState(null)
  const [attachedImages, setAttachedImages] = useState([])

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleSetupSubmit = async (e) => {
    e.preventDefault()
    if (!topic.trim()) {
      alert('Please enter a scenario.')
      return
    }
    
    setIsLoading(true)
    const initialState = {
      topic,
      transcript: [],
    }
    setExplorationState(initialState)

    // Make initial call to set the scene
    await makeApiCall(initialState, "Describe the world in the present day, given this new history. Start with a brief overview of the key differences.");
    setIsLoading(false)
  }

  const handleMessageSubmit = async (e) => {
    e.preventDefault()
    if (!userInput.trim() || isLoading) return

    const newTranscript = [...explorationState.transcript, { speaker: 'user', text: userInput }]
    setExplorationState({ ...explorationState, transcript: newTranscript })
    setUserInput('')
    await makeApiCall({ ...explorationState, transcript: newTranscript }, userInput);
  }

  const makeApiCall = async (currentState, prompt) => {
    setIsLoading(true);

    try {
      const apiKey = localStorage.getItem('openai_api_key')
      const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1'
      const defaultModel = localStorage.getItem('openai_default_model') || 'gpt-4o-mini'
      const fetchUrl = `${baseUrl}/chat/completions`
      const fetchHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
      const fetchModel = model || defaultModel

      const systemPrompt = `You are a historian simulating an alternate timeline. The historical divergence point is: "${currentState.topic}".
      Your goal is to describe this new timeline and respond to user questions about it. Maintain consistency with the initial divergence. Be creative but plausible.`
      
      const messages = [
        { role: 'system', content: systemPrompt },
        ...currentState.transcript.map(m => ({
          role: m.speaker === 'user' ? 'user' : 'assistant',
          content: m.text
        })),
        ...((attachedImage || (attachedImages && attachedImages.length)) ? [{ role: 'user', content: [ { type: 'text', text: '(Attached image context)' }, ...((attachedImages && attachedImages.length ? attachedImages : [attachedImage]).map(url => ({ type: 'image_url', image_url: { url } })) ) ] }] : [])
      ];
      if (currentState.transcript.length === 0) { // First call
          messages.push({ role: 'user', content: prompt });
      }

      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({ model: fetchModel, messages, max_tokens: 1000 }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')
      
      const aiResponse = data.choices[0].message.content
      setExplorationState(prevState => ({
          ...prevState,
          transcript: [...prevState.transcript, { speaker: 'ai', text: aiResponse }],
      }))

    } catch (error) {
      console.error('Error getting AI response:', error)
      setExplorationState(prevState => ({
          ...prevState,
          transcript: [...prevState.transcript, { speaker: 'system', text: `Error: ${error.message}` }],
      }))
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
          <p>To explore alternate histories, you need a configured provider.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : !explorationState ? (
        <section id="whatif-setup-section">
          <h2><i className="fas fa-scroll"></i> Historical "What If" Scenarios</h2>
            <form onSubmit={handleSetupSubmit}>
              <div>
                <label htmlFor="whatif-topic"><i className="fas fa-bullhorn"></i> Define the point of divergence:</label>
                <input type="text" id="whatif-topic" value={topic} onChange={e => setTopic(e.target.value)} required placeholder="e.g., What if the Library of Alexandria was never destroyed?" />
              </div>
              <div>
                <ImagePicker id="whatif-image" label="Attach reference image (optional) or use camera" onChange={setAttachedImage} onChangeAll={setAttachedImages} />
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4.1" />
              </div>
            <button type="submit" disabled={isLoading}>{isLoading ? 'Initializing...' : 'Explore Scenario'}</button>
          </form>
        </section>
      ) : (
        <>
          <section id="whatif-arena-section">
            <h2>Scenario: {explorationState.topic}</h2>
            <div id="debate-transcript">
              {explorationState.transcript.map((msg, index) => (
                <div key={index} className={`transcript-message ${msg.speaker}-message`}>
                  <span className="message-speaker">{msg.speaker}</span>
                  <div><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                </div>
              ))}
              {isLoading && <div className="transcript-message ai-message"><i className="fas fa-spinner fa-spin"></i> Thinking...</div>}
            </div>
            <form onSubmit={handleMessageSubmit}>
              <textarea id="user-input" rows="3" placeholder="Ask about this new timeline..." value={userInput} onChange={e => setUserInput(e.target.value)} disabled={isLoading} />
              <div className="form-buttons" style={{ marginTop: '1rem' }}>
                <button type="submit" id="submit-message-button" disabled={isLoading}>
                  <i className="fas fa-paper-plane"></i> Ask
                </button>
              </div>
            </form>
          </section>
        </>
      )}
    </main>
  )
}

export default HistoricalWhatIf
