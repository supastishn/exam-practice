import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const FallacyDetector = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  const [textToAnalyze, setTextToAnalyze] = useState('')
  const [model, setModel] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!textToAnalyze.trim()) {
      setError('Please enter text to analyze.')
      return
    }
    setIsLoading(true)
    setError(null)
    setAnalysisResult(null)

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
      fetchHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      }
      fetchModel = model || defaultModel
    }

    const systemPrompt = `You are an AI expert in logical fallacies. Your task is to analyze a given text and identify any logical fallacies present.
Your output MUST be a single block of valid HTML. Do not include any surrounding text, comments, or markdown like \`\`\`html.
If no fallacies are found, return a single div: <div class="fallacy-result-box no-fallacies"><h3>No Fallacies Detected</h3><p>No significant logical fallacies were identified in the provided text.</p></div>
If fallacies are found, for each fallacy identified, create a div with the class "fallacy-result-box".
Inside this div, include:
1. An <h4> element with the name of the fallacy (e.g., "Ad Hominem").
2. A <p> element with class="fallacy-explanation" explaining what the fallacy is and why the specific text is an example of it.
3. A <blockquote> element containing the exact quote from the text where the fallacy occurs.
Structure your response as a series of these divs if multiple fallacies are found.`

    const userPrompt = `Please analyze the following text for logical fallacies:
---
${textToAnalyze}
---
Generate the HTML report now.`

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
          temperature: 0.3, // Lower temperature for more deterministic analysis
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `API error: ${response.statusText}`)
      }

      const generatedContent = data.choices[0].message.content.replace(/```html/g, '').replace(/```/g, '').trim()
      setAnalysisResult(generatedContent)

    } catch (err) {
      setError(err.message)
      console.error('Error analyzing text:', err)
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
        <section id="credentials-prompt-section">
          <h2><i className="fas fa-key"></i> API Provider Not Configured</h2>
          <p>To use the Fallacy Detector, you need to select a provider in settings.</p>
          <p>You can use the free AI Hack Club provider or your own custom API key.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section id="fallacy-detector-section">
            <h2><i className="fas fa-search"></i> Fallacy Detector</h2>
            <form id="fallacy-form" onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="text-to-analyze"><i className="fas fa-paragraph"></i> Text to Analyze:</label>
                <textarea id="text-to-analyze" name="text-to-analyze" rows="8" required placeholder="Enter the text you want to check for logical fallacies..." value={textToAnalyze} onChange={e => setTextToAnalyze(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Analyzing...</> : <><i className="fas fa-search-dollar"></i> Analyze Text</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Analyzing text, please wait...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>

          {analysisResult && (
            <section id="analysis-display-section">
              <h2><i className="fas fa-balance-scale"></i> Analysis Results</h2>
              <div id="analysis-output" dangerouslySetInnerHTML={{ __html: analysisResult }}></div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default FallacyDetector
