import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const ScientificPaperSummarizer = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  const [paperText, setPaperText] = useState('')
  const [model, setModel] = useState('')
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
    if (!paperText.trim()) {
      setError('Please provide the paper text to summarize.')
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

    const systemPrompt = "You are an AI assistant specialized in scientific literature. Your task is to read the following scientific paper text and provide a concise summary. The summary should include the paper's main hypothesis, methodology, key findings, and conclusions, presented in clear, accessible language. Use Markdown formatting with headings for each section. Only output the summary."

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: fetchModel,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: paperText }],
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
          <p>To use the Scientific Paper Summarizer, you need a configured provider.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section>
            <h2><i className="fas fa-book-open"></i> Scientific Paper Summarizer</h2>
            <form onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="paper-text"><i className="fas fa-file-alt"></i> Paper Text to Summarize:</label>
                <textarea id="paper-text" rows="15" placeholder="Paste the full text of the scientific paper here..." value={paperText} onChange={e => setPaperText(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Summarizing...</> : <><i className="fas fa-magic"></i> Summarize Paper</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Reading the literature...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>
          {summary && (
            <section>
              <h2><i className="fas fa-clipboard-list"></i> Summary</h2>
              <div className="solution-box">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default ScientificPaperSummarizer
