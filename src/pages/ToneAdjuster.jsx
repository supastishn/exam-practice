import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const ToneAdjuster = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Form state
  const [originalText, setOriginalText] = useState('')
  const [targetTone, setTargetTone] = useState('Formal')
  const [model, setModel] = useState('')

  // Results state
  const [adjustedText, setAdjustedText] = useState('')
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
      setError('Please provide text to adjust.')
      return
    }
    setIsLoading(true)
    setError(null)
    setAdjustedText('')

    const provider = localStorage.getItem('api_provider') || 'custom'
    let fetchUrl, fetchHeaders, fetchModel

    if (provider === 'hackclub') {
      fetchUrl = 'https://ai.hackclub.com/chat/completions'
      fetchHeaders = { 'Content-Type': 'application/json' }
      fetchModel = model || 'mistral-7b-instruct'
    } else { // 'custom'
      const apiKey = localStorage.getItem('openai_api_key')
      const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1'
      const defaultModel = localStorage.getItem('openai_default_model') || 'gpt-3.5-turbo'
      
      fetchUrl = `${baseUrl}/chat/completions`
      fetchHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
      fetchModel = model || defaultModel
    }

    const systemPrompt = `You are an expert editor. Your task is to rewrite the user's text to match a specific tone. Do not add new information or change the core meaning. Only output the rewritten text, with no extra commentary or conversational text.`
    const userPrompt = `Please rewrite the following text to have a "${targetTone}" tone.

Original Text:
---
${originalText}
---`

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: fetchModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error?.message || `API error: ${response.statusText}`)
      }

      const result = data.choices[0].message.content.trim()
      setAdjustedText(result)

    } catch (err) {
      setError(err.message)
      console.error('Error adjusting tone:', err)
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
          <p>To use the Tone Adjuster, you need to select a provider in settings.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section>
            <h2><i className="fas fa-sliders-h"></i> Tone Adjuster</h2>
            <form onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="original-text"><i className="fas fa-paragraph"></i> Original Text:</label>
                <textarea id="original-text" rows="8" required placeholder="Enter the text you want to adjust..." value={originalText} onChange={e => setOriginalText(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="target-tone"><i className="fas fa-bullseye"></i> Target Tone:</label>
                <select id="target-tone" value={targetTone} onChange={e => setTargetTone(e.target.value)}>
                  <option value="Formal">Formal</option>
                  <option value="Casual">Casual</option>
                  <option value="Confident">Confident</option>
                  <option value="Empathetic">Empathetic</option>
                  <option value="Persuasive">Persuasive</option>
                  <option value="Concise">Concise</option>
                  <option value="More Professional">More Professional</option>
                </select>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Adjusting...</> : <><i className="fas fa-magic"></i> Adjust Tone</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Adjusting tone, please wait...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>

          {adjustedText && (
            <section>
              <h2><i className="fas fa-pen-alt"></i> Adjusted Text</h2>
              <div className="solution-box">
                <ReactMarkdown>{adjustedText}</ReactMarkdown>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default ToneAdjuster
