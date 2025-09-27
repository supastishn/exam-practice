import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ImagePicker from '../components/ImagePicker'

const Memorization = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  // Form state
  const [memorizationText, setMemorizationText] = useState('')
  const [targetLanguage, setTargetLanguage] = useState('English')
  const [exerciseType, setExerciseType] = useState(['mixed'])
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

  const [quizContent, setQuizContent] = useState(null)
  const [history, setHistory] = useState([])
  const [attachedImage, setAttachedImage] = useState(null)
  const [attachedImages, setAttachedImages] = useState([])

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
    // Load history from localStorage
    const storedHistory = localStorage.getItem('memorizationHistory')
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory))
    }
  }, [])

  // Delegated click handler so mc-option buttons behave like single-select options
  useEffect(() => {
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
  }, [quizContent])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setQuizContent(null)

    if (!memorizationText.trim()) {
      setError("Please enter the text you want to memorize.")
      setIsLoading(false)
      return
    }

    const apiKey = localStorage.getItem('openai_api_key')
    const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1'
    const defaultModel = localStorage.getItem('openai_default_model') || 'gpt-4o-mini'
    const fetchUrl = `${baseUrl}/chat/completions`
    const fetchHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` }
    const fetchModel = model || defaultModel

    const systemPrompt = `You are an AI assistant that creates quizzes to help users memorize a given text.
