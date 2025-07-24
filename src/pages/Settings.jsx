import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Settings = () => {
  const [provider, setProvider] = useState('custom')
  const [apiKey, setApiKey] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [defaultModel, setDefaultModel] = useState('')
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' })

  useEffect(() => {
    const savedProvider = localStorage.getItem('api_provider') || 'custom'
    setProvider(savedProvider)

    const apiKeyVal = localStorage.getItem('openai_api_key')
    const baseUrlVal = localStorage.getItem('openai_base_url')
    const defaultModelVal = localStorage.getItem('openai_default_model')

    setApiKey(apiKeyVal || '')
    setBaseUrl(baseUrlVal || '')
    setDefaultModel(defaultModelVal || '')

    if (savedProvider === 'hackclub') {
      setStatusMessage({ text: 'Using AI Hack Club provider. No key needed.', type: 'info' })
    } else if (apiKeyVal) {
      setStatusMessage({ text: 'Custom provider credentials loaded from localStorage.', type: 'info' })
    } else {
      setStatusMessage({ text: 'Custom provider selected. Please enter your API key.', type: 'info' })
    }
  }, [])

  const handleSave = (e) => {
    e.preventDefault()
    localStorage.setItem('api_provider', provider)
    if (provider === 'custom') {
      localStorage.setItem('openai_api_key', apiKey.trim())
      localStorage.setItem('openai_base_url', baseUrl.trim())
      localStorage.setItem('openai_default_model', defaultModel.trim())
    } else {
      // Clear custom creds from storage if saving with Hack Club
      localStorage.removeItem('openai_api_key')
      localStorage.removeItem('openai_base_url')
      localStorage.removeItem('openai_default_model')
      setApiKey('')
      setBaseUrl('')
      setDefaultModel('')
    }
    setStatusMessage({ text: 'Settings saved successfully!', type: 'success' })
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
    let testUrl, testHeaders, testModel

    if (provider === 'hackclub') {
      setStatusMessage({ text: 'Testing AI Hack Club connection...', type: 'info' })
      testUrl = 'https://ai.hackclub.com/chat/completions'
      testHeaders = { 'Content-Type': 'application/json' }
      // Use a model known to work with Hack Club
      testModel = defaultModel || 'mistral-7b-instruct'
    } else { // 'custom' provider
      const testApiKey = apiKey
      if (!testApiKey) {
        setStatusMessage({ text: 'API Key is required for testing.', type: 'error' })
        return
      }
      setStatusMessage({ text: 'Testing API connection...', type: 'info' })
      testUrl = `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`
      testHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testApiKey}`,
      }
      testModel = defaultModel || 'gpt-3.5-turbo'
    }

    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: testHeaders,
        body: JSON.stringify({
          model: testModel,
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
        <form id="settings-form" onSubmit={handleSave}>
          <h2><i className="fas fa-cogs"></i> API Provider</h2>
          <div className="provider-buttons">
            <button
              type="button"
              className={provider === 'hackclub' ? 'active' : ''}
              onClick={() => setProvider('hackclub')}
            >
              <i className="fas fa-users"></i> AI Hack Club (Free)
            </button>
            <button
              type="button"
              className={provider === 'custom' ? 'active' : ''}
              onClick={() => setProvider('custom')}
            >
              <i className="fas fa-key"></i> Custom API Key
            </button>
          </div>
          <p className="provider-info">
            {provider === 'hackclub'
              ? 'Uses the free, community-run AI Hack Club endpoint. No API key required. Rate limits may apply.'
              : 'Use your own OpenAI-compatible API key and endpoint.'
            }
          </p>

          {provider === 'custom' && (
            <div id="custom-credentials-fields" style={{ marginTop: '2rem' }}>
              <h3><i className="fas fa-key"></i> Custom Credentials</h3>
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
            </div>
          )}

          <div className="form-buttons" style={{marginTop: '1.5rem'}}>
            <button type="submit"><i className="fas fa-save"></i> Save Settings</button>
            <button type="button" id="test-api-button" onClick={handleTestApi}><i className="fas fa-vial"></i> Test API</button>
          </div>
        </form>
        {provider === 'custom' && (
          <button id="clear-credentials" onClick={handleClear}><i className="fas fa-trash-alt"></i> Clear Credentials</button>
        )}
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
