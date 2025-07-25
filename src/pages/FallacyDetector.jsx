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

    const systemPrompt = `You are an AI expert in logical fallacies and cognitive biases. Your task is to analyze a given text.
Your output MUST be a single, valid XML block. Do not include any surrounding text, comments, or markdown like \`\`\`xml.
The XML structure MUST be as follows:
<analysis>
  <highlighted_text>
    Respond with the user's original text, but wrap any identified logical fallacies in a <fallacy> tag and any cognitive biases in a <bias> tag.
    Both tags MUST have two attributes: 'type' for the name of the fallacy/bias (e.g., "Ad Hominem", "Confirmation Bias"), and 'explanation' for a brief, one-sentence explanation of why it's a fallacy or bias.
    Example 1 (Fallacy): "Your argument is wrong because <fallacy type=\"Ad Hominem\" explanation=\"This attacks the person rather than the argument.\">you are a bad person</fallacy>."
    Example 2 (Bias): "I only read news that confirms my views, so <bias type=\"Confirmation Bias\" explanation=\"This is the tendency to favor information that confirms existing beliefs.\">I know I'm right</bias>."
  </highlighted_text>
  <suggestion>
    Provide a revised version of the original argument that is more logically sound and persuasive, removing the fallacies and biases. This should be plain text. If no revision is needed, say so.
  </suggestion>
</analysis>
If no fallacies or biases are found, the <highlighted_text> tag should contain the original, unmodified text, and the <suggestion> tag should contain a message like "The argument appears logically sound as is."`

    const userPrompt = `Please analyze the following text for logical fallacies and provide the XML report:
---
${textToAnalyze}
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
          temperature: 0.3,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `API error: ${response.statusText}`)
      }

      const rawContent = data.choices[0].message.content.trim()
      
      // Parse the XML response
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(rawContent, "application/xml");

      const errorNode = xmlDoc.querySelector('parsererror');
      if (errorNode) {
        console.error("XML parsing error:", errorNode.textContent);
        throw new Error("Failed to parse AI response. The AI did not return valid XML.");
      }
      
      const suggestion = xmlDoc.querySelector('suggestion')?.textContent || 'No suggestion provided.';
      const highlightedTextNode = xmlDoc.querySelector('highlighted_text');

      if (!highlightedTextNode) {
        throw new Error("AI response is missing the <highlighted_text> element.");
      }

      // Serialize the child nodes of <highlighted_text> to a string
      const serializer = new XMLSerializer();
      let innerXml = '';
      highlightedTextNode.childNodes.forEach(node => {
        innerXml += serializer.serializeToString(node);
      });

      // Replace custom tags with styled <span>s
      let processedHtml = innerXml.replace(
        /<fallacy type="([^"]+)" explanation="([^"]+)">([\s\S]*?)<\/fallacy>/g,
        (match, type, explanation, text) => {
          const escapeAttr = (str) => str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          return `<span class="highlighted-fallacy" data-type="${escapeAttr(type)}" data-explanation="${escapeAttr(explanation)}">${text}</span>`;
        }
      );

      processedHtml = processedHtml.replace(
        /<bias type="([^"]+)" explanation="([^"]+)">([\s\S]*?)<\/bias>/g,
        (match, type, explanation, text) => {
          const escapeAttr = (str) => str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          return `<span class="highlighted-bias" data-type="${escapeAttr(type)}" data-explanation="${escapeAttr(explanation)}">${text}</span>`;
        }
      );

      setAnalysisResult({
        highlightedText: processedHtml,
        suggestion: suggestion,
      });

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
              
              <div className="analysis-output-box">
                <h3><i className="fas fa-highlighter"></i> Highlighted Text</h3>
                <p className="subtle-instruction">Hover over highlighted sections to see identified fallacies (amber) and cognitive biases (blue).</p>
                <div className="highlighted-text-content" dangerouslySetInnerHTML={{ __html: analysisResult.highlightedText }}></div>
              </div>

              <div className="analysis-output-box">
                <h3><i className="fas fa-lightbulb"></i> Suggested Improvement</h3>
                <div className="suggestion-content">
                  {analysisResult.suggestion}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default FallacyDetector
