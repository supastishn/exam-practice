import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'

const Writing = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Setup state
  const [noteTopic, setNoteTopic] = useState('')
  const [showPracticeSection, setShowPracticeSection] = useState(false)

  // Writing & Feedback state
  const [userWriting, setUserWriting] = useState('')
  const [feedback, setFeedback] = useState(null) // Will hold { assessment, revisedText, diff }
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('assessment')

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleTopicSubmit = (e) => {
    e.preventDefault()
    if (!noteTopic.trim()) {
      alert('Please enter a title.')
      return
    }
    setShowPracticeSection(true)
  }

  const handleFeedbackSubmit = async () => {
    if (!userWriting.trim()) {
      setError('Please write something before requesting feedback.')
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

    const systemPrompt = `You are an expert writing coach. Analyze the user's text on the topic "${noteTopic}".
      Your output MUST be a single valid JSON object. Do not include any surrounding text or markdown.
      The JSON object must have two keys:
      1. "assessment": A string containing a concise, constructive critique of the writing. Focus on clarity, grammar, style, and structure. Use Markdown for formatting (e.g., lists).
      2. "revised_text": A string containing the full, revised version of the user's text, correcting errors and improving flow.`

    const userPrompt = `Please analyze and revise the following text:
      ---
      ${userWriting}
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
      
      const diffHtml = generateDiffHtml(userWriting, content.revised_text);

      setFeedback({
        assessment: content.assessment,
        revisedText: content.revised_text,
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
    let i = 0;
    let j = 0;

    while (i < originalLines.length || j < revisedLines.length) {
      if (i < originalLines.length && j < revisedLines.length) {
        if (originalLines[i] === revisedLines[j]) {
          html += `<span class="diff-unchanged">${escapeHtml(originalLines[i]) || '&nbsp;'}</span>`;
          i++;
          j++;
        } else {
          html += `<span class="diff-deleted">${escapeHtml(originalLines[i]) || '&nbsp;'}</span>`;
          html += `<span class="diff-inserted">${escapeHtml(revisedLines[j]) || '&nbsp;'}</span>`;
          i++;
          j++;
        }
      } else if (i < originalLines.length) {
        html += `<span class="diff-deleted">${escapeHtml(originalLines[i]) || '&nbsp;'}</span>`;
        i++;
      } else if (j < revisedLines.length) {
        html += `<span class="diff-inserted">${escapeHtml(revisedLines[j]) || '&nbsp;'}</span>`;
        j++;
      }
    }
    return html;
  };

  const escapeHtml = (unsafe) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  return (
      <main>
        <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
        </div>
  
        {!isConfigured ? (
          <section id="credentials-prompt-section">
            <h2><i className="fas fa-key"></i> API Provider Not Configured</h2>
            <p>To use the Writing Collaborator, you need to select a provider in settings.</p>
            <p>You can use the free AI Hack Club provider or your own custom API key.</p>
            <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
          </section>
        ) : (
          <>
            {!showPracticeSection && (
              <section id="writing-setup-section">
                <h2><i className="fas fa-lightbulb"></i> Choose Your Topic</h2>
                <form id="topic-generation-form" onSubmit={handleTopicSubmit}>
                  <div>
                    <label htmlFor="note-topic">What do you want to write about?</label>
                    <input type="text" id="note-topic" value={noteTopic} onChange={e => setNoteTopic(e.target.value)} required placeholder="e.g., The history of the Roman Empire"/>
                  </div>
                  <button type="submit"><i className="fas fa-pencil-alt"></i> Start Writing</button>
                </form>
              </section>
            )}
  
            {showPracticeSection && (
              <>
                <section id="writing-practice-section">
                  <h2><i className="fas fa-pencil-alt"></i> Writing Area</h2>
                  <h3>Topic: {noteTopic}</h3>
                  <textarea id="user-writing-area" rows="15" placeholder="Start writing here..." value={userWriting} onChange={e => setUserWriting(e.target.value)}></textarea>
                  <button id="submit-writing-button" onClick={handleFeedbackSubmit} disabled={isLoading}>
                    {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Getting Feedback...</> : <><i className="fas fa-check"></i> Get Feedback</>}
                  </button>
                  {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> {error}</div>}
                </section>
  
                {feedback && (
                  <section id="feedback-display-section">
                    <h2><i className="fas fa-tasks"></i> Writing Feedback</h2>
                    <div className="feedback-tabs">
                      <button className={`tab-button ${activeTab === 'assessment' ? 'active' : ''}`} onClick={() => handleTabClick('assessment')}>Assessment</button>
                      <button className={`tab-button ${activeTab === 'revision' ? 'active' : ''}`} onClick={() => handleTabClick('revision')}>Full Revision</button>
                      <button className={`tab-button ${activeTab === 'diff' ? 'active' : ''}`} onClick={() => handleTabClick('diff')}>Line-by-Line</button>
                    </div>
  
                    <div id="assessment-tab" className={`tab-content ${activeTab === 'assessment' ? 'active' : ''}`}>
                      <ReactMarkdown>{feedback.assessment}</ReactMarkdown>
                    </div>
                    <div id="revision-tab" className={`tab-content ${activeTab === 'revision' ? 'active' : ''}`} style={{ whiteSpace: 'pre-wrap' }}>{feedback.revisedText}</div>
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

export default Writing
