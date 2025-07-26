import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const RegexBuilder = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  const [description, setDescription] = useState('')
  const [model, setModel] = useState('')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) {
      setError('Please describe the pattern you want to match.')
      return
    }
    setIsLoading(true)
    setError(null)
    setResult(null)

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

    const systemPrompt = "You are an expert in regular expressions. The user will describe a pattern they want to match. Your output MUST be a single, valid JSON object with two keys: 'regex' (a string containing the regex pattern, correctly escaped for JSON) and 'explanation' (a string briefly explaining how the regex works). Do not include any surrounding text or markdown."

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: fetchModel,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: description }],
          response_format: { type: "json_object" },
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')

      const content = JSON.parse(data.choices[0].message.content)
      setResult(content)
    } catch (err) {
      setError(`Failed to build regex: ${err.message}`)
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
          <p>To use the Regex Builder, you need a configured provider.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section>
            <h2><i className="fas fa-code"></i> Regex Builder</h2>
            <form onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="description-text"><i className="fas fa-comment-dots"></i> Describe the pattern to match:</label>
                <textarea id="description-text" rows="6" placeholder="e.g., Match a valid email address." value={description} onChange={e => setDescription(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Building...</> : <><i className="fas fa-magic"></i> Build Regex</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Compiling expression...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>
          {result && (
            <section>
              <h2><i className="fas fa-tasks"></i> Generated Regex</h2>
              <div className="analysis-output-box">
                <h3><i className="fas fa-laptop-code"></i> Regex Pattern</h3>
                <pre style={{ background: 'var(--input-bg)', padding: '1rem', borderRadius: 'var(--border-radius)' }}><code>{result.regex}</code></pre>
              </div>
              <div className="analysis-output-box">
                <h3><i className="fas fa-info-circle"></i> Explanation</h3>
                <ReactMarkdown>{result.explanation}</ReactMarkdown>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default RegexBuilder
