import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const BugReportFormatter = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  const [bugDescription, setBugDescription] = useState('')
  const [model, setModel] = useState('')
  const [formattedReport, setFormattedReport] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!bugDescription.trim()) {
      setError('Please provide the bug description.')
      return
    }
    setIsLoading(true)
    setError(null)
    setFormattedReport('')

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

    const systemPrompt = "You are an expert QA engineer. Convert the user's plain text description of a bug into a well-structured bug report. The report MUST be in Markdown format and include the following sections, inferring details where necessary: **Title**, **Steps to Reproduce**, **Expected Behavior**, **Actual Behavior**, and **System Information** (e.g., Browser, OS). Only output the formatted report."

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: fetchModel,
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: bugDescription }],
          max_tokens: 1500,
          temperature: 0.2,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')

      setFormattedReport(data.choices[0].message.content)
    } catch (err) {
      setError(`Failed to format report: ${err.message}`)
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
          <p>To use the Bug Report Formatter, you need a configured provider.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section>
            <h2><i className="fas fa-bug"></i> Bug Report Formatter</h2>
            <form onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="bug-description"><i className="fas fa-paragraph"></i> Bug Description:</label>
                <textarea id="bug-description" rows="10" placeholder="Describe the bug in plain English. e.g., 'When I click the save button on the profile page, nothing happens. I'm using Chrome on Windows 11.'" value={bugDescription} onChange={e => setBugDescription(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Formatting...</> : <><i className="fas fa-magic"></i> Format Report</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Trying to reproduce the issue...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>
          {formattedReport && (
            <section>
              <h2><i className="fas fa-file-medical-alt"></i> Formatted Bug Report</h2>
              <div className="solution-box" style={{ whiteSpace: 'pre-wrap' }}>
                {formattedReport}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default BugReportFormatter
