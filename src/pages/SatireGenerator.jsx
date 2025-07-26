import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const SatireGenerator = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Form state
  const [originalText, setOriginalText] = useState('')
  const [model, setModel] = useState('')

  // Results state
  const [satiricalText, setSatiricalText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!originalText.trim()) {
      setError('Please provide text to satirize.')
      return
    }
    setIsLoading(true)
    setError(null)
    setSatiricalText('')

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

    const systemPrompt = "You are an expert satirist in the style of The Onion or Jonathan Swift. Your task is to rewrite the user's provided text in a satirical, witty, and ironic tone. Maintain the core subject of the original text but exaggerate it for comedic and critical effect. Only output the rewritten satirical text, with no extra commentary."

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: fetchModel,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: originalText }],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')

      setSatiricalText(data.choices[0].message.content)

    } catch (err) {
      setError(`Failed to generate satire: ${err.message}`)
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
          <p>To use the Satire Generator, you need to select a provider in settings.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section>
            <h2><i className="fas fa-theater-masks"></i> Satire & Parody Generator</h2>
            <form onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="original-text"><i className="fas fa-paragraph"></i> Original Text:</label>
                <textarea id="original-text" rows="8" placeholder="Enter text to make satirical, like a news article or a common situation..." value={originalText} onChange={e => setOriginalText(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Generating...</> : <><i className="fas fa-magic"></i> Generate Satire</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Thinking funny thoughts...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>

          {satiricalText && (
            <section>
              <h2><i className="fas fa-file-alt"></i> Satirical Version</h2>
              <div className="solution-box">
                <ReactMarkdown>{satiricalText}</ReactMarkdown>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default SatireGenerator
