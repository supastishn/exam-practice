import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const TranslationPractice = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Setup state
  const [sourceText, setSourceText] = useState('')
  const [sourceLang, setSourceLang] = useState('English')
  const [targetLang, setTargetLang] = useState('Spanish')
  const [showPracticeSection, setShowPracticeSection] = useState(false)

  // Practice & Feedback state
  const [userTranslation, setUserTranslation] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('assessment')

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleSetupSubmit = (e) => {
    e.preventDefault()
    if (!sourceText.trim()) {
      alert('Please enter text to translate.')
      return
    }
    setShowPracticeSection(true)
  }

  const handleFeedbackSubmit = async () => {
    if (!userTranslation.trim()) {
      setError('Please enter your translation before requesting feedback.')
      return
    }
    setIsLoading(true)
    setError(null)
    setFeedback(null)

    const provider = localStorage.getItem('api_provider') || 'custom'
    let fetchUrl, fetchHeaders, fetchModel

    if (provider === 'hackclub') {
      fetchUrl = 'https://ai.hackclub.com/chat/completions'
      fetchHeaders = { 'Content-Type': 'application/json' }
      fetchModel = 'mistral-7b-instruct'
    } else {
      const apiKey = localStorage.getItem('openai_api_key')
      const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1'
      const defaultModel = localStorage.getItem('openai_default_model') || 'gpt-3.5-turbo'
      
      fetchUrl = `${baseUrl}/chat/completions`
      fetchHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
      fetchModel = defaultModel
    }

    const systemPrompt = `You are a language translation expert. The user is practicing translation.
      Your output MUST be a single valid JSON object. Do not include any surrounding text or markdown.
      The JSON object must have two keys:
      1. "assessment": A string containing a concise, constructive critique of the user's translation. Evaluate accuracy, grammar, tone, and style. Use Markdown for formatting.
      2. "model_translation": A string containing your expert, natural-sounding translation of the source text into the target language.`

    const userPrompt = `Please evaluate my translation.
      - Source Language: ${sourceLang}
      - Target Language: ${targetLang}
      
      **Source Text:**
      ---
      ${sourceText}
      ---
      
      **My Translation:**
      ---
      ${userTranslation}
      ---`

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({ model: fetchModel, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], response_format: { type: "json_object" } }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')

      const content = JSON.parse(data.choices[0].message.content)
      
      const diffHtml = generateDiffHtml(userTranslation, content.model_translation);

      setFeedback({
        assessment: content.assessment,
        modelTranslation: content.model_translation,
        diff: diffHtml,
      })
      setActiveTab('assessment')

    } catch (err) {
      setError(`Failed to get feedback: ${err.message}`)
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const generateDiffHtml = (original, revised) => {
    const originalLines = original.split('\n');
    const revisedLines = revised.split('\n');
    let html = '';
    let i = 0, j = 0;
    while (i < originalLines.length || j < revisedLines.length) {
      if (i < originalLines.length && j < revisedLines.length && originalLines[i] === revisedLines[j]) {
        html += `<span class="diff-unchanged">${escapeHtml(originalLines[i]) || '&nbsp;'}</span>`;
        i++; j++;
      } else {
        if (i < originalLines.length) {
            html += `<span class="diff-deleted">${escapeHtml(originalLines[i]) || '&nbsp;'}</span>`;
            i++;
        }
        if (j < revisedLines.length) {
            html += `<span class="diff-inserted">${escapeHtml(revisedLines[j]) || '&nbsp;'}</span>`;
            j++;
        }
      }
    }
    return html;
  };

  const escapeHtml = (unsafe) => {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  return (
      <main>
        <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
        </div>
  
        {!isConfigured ? (
          <section>
            <h2><i className="fas fa-key"></i> API Provider Not Configured</h2>
            <p>To use the Translation Tool, you need to select a provider in settings.</p>
            <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
          </section>
        ) : (
          <>
            {!showPracticeSection && (
              <section id="translation-setup-section">
                <h2><i className="fas fa-language"></i> Translation Setup</h2>
                <form onSubmit={handleSetupSubmit}>
                  <div>
                    <label htmlFor="source-lang">Source Language</label>
                    <input type="text" id="source-lang" value={sourceLang} onChange={e => setSourceLang(e.target.value)} required />
                  </div>
                  <div>
                    <label htmlFor="target-lang">Target Language</label>
                    <input type="text" id="target-lang" value={targetLang} onChange={e => setTargetLang(e.target.value)} required />
                  </div>
                  <div>
                    <label htmlFor="source-text">Text to Translate</label>
                    <textarea id="source-text" rows="8" value={sourceText} onChange={e => setSourceText(e.target.value)} required placeholder="Enter the text you want to practice translating..."/>
                  </div>
                  <button type="submit"><i className="fas fa-pencil-alt"></i> Start Translating</button>
                </form>
              </section>
            )}
  
            {showPracticeSection && (
              <>
                <section id="translation-practice-section">
                  <h2><i className="fas fa-pencil-alt"></i> Translation Area</h2>
                  <div className="analysis-output-box">
                      <h3>Source Text ({sourceLang})</h3>
                      <p style={{whiteSpace: 'pre-wrap'}}>{sourceText}</p>
                  </div>
                  <label htmlFor="user-translation-area">Your Translation ({targetLang})</label>
                  <textarea id="user-translation-area" rows="8" placeholder="Enter your translation here..." value={userTranslation} onChange={e => setUserTranslation(e.target.value)}></textarea>
                  <button onClick={handleFeedbackSubmit} disabled={isLoading}>
                    {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Getting Feedback...</> : <><i className="fas fa-check"></i> Get Feedback</>}
                  </button>
                  {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> {error}</div>}
                </section>
  
                {feedback && (
                  <section id="feedback-display-section">
                    <h2><i className="fas fa-tasks"></i> Translation Feedback</h2>
                    <div className="feedback-tabs">
                      <button className={`tab-button ${activeTab === 'assessment' ? 'active' : ''}`} onClick={() => setActiveTab('assessment')}>Assessment</button>
                      <button className={`tab-button ${activeTab === 'revision' ? 'active' : ''}`} onClick={() => setActiveTab('revision')}>Model Translation</button>
                      <button className={`tab-button ${activeTab === 'diff' ? 'active' : ''}`} onClick={() => setActiveTab('diff')}>Line-by-Line</button>
                    </div>
  
                    <div id="assessment-tab" className={`tab-content ${activeTab === 'assessment' ? 'active' : ''}`} dangerouslySetInnerHTML={{ __html: feedback.assessment }}></div>
                    <div id="revision-tab" className={`tab-content ${activeTab === 'revision' ? 'active' : ''}`} style={{ whiteSpace: 'pre-wrap' }}>{feedback.modelTranslation}</div>
                    <div id="diff-tab" className={`tab-content ${activeTab === 'diff' ? 'active' : ''}`}>
                      <pre id="diff-pre" dangerouslySetInnerHTML={{ __html: feedback.diff }}></pre>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </main>
    )
}

export default TranslationPractice
