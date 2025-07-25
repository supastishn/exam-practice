import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const HypothesisGenerator = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Form state
  const [observation, setObservation] = useState('')
  const [model, setModel] = useState('')

  // Results state
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
    if (!observation.trim()) {
      setError('Please provide an observation.')
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

    const systemPrompt = `You are a scientific research assistant. The user will provide an observation. Your task is to formulate a clear, testable scientific hypothesis based on this observation. Your output must be a single, valid JSON object with two keys: "hypothesis" (a string containing the formal hypothesis, e.g., 'If X is true, then Y will happen') and "suggested_test" (a string briefly describing a simple experiment or method to test this hypothesis). Do not include any surrounding text or markdown.`

    const userPrompt = `Please generate a hypothesis from the following observation:\n---\n${observation}\n---`

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({ model: fetchModel, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], response_format: { type: "json_object" } }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')

      const content = JSON.parse(data.choices[0].message.content)
      setResult(content)

    } catch (err) {
      setError(`Failed to generate hypothesis: ${err.message}`)
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
          <p>To use the Hypothesis Generator, you need to select a provider in settings.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section>
            <h2><i className="fas fa-flask"></i> Hypothesis Generator</h2>
            <form onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="observation-text"><i className="fas fa-eye"></i> Your Observation:</label>
                <textarea id="observation-text" rows="6" placeholder="Describe something you've noticed. e.g., 'My house plants grow faster when I play classical music for them.'" value={observation} onChange={e => setObservation(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Formulating...</> : <><i className="fas fa-magic"></i> Generate Hypothesis</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Entering the lab...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>

          {result && (
            <section>
              <h2><i className="fas fa-lightbulb"></i> Generated Hypothesis & Test</h2>
              <div className="analysis-output-box">
                <h3><i className="fas fa-quote-right"></i> Hypothesis</h3>
                <p>{result.hypothesis}</p>
              </div>
              <div className="analysis-output-box">
                <h3><i className="fas fa-vial"></i> Suggested Test</h3>
                <p style={{ whiteSpace: 'pre-wrap' }}>{result.suggested_test}</p>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default HypothesisGenerator
