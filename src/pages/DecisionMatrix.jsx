import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const DecisionMatrix = () => {
  const [decision, setDecision] = useState('')
  const [options, setOptions] = useState([{ id: 1, name: '' }])
  const [criteria, setCriteria] = useState([{ id: 1, name: '', weight: 5 }])
  const [scores, setScores] = useState({})
  const [results, setResults] = useState(null)

  const handleAddOption = () => {
    setOptions([...options, { id: Date.now(), name: '' }])
  }
  const handleRemoveOption = (id) => {
    setOptions(options.filter(o => o.id !== id))
  }
  const handleOptionChange = (id, name) => {
    setOptions(options.map(o => (o.id === id ? { ...o, name } : o)))
  }

  const handleAddCriterion = () => {
    setCriteria([...criteria, { id: Date.now(), name: '', weight: 5 }])
  }
  const handleRemoveCriterion = (id) => {
    setCriteria(criteria.filter(c => c.id !== id))
  }
  const handleCriterionChange = (id, field, value) => {
    setCriteria(criteria.map(c => (c.id === id ? { ...c, [field]: value } : c)))
  }
  
  const handleScoreChange = (optionId, criterionId, value) => {
    const score = parseInt(value, 10)
    setScores({ ...scores, [`${optionId}-${criterionId}`]: isNaN(score) ? 0 : score })
  }

  const calculateResults = () => {
    const calculatedResults = options.map(option => {
      if (!option.name.trim()) return null
      
      const totalScore = criteria.reduce((acc, criterion) => {
        const score = scores[`${option.id}-${criterion.id}`] || 0
        const weight = Number(criterion.weight) || 0
        return acc + score * weight
      }, 0)

      return { optionName: option.name, totalScore }
    }).filter(Boolean)

    calculatedResults.sort((a, b) => b.totalScore - a.totalScore)
    setResults(calculatedResults)
  }

  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>
      <section>
        <h2><i className="fas fa-project-diagram"></i> Decision-Making Matrix</h2>
        <div>
          <label htmlFor="decision">What decision are you trying to make?</label>
          <input type="text" id="decision" value={decision} onChange={e => setDecision(e.target.value)} placeholder="e.g., Which car should I buy?" />
        </div>
      </section>

      <section>
        <h3><i className="fas fa-list-ul"></i> Options</h3>
        {options.map((option, index) => (
          <div key={option.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input type="text" value={option.name} onChange={e => handleOptionChange(option.id, e.target.value)} placeholder={`Option ${index + 1}`} style={{ marginBottom: 0 }}/>
            <button onClick={() => handleRemoveOption(option.id)} className="button-secondary" style={{ padding: '0.5rem', background: '#dc3545', border: 'none' }} aria-label="Remove option"><i className="fas fa-trash"></i></button>
          </div>
        ))}
        <button onClick={handleAddOption}><i className="fas fa-plus"></i> Add Option</button>
      </section>

      <section>
        <h3><i className="fas fa-balance-scale"></i> Criteria & Weighting</h3>
        {criteria.map((criterion, index) => (
          <div key={criterion.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <input type="text" value={criterion.name} onChange={e => handleCriterionChange(criterion.id, 'name', e.target.value)} placeholder={`Criterion ${index + 1} (e.g., Cost)`} style={{ flex: 3, marginBottom: 0 }} />
            <label htmlFor={`weight-${criterion.id}`} style={{ marginBottom: 0 }}>Weight (1-10):</label>
            <input type="number" id={`weight-${criterion.id}`} value={criterion.weight} onChange={e => handleCriterionChange(criterion.id, 'weight', e.target.value)} min="1" max="10" style={{ flex: 1, marginBottom: 0 }} />
            <button onClick={() => handleRemoveCriterion(criterion.id)} className="button-secondary" style={{ padding: '0.5rem', background: '#dc3545', border: 'none' }} aria-label="Remove criterion"><i className="fas fa-trash"></i></button>
          </div>
        ))}
        <button onClick={handleAddCriterion}><i className="fas fa-plus"></i> Add Criterion</button>
      </section>

      {options.length > 0 && criteria.length > 0 && (
        <section>
          <h3><i className="fas fa-clipboard-check"></i> Scoring (1-10)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', border: '1px solid var(--border-color)', textAlign: 'left' }}>Option</th>
                  {criteria.map(c => <th key={c.id} style={{ padding: '8px', border: '1px solid var(--border-color)' }}>{c.name || '...'}</th>)}
                </tr>
              </thead>
              <tbody>
                {options.map(option => (
                  <tr key={option.id}>
                    <td style={{ padding: '8px', border: '1px solid var(--border-color)', fontWeight: 'bold' }}>{option.name || '...'}</td>
                    {criteria.map(criterion => (
                      <td key={criterion.id} style={{ padding: '8px', border: '1px solid var(--border-color)' }}>
                        <input type="number" min="1" max="10" onChange={e => handleScoreChange(option.id, criterion.id, e.target.value)} style={{ width: '60px', textAlign: 'center', marginBottom: 0 }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={calculateResults} style={{ marginTop: '1.5rem' }}><i className="fas fa-calculator"></i> Calculate Scores</button>
        </section>
      )}

      {results && (
        <section>
          <h3><i className="fas fa-trophy"></i> Results</h3>
          <ul className="feedback-analysis-section">
            {results.map((res, index) => (
              <li key={index} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: index === 0 ? 'bold' : 'normal', color: index === 0 ? 'var(--primary-color)' : 'inherit' }}>
                <span>{index + 1}. {res.optionName}</span>
                <span>Score: {res.totalScore}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

export default DecisionMatrix
