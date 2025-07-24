import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Settings = () => {
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [defaultModel, setDefaultModel] = useState('')
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    const creds = loadCredentials()
    setApiKey(creds.apiKey || '')
    setBaseUrl(creds.baseUrl || '')
    setDefaultModel(creds.defaultModel || '')
    if (creds.apiKey) {
      setStatusMessage({ text: 'Credentials loaded from localStorage.', type: 'info' })
    } else {
      setStatusMessage({ text: 'Credentials not set. Please enter your API key.', type: 'info' })
    }
  }, [])

  const loadCredentials = () => ({
    apiKey: localStorage.getItem('openai_api_key'),
    baseUrl: localStorage.getItem('openai_base_url'),
    defaultModel: localStorage.getItem('openai_default_model'),
  })

  const handleSave = (e) => {
    e.preventDefault()
    localStorage.setItem('openai_api_key', apiKey.trim())
    localStorage.setItem('openai_base_url', baseUrl.trim())
    localStorage.setItem('openai_default_model', defaultModel.trim())
    setStatusMessage({ text: 'Credentials saved successfully!', type: 'success' })
  }

  const handleClear = () => {
    localStorage.removeItem('openai_api_key')
    localStorage.removeItem('openai_base_url')
    localStorage.removeItem('openai_default_model')
    setApiKey('')
    setBaseUrl('')
    setDefaultModel('')
    setStatusMessage({ text: 'Credentials cleared.', type: 'info' })
  }

  const handleTestApi = async () => {
    if (!apiKey) {
      setStatusMessage({ text: 'API Key is required for testing.', type: 'error' })
      return
    }
    setStatusMessage({ text: 'Testing API connection...', type: 'info' })

    const url = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`
    const modelToTest = defaultModel || 'gpt-3.5-turbo'

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelToTest,
          messages: [{ role: 'user', content: 'Say hello world' }],
          max_tokens: 50,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || response.statusText)
      }

      const responseText = data.choices[0]?.message?.content?.trim() || 'No response text.'
      setStatusMessage({
        text: `Connection successful! Response: "${responseText}"`,
        type: 'success',
      })
    } catch (error) {
      setStatusMessage({
        text: `API test failed: ${error.message}`,
        type: 'error',
      })
    }
  }

  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>
      <section id="settings-page-section">
        <h2><i className="fas fa-key"></i> OpenAI Credentials</h2>
        <form id="credentials-form" onSubmit={handleSave}>
          <div>
            <label htmlFor="api-key"><i className="fas fa-lock"></i> OpenAI API Key:</label>
            <input type="password" id="api-key" name="api-key" required placeholder="Enter your OpenAI API key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
          </div>
          <div>
            <label htmlFor="base-url"><i className="fas fa-link"></i> OpenAI Base URL (optional):</label>
            <input type="url" id="base-url" name="base-url" placeholder="https://api.openai.com/v1" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div>
            <label htmlFor="default-model"><i className="fas fa-robot"></i> Default Model Name (optional):</label>
            <input type="text" id="default-model" name="default-model" placeholder="e.g., gpt-4.1, gpt-3.5-turbo" value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} />
          </div>

          <div className="form-buttons">
            <button type="submit"><i className="fas fa-save"></i> Save Credentials</button>
            <button type="button" id="test-api-button" onClick={handleTestApi}><i className="fas fa-vial"></i> Test API</button>
          </div>
        </form>
        <button id="clear-credentials" onClick={handleClear}><i className="fas fa-trash-alt"></i> Clear Credentials</button>
        {statusMessage.text && (
          <p id="credentials-status" className={`status-${statusMessage.type}`}>
            {statusMessage.type === 'success' && <i className="fas fa-check-circle"></i>}
            {statusMessage.type === 'error' && <i className="fas fa-times-circle"></i>}
            {statusMessage.type === 'info' && <i className="fas fa-info-circle"></i>}
            {' '}{statusMessage.text}
          </p>
        )}
      </section>
    </main>
  )
}

export default Settings
