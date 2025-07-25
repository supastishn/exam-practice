import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const Math = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  // Form state
  const [prompt, setPrompt] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('English')
  const [exerciseType, setExerciseType] = useState('multiple-choice')
  const [mcOptionsCount, setMcOptionsCount] = useState(4)
  const [model, setModel] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [exerciseCount, setExerciseCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [exerciseContent, setExerciseContent] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
    // Load history from localStorage
    const storedHistory = localStorage.getItem('mathExerciseHistory')
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory))
    }
  }, [])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setExerciseContent(null)

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

    const systemPrompt = `You are an AI assistant that creates math exercises.
Your output MUST be a single block of valid HTML, without any surrounding text, comments, or markdown like \`\`\`html.
The HTML should be structured with divs for each question.
Each question should be in a div with class="question-container".
Inside, include the question text (which can be a word problem).
For 'multiple-choice', provide radio buttons for options. The name attribute for radio inputs for a given question should be the same, e.g., "q1", "q2".
For 'fill-in-the-blank', use an <input type="text" class="inline-blank"> for the blank.
For 'ai-judger', provide a textarea with class="ai-judger-textarea" for the student to write their explanation.
Crucially, include the correct answer AND a brief explanation of the solution within a hidden div: <div class="solution" style="display:none;">Correct Answer: ... Explanation: ...</div>. This is vital for checking answers.
For multiple-choice, the solution should state the correct option label (e.g., "C"). For fill-in-the-blank, it should state the numerical answer. For AI judger, the solution should provide model criteria for a good explanation.`

    const userPrompt = `Please generate a math exercise with the following specifications:
- Exercise Type: ${exerciseType}
- Topic/Instructions: ${prompt}
${targetLanguage !== 'English' ? `- Language for Word Problems: ${targetLanguage}` : ''}
- Difficulty: ${difficulty}
- Number of questions: ${exerciseCount}
${exerciseType === 'multiple-choice' ? `- Number of choices per question: ${mcOptionsCount}` : ''}

Generate the HTML now.`

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
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `API error: ${response.statusText}`)
      }

      const generatedContent = data.choices[0].message.content.replace(/```html/g, '').replace(/```/g, '').trim()
      setExerciseContent(generatedContent)
      
      const newHistoryItem = {
        id: Date.now(),
        prompt,
        exerciseType,
        difficulty,
        timestamp: new Date().toISOString(),
        content: generatedContent,
      }
      const updatedHistory = [newHistoryItem, ...history]
      setHistory(updatedHistory)
      localStorage.setItem('mathExerciseHistory', JSON.stringify(updatedHistory))

    } catch (err) {
      setError(err.message)
      console.error('Error generating exercise:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckAnswers = () => {
    const output = document.getElementById('exercise-output');
    if (!output) return;

    // Remove any previous summary
    const oldSummary = output.querySelector('.score-summary');
    if (oldSummary) oldSummary.remove();

    const questions = output.querySelectorAll('.question-container');
    let correctCount = 0;
    let gradableCount = 0;

    questions.forEach((question) => {
        const solutionDiv = question.querySelector('.solution');
        if (!solutionDiv) return;

        // Reveal solution
        solutionDiv.style.display = 'block';
        solutionDiv.classList.add('solution-box');

        let isGradable = false;
        let isCorrect = false;

        // Handle Multiple Choice & True/False
        const radios = question.querySelectorAll('input[type="radio"]');
        if (radios.length > 0) {
            isGradable = true;
            const selectedRadio = question.querySelector('input[type="radio"]:checked');
            const userAnswer = selectedRadio ? selectedRadio.value : '';
            const solutionText = solutionDiv.textContent.split(':').pop().trim().replace(/["'.]/g, '');
            
            if (userAnswer && solutionText.toLowerCase().startsWith(userAnswer.toLowerCase())) {
                isCorrect = true;
            }
        }

        // Handle Fill-in-the-blank
        const blankInput = question.querySelector('input.inline-blank');
        if (blankInput) {
            isGradable = true;
            const userAnswer = blankInput.value.trim();
            const solutionText = solutionDiv.textContent.split(':').pop().trim().replace(/["'.]/g, '');

            const possibleAnswers = solutionText.split(/, | or /i).map(s => s.trim());
            if (userAnswer && possibleAnswers.some(ans => ans.toLowerCase() === userAnswer.toLowerCase())) {
              isCorrect = true;
            }
        }
        
        if (isGradable) {
            gradableCount++;
            question.classList.remove('feedback-correct', 'feedback-incorrect');
            if (isCorrect) {
                correctCount++;
                question.classList.add('feedback-correct');
            } else {
                question.classList.add('feedback-incorrect');
            }
        }
    });
    
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'score-summary solution-box';
    if (gradableCount > 0) {
        summaryDiv.innerHTML = `<h3>Score: ${correctCount} / ${gradableCount} correct</h3>`;
    } else {
        summaryDiv.innerHTML = `<h3>Solutions Revealed</h3><p>This exercise type (e.g., AI Judger) is not automatically graded.</p>`;
    }
    output.prepend(summaryDiv);

    const checkButton = document.getElementById('check-answers-button');
    const tryAgainButton = document.getElementById('try-again-button');
    if (checkButton) checkButton.style.display = 'none';
    if (tryAgainButton) tryAgainButton.style.display = 'inline-block';
  };

  const handleTryAgain = () => {
      const output = document.getElementById('exercise-output');
      if (!output) return;

      const summaryDiv = output.querySelector('.score-summary');
      if (summaryDiv) summaryDiv.remove();

      const questions = output.querySelectorAll('.question-container');
      questions.forEach(question => {
          const solutionDiv = question.querySelector('.solution');
          if (solutionDiv) {
              solutionDiv.style.display = 'none';
              solutionDiv.classList.remove('solution-box');
          }

          question.classList.remove('feedback-correct', 'feedback-incorrect');

          const inputs = question.querySelectorAll('input, textarea');
          inputs.forEach(input => {
              if (input.type === 'radio' || input.type === 'checkbox') {
                  input.checked = false;
              } else if (input.type !== 'button' && input.type !== 'submit') {
                  input.value = '';
              }
          });
      });

      const checkButton = document.getElementById('check-answers-button');
      const tryAgainButton = document.getElementById('try-again-button');
      if (checkButton) checkButton.style.display = 'inline-block';
      if (tryAgainButton) tryAgainButton.style.display = 'none';
  };

  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>
      {!isConfigured ? (
        <section id="credentials-prompt-section">
          <h2><i className="fas fa-key"></i> API Provider Not Configured</h2>
          <p>To generate exercises, you need to select a provider in settings.</p>
          <p>You can use the free AI Hack Club provider or your own custom API key.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section id="exercise-generation-section">
            <h2><i className="fas fa-edit"></i> Generate Exercise</h2>
            <form id="exercise-form" onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="prompt"><i className="fas fa-comment-alt"></i> Prompt / Instructions:</label>
                <textarea id="prompt" name="prompt" rows="4" required placeholder="Describe the math exercise..." value={prompt} onChange={e => setPrompt(e.target.value)}></textarea>
              </div>
              {/* Image Upload Placeholder */}
              <div>
                <label htmlFor="target-language"><i className="fas fa-globe"></i> Language for Word Problems:</label>
                <input type="text" id="target-language" name="target-language" value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} />
              </div>
              <div>
                <label htmlFor="exercise-type"><i className="fas fa-list-ul"></i> Exercise Type:</label>
                <select id="exercise-type" name="exercise-type" value={exerciseType} onChange={e => setExerciseType(e.target.value)}>
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="fill-in-the-blank">Fill-in-the-Blank</option>
                  <option value="ai-judger">AI Judger (Explanations)</option>
                </select>
              </div>
              {exerciseType === 'multiple-choice' && (
                <div id="mc-options-count-group">
                  <label htmlFor="mc-options-count"><i className="fas fa-list-ol"></i> Number of Choices (for MC):</label>
                  <input type="number" id="mc-options-count" name="mc-options-count" min="2" max="10" value={mcOptionsCount} onChange={e => setMcOptionsCount(e.target.value)} />
                </div>
              )}
              <div>
                <label htmlFor="model"><i className="fas fa-robot"></i> OpenAI Model (optional):</label>
                <input type="text" id="model" name="model" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <div>
                <label htmlFor="difficulty"><i className="fas fa-chart-line"></i> Difficulty:</label>
                <select id="difficulty" name="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label htmlFor="exercise-count"><i className="fas fa-list-ol"></i> Questions per Exercise:</label>
                <input type="number" id="exercise-count" name="exercise-count" min="1" max="20" value={exerciseCount} onChange={e => setExerciseCount(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Generating...</> : <><i className="fas fa-magic"></i> Generate Exercise</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Generating exercise, please wait...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>

          {exerciseContent && (
            <section id="exercise-display-section">
              <h2><i className="fas fa-file-alt"></i> Generated Exercise</h2>
              <div id="exercise-output" dangerouslySetInnerHTML={{ __html: exerciseContent }}></div>
              <div className="answer-buttons">
                <button id="check-answers-button" onClick={handleCheckAnswers}><i className="fas fa-check-double"></i> Check Answers</button>
                <button id="try-again-button" onClick={handleTryAgain} style={{ display: 'none' }}><i className="fas fa-redo"></i> Try Again</button>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default Math
