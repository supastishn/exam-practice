import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const FlashcardConverter = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Form state
  const [sourceText, setSourceText] = useState('')
  const [model, setModel] = useState('')

  // Results state
  const [flashcards, setFlashcards] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!sourceText.trim()) {
      setError('Please provide text to convert.')
      return
    }
    setIsLoading(true)
    setError(null)
    setFlashcards([])

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

    const systemPrompt = `You are an AI that creates flashcards from a given text. Analyze the text and identify key terms, concepts, or questions. Your output MUST be a single, valid JSON array. Do not include any surrounding text or markdown. Each object in the array should represent a single flashcard and must have two keys: "term" (the front of the card) and "definition" (the back of the card).`

    const userPrompt = `Please create flashcards from the following text:\n---\n${sourceText}\n---`

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({ model: fetchModel, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], response_format: { type: "json_object" } }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')

      const content = JSON.parse(data.choices[0].message.content)
      setFlashcards(content)

    } catch (err) {
      setError(`Failed to generate flashcards: ${err.message}`)
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
          <p>To use the Flashcard Converter, you need to select a provider in settings.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section>
            <h2><i className="fas fa-layer-group"></i> Flashcard Converter</h2>
            <form onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="source-text"><i className="fas fa-paragraph"></i> Source Text:</label>
                <textarea id="source-text" rows="10" placeholder="Paste your notes or any text here..." value={sourceText} onChange={e => setSourceText(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Generating...</> : <><i className="fas fa-magic"></i> Create Flashcards</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Generating, please wait...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>

          {flashcards.length > 0 && (
            <section>
              <h2><i className="fas fa-clone"></i> Generated Flashcards ({flashcards.length})</h2>
              <div className="feedback-analysis-section">
                <ul>
                  {flashcards.map((card, index) => (
                    <li key={index}>
                      <strong>Term:</strong> {card.term}
                      <br />
                      <strong>Definition:</strong> <ReactMarkdown>{card.definition}</ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default FlashcardConverter
