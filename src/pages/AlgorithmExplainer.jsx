import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const AlgorithmExplainer = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  const [codeSnippet, setCodeSnippet] = useState('')
  const [model, setModel] = useState('')
  const [explanation, setExplanation] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!codeSnippet.trim()) {
      setError('Please provide a code snippet to explain.')
      return
    }
    setIsLoading(true)
    setError(null)
    setExplanation('')

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

    const systemPrompt = "You are a computer science professor. Analyze the provided code snippet. Explain the algorithm it implements, its purpose, its time and space complexity (Big O notation), and walk through a simple example. Use Markdown for formatting and code blocks for code. Only output the explanation."

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: fetchModel,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: codeSnippet }],
          max_tokens: 2000,
          temperature: 0.2,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')

      setExplanation(data.choices[0].message.content)
    } catch (err) {
      setError(`Failed to get explanation: ${err.message}`)
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
          <p>To use the Algorithm Explainer, you need a configured provider.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section>
            <h2><i className="fas fa-project-diagram"></i> Algorithm Explainer</h2>
            <form onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="code-snippet"><i className="fas fa-code"></i> Code Snippet:</label>
                <textarea id="code-snippet" rows="12" placeholder="Paste your code snippet here..." value={codeSnippet} onChange={e => setCodeSnippet(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Explaining...</> : <><i className="fas fa-magic"></i> Explain Algorithm</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Analyzing complexity...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>
          {explanation && (
            <section>
              <h2><i className="fas fa-chalkboard-teacher"></i> Explanation</h2>
              <div className="solution-box" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: explanation }}></div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default AlgorithmExplainer
