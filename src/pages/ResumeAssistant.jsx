import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const ResumeAssistant = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Form state
  const [jobDescription, setJobDescription] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [model, setModel] = useState('')

  // Results state
  const [analysis, setAnalysis] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    // Check for API provider config
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!jobDescription.trim() || !resumeText.trim()) {
      setError('Please provide both a job description and your resume/cover letter text.')
      return
    }
    setIsLoading(true)
    setError(null)
    setAnalysis('')

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

    const systemPrompt = `You are a professional career coach and resume expert. Your task is to analyze a user's resume or cover letter against a specific job description.
Provide detailed, constructive, and actionable feedback. The feedback should be well-structured and easy to read.
Use Markdown for formatting. Your response should include the following sections:
- **Overall Impression:** A brief summary of how well the document is tailored to the role.
- **Strengths:** Point out what the user has done well.
- **Areas for Improvement:** Identify weaknesses or gaps.
- **Specific Suggestions:** Give concrete examples of how to rephrase bullet points, add keywords from the job description, or restructure sections to better match the role's requirements.`

    const userPrompt = `Please analyze my resume/cover letter based on the job description provided.

**Job Description:**
---
${jobDescription}
---

**My Resume/Cover Letter:**
---
${resumeText}
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
          temperature: 0.5,
          stream: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `API error: ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      setAnalysis('')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6)
            if (dataStr.trim() === '[DONE]') {
              setIsLoading(false)
              return
            }
            try {
              const jsonData = JSON.parse(dataStr)
              const content = jsonData.choices[0]?.delta?.content
              if (content) setAnalysis(prev => (prev || '') + content)
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError)
            }
          }
        }
      }

    } catch (err) {
      setError(err.message)
      console.error('Error analyzing document:', err)
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
          <p>To use the Resume Assistant, you need to select a provider in settings.</p>
          <p>You can use the free AI Hack Club provider or your own custom API key.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section id="resume-assistant-section">
            <h2><i className="fas fa-briefcase"></i> Resume & Cover Letter Assistant</h2>
            <form id="resume-form" onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="job-description"><i className="fas fa-file-alt"></i> Job Description:</label>
                <textarea id="job-description" name="job-description" rows="8" required placeholder="Paste the job description here..." value={jobDescription} onChange={e => setJobDescription(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="resume-text"><i className="fas fa-file-signature"></i> Your Resume / Cover Letter:</label>
                <textarea id="resume-text" name="resume-text" rows="12" required placeholder="Paste your resume or cover letter text here..." value={resumeText} onChange={e => setResumeText(e.target.value)}></textarea>
              </div>
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Analyzing...</> : <><i className="fas fa-search-dollar"></i> Analyze Documents</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Analyzing, please wait...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>

          {analysis && (
            <section id="analysis-display-section">
              <h2><i className="fas fa-tasks"></i> Feedback</h2>
              <div className="solution-box" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: analysis }}></div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default ResumeAssistant