Your output MUST be a single block of valid HTML, without any surrounding text, comments, or markdown like \`\`\`html.
The HTML should be structured with divs for each question.
Each question should be in a div with class="question-container".
The questions should test recall and understanding of the provided text.
For 'multiple-choice', DO NOT use radio inputs. Instead provide inline option buttons with the class "mc-option" and a data-choice attribute indicating the option label, for example:
<button class="mc-option" data-choice="A">A) Option text</button><button class="mc-option" data-choice="B">B) Option text</button>
Buttons should be inline (no vertical newlines between them) and should include the option label in data-choice (A, B, C, ...).
For 'fill-in-the-blank', use an <input type="text" class="inline-blank">.
For 'ai-judger', provide a textarea with class="ai-judger-textarea" for a free response.
For 'true-false', provide inline buttons or radio fallbacks for "True" and "False".
For 'mixed', use a combination of the above types.
Crucially, include the correct answer within a hidden div: <div class="solution" style="display:none;">Correct Answer: A</div>. For questions about specific parts of the text, you can also include the relevant quote in the solution.`

    const hasImages = (attachedImages && attachedImages.length) || attachedImage
    const exerciseTypesStr = Array.isArray(exerciseType) ? exerciseType.join(', ') : exerciseType
    const userPrompt = `Please generate a quiz to help me memorize the following text.
**Text to Memorize:**
---
${memorizationText}
---

**Quiz Specifications:**
- Question Style: ${exerciseTypesStr}
- Language for Quiz Questions: ${targetLanguage}
- Difficulty: ${difficulty}
- Number of questions: ${exerciseCount}
${(Array.isArray(exerciseType) ? (exerciseType.includes('multiple-choice') || exerciseType.includes('mixed')) : (exerciseType === 'multiple-choice' || exerciseType === 'mixed')) ? `- Number of choices for Multiple Choice questions: ${mcOptionsCount}` : ''}
 ${hasImages ? '- Note: One or more images are attached that may contain relevant text or diagrams.' : ''}
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
          temperature: 0.6,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `API error: ${response.statusText}`)
      }

      const generatedContent = data.choices[0].message.content.replace(/```html/g, '').replace(/```/g, '').trim()
      setQuizContent(generatedContent)
      
      const newHistoryItem = {
        id: Date.now(),
        text: memorizationText.substring(0, 100),
        exerciseType,
        difficulty,
        timestamp: new Date().toISOString(),
        content: generatedContent,
        image: (attachedImages && attachedImages.length) ? attachedImages[attachedImages.length - 1] : (attachedImage || null),
      }
      const updatedHistory = [newHistoryItem, ...history]
      setHistory(updatedHistory)
      localStorage.setItem('memorizationHistory', JSON.stringify(updatedHistory))

    } catch (err) {
      setError(err.message)
      console.error('Error generating quiz:', err)
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

          // Reset MC buttons if present
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
          <p>To generate quizzes, you need to select a provider in settings.</p>
          <p>You can use the free AI Hack Club provider or your own custom API key.</p>
          <p><Link to="/settings" className="button-like-link" style={{ marginTop: '1rem' }}><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section id="exercise-generation-section">
            <h2><i className="fas fa-edit"></i> Generate Quiz</h2>
            <form id="exercise-form" onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="memorization-text"><i className="fas fa-file-alt"></i> Text to Memorize:</label>
                <textarea id="memorization-text" name="memorization-text" rows="6" placeholder="Paste or type the text you want to memorize here..." value={memorizationText} onChange={e => setMemorizationText(e.target.value)}></textarea>
              </div>
              <div>
                <ImagePicker id="memorization-image" label="Attach related image (optional) or use camera" onChange={setAttachedImage} onChangeAll={setAttachedImages} />
              </div>
              <div>
                <label htmlFor="target-language"><i className="fas fa-globe"></i> Language for Quiz Questions:</label>
                <input type="text" id="target-language" name="target-language" value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} />
              </div>
              <div>
                <label><i className="fas fa-list-ul"></i> Quiz Question Styles (pick one or more):</label>
                <div className="checkbox-group">
                  <label><input type="checkbox" value="mixed" checked={exerciseType.includes('mixed')} onChange={() => toggleExerciseType('mixed')} /> Mixed (Recommended)</label>
                  <label><input type="checkbox" value="multiple-choice" checked={exerciseType.includes('multiple-choice')} onChange={() => toggleExerciseType('multiple-choice')} /> Multiple Choice</label>
                  <label><input type="checkbox" value="fill-in-the-blank" checked={exerciseType.includes('fill-in-the-blank')} onChange={() => toggleExerciseType('fill-in-the-blank')} /> Fill-in-the-Blank</label>
                  <label><input type="checkbox" value="ai-judger" checked={exerciseType.includes('ai-judger')} onChange={() => toggleExerciseType('ai-judger')} /> AI Judger (Free Response)</label>
                  <label><input type="checkbox" value="true-false" checked={exerciseType.includes('true-false')} onChange={() => toggleExerciseType('true-false')} /> True/False</label>
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
                <label htmlFor="exercise-count"><i className="fas fa-list-ol"></i> Number of Questions in Quiz:</label>
                <input type="number" id="exercise-count" name="exercise-count" min="1" max="20" value={exerciseCount} onChange={e => setExerciseCount(e.target.value)} />
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <><i className="fas fa-spinner fa-spin"></i> Generating...</> : <><i className="fas fa-magic"></i> Generate Quiz</>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Generating quiz, please wait...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>

          {quizContent && (
            <section id="exercise-display-section">
              <h2><i className="fas fa-question-circle"></i> Generated Quiz</h2>
              <div id="exercise-output" dangerouslySetInnerHTML={{ __html: quizContent }}></div>
              <div className="answer-buttons">
                <button id="check-answers-button" onClick={handleCheckAnswers}><i className="fas fa-check-double"></i> Check Answers</button>
                <button id="try-again-button" onClick={handleTryAgain} style={{ display: 'none' }}><i className="fas fa-redo"></i> Try Again</button>
              </div>
              {/* Answer and Solution sections would go here */}
            </section>
          )}

          <section id="history-section">
            <h2><span><i className="fas fa-history"></i> Quiz History</span></h2>
            <ul id="history-list">{/* History items will be rendered here */}</ul>
          </section>
        </>
      )}
    </main>
  )
}

export default Memorization
