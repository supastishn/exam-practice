import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

const MathProofAssistant = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  const [claimText, setClaimText] = useState('')
  const [model, setModel] = useState('')
  const [proof, setProof] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!claimText.trim()) {
      setError('Please provide the mathematical claim or problem.')
      return
    }
    setIsLoading(true)
    setError(null)
    setProof('')

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

    const systemPrompt = "You are a mathematics professor. The user will provide a mathematical claim or problem. Your task is to provide a step-by-step proof or a detailed solution. Use Markdown for clear formatting and structure. Use LaTeX for mathematical notation, enclosing display math in `$$...$$` and inline math in `$...$`. Only output the proof/solution."

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: fetchModel,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: claimText }],
          max_tokens: 2000,
          temperature: 0.1,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')

      setProof(data.choices[0].message.content)
    } catch (err) {
      setError(`Failed to generate proof: ${err.message}`)
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
          <p>To use the Math Proof Assistant, you need a configured provider.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section>
            <h2><i className="fas fa-square-root-alt"></i> Math Proof Assistant</h2>
            <form onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="claim-text"><i className="fas fa-file-alt"></i> Mathematical Claim or Problem:</label>
                <textarea id="claim-text" rows="8" placeholder="e.g., Prove that the square root of 2 is irrational." value={claimText} onChange={e => setClaimText(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Proving...</> : <><i className="fas fa-magic"></i> Assist with Proof</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Checking the axioms...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>
          {proof && (
            <section>
              <h2><i className="fas fa-scroll"></i> Generated Proof/Solution</h2>
              <div className="solution-box">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {proof}
                </ReactMarkdown>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default MathProofAssistant
