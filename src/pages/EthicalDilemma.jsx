import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const dilemmas = {
  trolley: {
    name: "The Trolley Problem",
    description: "A runaway trolley is about to kill five people tied to the main track. You are standing next to a lever that can switch the trolley to a side track, where there is one person tied up. If you pull the lever, the one person will be killed, but the five will be saved. Do you pull the lever?"
  },
  lifeboat: {
    name: "Lifeboat Ethics",
    description: "You are on a lifeboat with four other people after a shipwreck. The boat is designed to hold only four, and it is beginning to sink. To save four people, you must throw one person overboard. One person is severely injured and unlikely to survive long anyway. Another is a brilliant scientist who could save humanity. The other two are ordinary people, just like you. Who do you throw overboard, if anyone?"
  },
  prisoner: {
    name: "The Prisoner's Dilemma",
    description: "You and an accomplice are arrested for a crime. The police separate you and offer each of you a deal. If you betray your accomplice and they stay silent, you go free and they get 10 years. If you both betray each other, you both get 5 years. If you both stay silent, you both get 1 year on a lesser charge. You cannot communicate with your accomplice. What do you do?"
  }
};

const EthicalDilemma = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  
  // Setup state
  const [dilemmaKey, setDilemmaKey] = useState('trolley')
  const [model, setModel] = useState('')

  // Simulation state
  const [simulationState, setSimulationState] = useState(null)
  const [userDecision, setUserDecision] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
  }, [])

  const handleSetupSubmit = (e) => {
    e.preventDefault()
    setSimulationState({
      dilemma: dilemmas[dilemmaKey],
      analysis: ''
    })
  }

  const handleDecisionSubmit = async (e) => {
    e.preventDefault()
    if (!userDecision.trim() || isLoading) return
    setIsLoading(true)
    setError(null)
    
    try {
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

      const systemPrompt = `You are a philosophy professor specializing in ethics. The user was presented with the "${simulationState.dilemma.name}" scenario. They have made a decision and provided their reasoning. Your task is to analyze their response.
      Do not judge their choice as 'right' or 'wrong'. Instead, identify the primary ethical framework they are implicitly using (e.g., Utilitarianism, Deontology, Virtue Ethics). Explain this framework and how their answer fits into it.
      Then, briefly discuss the strengths and weaknesses of their position from the perspective of one or two other major ethical theories. Use Markdown for clear formatting.`
      
      const userPrompt = `Dilemma: ${simulationState.dilemma.description}\n\nMy Decision & Justification:\n${userDecision}`
      
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({ model: fetchModel, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }], max_tokens: 1000 }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message || 'API Error')
      
      setSimulationState(prev => ({ ...prev, analysis: data.choices[0].message.content }))

    } catch (err) {
      setError(err.message)
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
          <p>To use the Ethical Dilemma Simulator, you need a configured provider.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : !simulationState ? (
        <section id="dilemma-setup-section">
          <h2><i className="fas fa-balance-scale"></i> Ethical Dilemma Setup</h2>
          <form onSubmit={handleSetupSubmit}>
            <div>
              <label htmlFor="dilemma-select"><i className="fas fa-tasks"></i> Choose a Dilemma:</label>
              <select id="dilemma-select" value={dilemmaKey} onChange={e => setDilemmaKey(e.target.value)}>
                {Object.keys(dilemmas).map(key => (
                  <option key={key} value={key}>{dilemmas[key].name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="model"><i className="fas fa-robot"></i> AI Model (optional):</label>
              <input type="text" id="model" value={model} onChange={e => setModel(e.target.value)} placeholder="gpt-4.1" />
            </div>
            <button type="submit"><i className="fas fa-play-circle"></i> Start Simulation</button>
          </form>
        </section>
      ) : (
        <>
          <section id="dilemma-arena-section">
            <h2>{simulationState.dilemma.name}</h2>
            <div className="analysis-output-box">
                <h3>The Scenario</h3>
                <p>{simulationState.dilemma.description}</p>
            </div>
            <form onSubmit={handleDecisionSubmit}>
              <label htmlFor="user-decision">Your Decision and Justification:</label>
              <textarea id="user-decision" rows="8" placeholder="What do you do, and why?" value={userDecision} onChange={e => setUserDecision(e.target.value)} disabled={isLoading || simulationState.analysis} />
              <div className="form-buttons" style={{ marginTop: '1rem' }}>
                <button type="submit" disabled={isLoading || simulationState.analysis}>
                  {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Analyzing...</> : <><i className="fas fa-gavel"></i> Submit Decision</>}
                </button>
              </div>
            </form>
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>
          {simulationState.analysis && (
            <section id="dilemma-analysis-section">
              <h2><i className="fas fa-chart-bar"></i> Philosophical Analysis</h2>
              <div className="solution-box" style={{ whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: simulationState.analysis }}></div>
              <button onClick={() => setSimulationState(null)} style={{marginTop: '1.5rem'}}>Try Another Dilemma</button>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default EthicalDilemma
