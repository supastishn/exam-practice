import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const LegalSummarizer = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Form state
  const [legalText, setLegalText] = useState('')
  const [model, setModel] = useState('')

  // Results state
  const [summary, setSummary] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!legalText.trim()) {
      setError('Please provide text to summarize.')
      return
    }
    setIsLoading(true)
    setError(null)
    setSummary('')

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

    const systemPrompt = "You are an AI assistant specialized in simplifying complex legal documents. Your task is to read the following legal text and provide a summary in plain, easy-to-understand language. Break down the key points into a bulleted list. Focus on what the document obligates the user to do or agree to. Do not provide legal advice. Only output the summary."

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: fetchModel,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: legalText }],
          max_tokens: 2000,
          temperature: 0.2,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')

      setSummary(data.choices[0].message.content)

    } catch (err) {
      setError(`Failed to get summary: ${err.message}`)
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
          <p>To use the Legal Summarizer, you need to select a provider in settings.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section>
            <h2><i className="fas fa-file-contract"></i> Legal Document Summarizer</h2>
            
            <div className="feedback-incorrect" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
              <strong><i className="fas fa-exclamation-triangle"></i> Disclaimer:</strong> This tool uses an AI and may produce inaccurate or misleading information. The summary is <strong>not</strong> legal advice. Always consult a qualified professional for legal matters.
            </div>

            <form onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="legal-text"><i className="fas fa-file-signature"></i> Legal Text to Summarize:</label>
                <textarea id="legal-text" rows="12" placeholder="Paste the full legal text here (e.g., terms of service, privacy policy)..." value={legalText} onChange={e => setLegalText(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Summarizing...</> : <><i className="fas fa-magic"></i> Summarize Text</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Reading the fine print...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>

          {summary && (
            <section>
              <h2><i className="fas fa-clipboard-list"></i> Summary</h2>
              <div className="solution-box" style={{ whiteSpace: 'pre-wrap' }}>
                {summary}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default LegalSummarizer
