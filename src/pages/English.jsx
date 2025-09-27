import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ImagePicker from '../components/ImagePicker'

const English = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  // Form state
  const [prompt, setPrompt] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('English')
  const [exerciseType, setExerciseType] = useState(['multiple-choice'])
  const [mcOptionsCount, setMcOptionsCount] = useState(4)
  const [model, setModel] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')

  const toggleExerciseType = (type) => {
    setExerciseType(prev => {
      if (!Array.isArray(prev)) prev = [prev]
      if (prev.includes(type)) return prev.filter(t => t !== type)
      return [...prev, type]
    })
  }
  const [exerciseCount, setExerciseCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const [exerciseContent, setExerciseContent] = useState(null)
  const [history, setHistory] = useState([])
  const [attachedImage, setAttachedImage] = useState(null)
  const [attachedImages, setAttachedImages] = useState([])

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
    // Load history from localStorage
    const storedHistory = localStorage.getItem('englishExerciseHistory')
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory))
    }
  }, [])

  // Make inline MC buttons selectable (acts like radios)
  useEffect(() => {
    if (!document) return;
    const output = document.getElementById('exercise-output');
    if (!output) return;
    const handler = (e) => {
      const btn = e.target.closest && e.target.closest('.mc-option');
      if (!btn) return;
      const question = btn.closest('.question-container') || output;
      const buttons = question.querySelectorAll('.mc-option');
      buttons.forEach(b => {
        if (b === btn) {
          b.classList.add('mc-option-selected');
          b.setAttribute('aria-pressed', 'true');
        } else {
          b.classList.remove('mc-option-selected');
          b.removeAttribute('aria-pressed');
        }
      });
    };
    output.addEventListener('click', handler);
    return () => output.removeEventListener('click', handler);
  }, [exerciseContent])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setExerciseContent(null)

    const apiKey = localStorage.getItem('openai_api_key')
    const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1'
    const defaultModel = localStorage.getItem('openai_default_model') || 'gpt-4o-mini'
    const fetchUrl = `${baseUrl}/chat/completions`
    const fetchHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
    const fetchModel = model || defaultModel

    const systemPrompt = `You are an AI assistant that creates language learning exercises.
Your output MUST be a single block of valid HTML, without any surrounding text, comments, or markdown like \`\`\`html.
The HTML should be structured with divs for each question.
Each question should be in a div with class="question-container".
Inside, include the question text.
For 'multiple-choice', DO NOT use radio inputs. Instead provide inline option buttons with the class "mc-option" and a data-choice attribute indicating the option label, for example:
<button class="mc-option" data-choice="A">A) Option text</button><button class="mc-option" data-choice="B">B) Option text</button>
Buttons should be inline (no vertical newlines between them) and should include the option label in data-choice (A, B, C, ...).
For 'fill-in-the-blank', use an <input type="text" class="inline-blank"> for the blank.
For 'ai-judger', provide a textarea with class="ai-judger-textarea".
Crucially, include the correct answer within a hidden div: <div class="solution" style="display:none;">The correct answer is: C</div>. This is vital for checking answers.
For multiple-choice, the solution should state the correct option label (e.g., "C"). For fill-in-the-blank, it should state the word(s) that go in the blank. For AI judger, the solution should provide model criteria for a good answer.`

    const hasImages = (attachedImages && attachedImages.length) || attachedImage
    const exerciseTypesStr = Array.isArray(exerciseType) ? exerciseType.join(', ') : exerciseType
    const userPrompt = `Please generate an English exercise with the following specifications:
- Exercise Type: ${exerciseTypesStr}
- Topic/Instructions: ${prompt}
- Target Language: ${targetLanguage}
- Difficulty: ${difficulty}
- Number of questions: ${exerciseCount}
${(Array.isArray(exerciseType) ? exerciseType.includes('multiple-choice') : exerciseType === 'multiple-choice') ? `- Number of choices per question: ${mcOptionsCount}` : ''}
 ${hasImages ? '- Note: One or more images are attached and may include context from a picture or screenshot.' : ''}
 Generate the HTML now.`

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: fetchHeaders,
        body: JSON.stringify({
          model: fetchModel,
          messages: [
            { role: 'system', content: systemPrompt },
            (attachedImage || (attachedImages && attachedImages.length))
              ? { role: 'user', content: [ { type: 'text', text: userPrompt }, ...((attachedImages && attachedImages.length ? attachedImages : [attachedImage]).map(url => ({ type: 'image_url', image_url: { url } }))) ] }
              : { role: 'user', content: userPrompt }
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `API error: ${response.statusText}`)
      }

      const generatedContent = data.choices[0].message.content.replace(/```html/g, '').replace(/```/g, '').trim()
      setExerciseContent(generatedContent)
      
      // Save to history
      const newHistoryItem = {
        id: Date.now(),
        prompt,
        exerciseType,
        difficulty,
        timestamp: new Date().toISOString(),
        content: generatedContent,
        image: (attachedImages && attachedImages.length) ? attachedImages[attachedImages.length - 1] : (attachedImage || null),
      }
      const updatedHistory = [newHistoryItem, ...history]
      setHistory(updatedHistory)
      localStorage.setItem('englishExerciseHistory', JSON.stringify(updatedHistory))

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
    const wrongQuestions = [];

    questions.forEach((question) => {
        const solutionDiv = question.querySelector('.solution');
        if (!solutionDiv) return;

        // Reveal solution
        solutionDiv.style.display = 'block';
        solutionDiv.classList.add('solution-box');

        let isGradable = false;
        let isCorrect = false;

        // Handle Multiple Choice buttons or legacy radio inputs
        const mcButtons = question.querySelectorAll('.mc-option');
        if (mcButtons.length > 0) {
            isGradable = true;
            const selectedBtn = question.querySelector('.mc-option-selected');
            const userAnswer = selectedBtn ? (selectedBtn.getAttribute('data-choice') || selectedBtn.textContent.trim().charAt(0)) : '';
            const solutionText = solutionDiv.textContent.split(':').pop().trim().replace(/["'.]/g, '');

            if (userAnswer && solutionText.toLowerCase().startsWith(userAnswer.toLowerCase())) {
                isCorrect = true;
            }
        } else {
            // Fallback for radio inputs
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
                const idx = Array.from(questions).indexOf(question) + 1;
                wrongQuestions.push(idx);
            }
        }
    });
    
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'score-summary solution-box';
    if (gradableCount > 0) {
        const wrongText = wrongQuestions.length > 0 ? `<p>Incorrect questions: ${wrongQuestions.join(', ')}</p>` : `<p>All answers correct. Great job!</p>`;
        summaryDiv.innerHTML = `<h3>Score: ${correctCount} / ${gradableCount} correct</h3>${wrongText}`;
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

          // Reset selected MC buttons if present
          const mcButtons = question.querySelectorAll('.mc-option');
          mcButtons.forEach(b => {
            b.classList.remove('mc-option-selected');
            b.removeAttribute('aria-pressed');
          });

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
                <textarea id="prompt" name="prompt" rows="4" required placeholder="Describe the exercise you want to create..." value={prompt} onChange={e => setPrompt(e.target.value)}></textarea>
              </div>
              <div>
                <ImagePicker id="english-image" label="Attach related image (optional) or use camera" onChange={setAttachedImage} onChangeAll={setAttachedImages} />
              </div>
              <div>
                <label htmlFor="target-language"><i className="fas fa-globe"></i> Target Language:</label>
                <input type="text" id="target-language" name="target-language" value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} />
              </div>
              <div>
                <label><i className="fas fa-list-ul"></i> Exercise Types (pick one or more):</label>
                <div className="checkbox-group">
                  <label><input type="checkbox" value="multiple-choice" checked={exerciseType.includes('multiple-choice')} onChange={() => toggleExerciseType('multiple-choice')} /> Multiple Choice</label>
                  <label><input type="checkbox" value="fill-in-the-blank" checked={exerciseType.includes('fill-in-the-blank')} onChange={() => toggleExerciseType('fill-in-the-blank')} /> Fill-in-the-Blank</label>
                  <label><input type="checkbox" value="ai-judger" checked={exerciseType.includes('ai-judger')} onChange={() => toggleExerciseType('ai-judger')} /> AI Judger (Sentence/Text)</label>
                </div>
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

export default English
