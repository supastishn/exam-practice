import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ImagePicker from '../components/ImagePicker'

const ReadingComprehension = () => {
  const [isConfigured, setIsConfigured] = useState(false)
  const [topic, setTopic] = useState('')
  const [passageLength, setPassageLength] = useState('medium') // short / medium / long
  const [questionTypes, setQuestionTypes] = useState(['multiple-choice'])
  const [mcOptionsCount, setMcOptionsCount] = useState(4)
  const [questionCount, setQuestionCount] = useState(5)
  const [model, setModel] = useState('')
  const [difficulty, setDifficulty] = useState('intermediate')
  const [guidelines, setGuidelines] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [exerciseContent, setExerciseContent] = useState(null)
  const [attachedImage, setAttachedImage] = useState(null)
  const [attachedImages, setAttachedImages] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    const provider = localStorage.getItem('api_provider') || 'custom'
    const key = localStorage.getItem('openai_api_key')
    setIsConfigured(provider === 'hackclub' || (provider === 'custom' && !!key))
    const stored = localStorage.getItem('readingHistory')
    if (stored) setHistory(JSON.parse(stored))
  }, [])

  // Delegated click handler to make .mc-option behave like radio buttons
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
  }, [exerciseContent])

  const toggleQuestionType = (type) => {
    setQuestionTypes(prev => {
      if (!Array.isArray(prev)) prev = [prev]
      if (prev.includes(type)) return prev.filter(t => t !== type)
      return [...prev, type]
    })
  }

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

    const systemPrompt = `You are an AI assistant that creates reading comprehension passages and related questions.
Your output MUST be a single block of valid HTML, without any surrounding text, comments, or markdown like \`\`\`html.
The HTML should be structured with a main passage in a div with class="passage" and subsequent questions each in a div with class="question-container".
Each question should include the question text.
For 'multiple-choice', DO NOT use radio inputs. Instead provide inline option buttons with the class "mc-option" and a data-choice attribute indicating the option label, for example:
<button class="mc-option" data-choice="A">A) Option text</button><button class="mc-option" data-choice="B">B) Option text</button>
Buttons should be inline (no vertical newlines between them) and should include the option label in data-choice (A, B, C, ...).
For 'fill-in-the-blank', use an <input type="text" class="inline-blank"> for the blank.
For 'ai-judger', provide a textarea with class="ai-judger-textarea".
Crucially, include the correct answer within a hidden div: <div class="solution" style="display:none;">The correct answer is: C</div>. This is vital for checking answers.
For multiple-choice, the solution should state the correct option label (e.g., "C"). For fill-in-the-blank, it should state the word(s) that go in the blank. For AI judger, the solution should provide model criteria for a good answer.
All questions must be answerable directly from the passage text: do not ask questions that require outside knowledge or speculative inference beyond what is explicitly stated or clearly implied by the passage. Ensure each question's correct answer is supported by explicit wording or an unambiguous inference from the passage.`

    const hasImages = (attachedImages && attachedImages.length) || attachedImage
    const qTypesStr = Array.isArray(questionTypes) ? questionTypes.join(', ') : questionTypes
    const userPrompt = `Please generate a reading comprehension passage and ${questionCount} questions with the following specifications:
- Topic/Instructions: ${topic}
- Passage length: ${passageLength}
- Question Types: ${qTypesStr}
- Difficulty: ${difficulty}
- Number of choices per multiple-choice question: ${mcOptionsCount}
${hasImages ? '- Note: One or more images are attached and may include context from a picture or screenshot.' : ''}
${guidelines ? `- Extra guidelines: ${guidelines}` : ''}
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
      if (!response.ok) throw new Error(data.error?.message || `API error: ${response.statusText}`)
      const generated = data.choices[0].message.content.replace(/```html/g, '').replace(/```/g, '').trim()
      setExerciseContent(generated)

      const newItem = { id: Date.now(), topic, passageLength, questionCount, difficulty, timestamp: new Date().toISOString(), content: generated }
      const updated = [newItem, ...history]
      setHistory(updated)
      localStorage.setItem('readingHistory', JSON.stringify(updated))
    } catch (err) {
      setError(err.message)
      console.error('Error generating reading comprehension:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckAnswers = async () => {
    const output = document.getElementById('exercise-output');
    if (!output) return;
    const oldSummary = output.querySelector('.score-summary');
    if (oldSummary) oldSummary.remove();

    const questions = Array.from(output.querySelectorAll('.question-container'));
    let correctCount = 0;
    let gradableCount = 0;
    const wrongQuestions = [];

    // collect AI-judger tasks to evaluate via API
    const aiTasks = [];

    // First pass: handle MC, blanks, radios; collect ai tasks
    questions.forEach((question) => {
      const solutionDiv = question.querySelector('.solution');
      if (!solutionDiv) return;

      const aiTextarea = question.querySelector('.ai-judger-textarea');
      if (aiTextarea) {
        // For AI-judger questions, don't reveal the solution yet.
        // Add or reset a feedback placeholder
        let feedbackEl = question.querySelector('.ai-judger-feedback');
        if (!feedbackEl) {
          feedbackEl = document.createElement('div');
          feedbackEl.className = 'ai-judger-feedback';
          feedbackEl.textContent = 'Evaluating answer...';
          feedbackEl.style.marginTop = '0.75rem';
          question.appendChild(feedbackEl);
        } else {
          feedbackEl.textContent = 'Evaluating answer...';
        }

        const criteria = solutionDiv ? solutionDiv.textContent.split(':').pop().trim().replace(/["'.]/g, '') : '';
        aiTasks.push({ question, userAnswer: aiTextarea.value.trim(), criteria, feedbackEl });
        return;
      }

      // Non-AI-judger: reveal solution and grade locally
      solutionDiv.style.display = 'block';
      solutionDiv.classList.add('solution-box');

      let isGradable = false;
      let isCorrect = false;

      const mcButtons = question.querySelectorAll('.mc-option');
      if (mcButtons.length > 0) {
        isGradable = true;
        const selectedBtn = question.querySelector('.mc-option-selected');
        const userAnswer = selectedBtn ? (selectedBtn.getAttribute('data-choice') || selectedBtn.textContent.trim().charAt(0)) : '';
        const solutionText = solutionDiv.textContent.split(':').pop().trim().replace(/["'.]/g, '');
        if (userAnswer && solutionText.toLowerCase().startsWith(userAnswer.toLowerCase())) isCorrect = true;
      } else {
        const radios = question.querySelectorAll('input[type="radio"]');
        if (radios.length > 0) {
          isGradable = true;
          const selectedRadio = question.querySelector('input[type="radio"]:checked');
          const userAnswer = selectedRadio ? selectedRadio.value : '';
          const solutionText = solutionDiv.textContent.split(':').pop().trim().replace(/["'.]/g, '');
          if (userAnswer && solutionText.toLowerCase().startsWith(userAnswer.toLowerCase())) isCorrect = true;
        }
      }

      const blankInput = question.querySelector('input.inline-blank');
      if (blankInput) {
        isGradable = true;
        const userAnswer = blankInput.value.trim();
        const solutionText = solutionDiv.textContent.split(':').pop().trim().replace(/["'.]/g, '');
        const possibleAnswers = solutionText.split(/, | or /i).map(s => s.trim());
        if (userAnswer && possibleAnswers.some(ans => ans.toLowerCase() === userAnswer.toLowerCase())) isCorrect = true;
      }

      if (isGradable) {
        gradableCount++;
        question.classList.remove('feedback-correct', 'feedback-incorrect');
        if (isCorrect) {
          correctCount++;
          question.classList.add('feedback-correct');
        } else {
          question.classList.add('feedback-incorrect');
          const idx = questions.indexOf(question) + 1;
          wrongQuestions.push(idx);
        }
      }
    });

    // Evaluate AI-judger answers via API
    if (aiTasks.length > 0) {
      const apiKey = localStorage.getItem('openai_api_key');
      const baseUrl = localStorage.getItem('openai_base_url') || 'https://api.openai.com/v1';
      const defaultModel = localStorage.getItem('openai_default_model') || 'gpt-4o-mini';
      const fetchUrl = `${baseUrl}/chat/completions`;
      const fetchHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
      const fetchModel = model || defaultModel;

      for (const task of aiTasks) {
        try {
          const systemPrompt = `You are an assistant that judges whether a student's free-text answer meets provided model criteria. Respond only with JSON in this exact form:
{"verdict":"Correct|Partially Correct|Incorrect","explanation":"one-sentence justification"}.
Do not include extra text.`;

          const userPrompt = `Model criteria: ${task.criteria}
${guidelines ? `Guidelines: ${guidelines}\n` : ''}
Student answer: ${task.userAnswer}

Return JSON as instructed.`;

          const resp = await fetch(fetchUrl, {
            method: 'POST',
            headers: fetchHeaders,
            body: JSON.stringify({
              model: fetchModel,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
              ],
              max_tokens: 200,
              temperature: 0.0,
            }),
          });

          const data = await resp.json();
          let content = '';
          if (resp.ok && data.choices && data.choices[0] && data.choices[0].message) {
            content = (data.choices[0].message.content || '').trim();
          } else {
            content = (data.error?.message || JSON.stringify(data)).toString();
          }

          // Try to parse JSON from the model output
          let parsed = null;
          try {
            parsed = JSON.parse(content);
          } catch (err) {
            // Attempt to extract JSON substring
            const m = content.match(/\{[\s\S]*\}/);
            if (m) {
              try { parsed = JSON.parse(m[0]); } catch (e) { parsed = null; }
            }
          }

          const verdictRaw = parsed?.verdict || content.split('\n')[0] || 'Unable to judge';
          const explanation = parsed?.explanation || parsed?.explain || content;

          // Update UI
          task.feedbackEl.textContent = `${verdictRaw}: ${explanation}`;
          task.question.classList.remove('feedback-correct', 'feedback-incorrect', 'feedback-partially-correct');

          if (typeof verdictRaw === 'string' && verdictRaw.toLowerCase().startsWith('correct')) {
            task.question.classList.add('feedback-correct');
            correctCount++;
            gradableCount++;
          } else if (typeof verdictRaw === 'string' && verdictRaw.toLowerCase().includes('part')) {
            task.question.classList.add('feedback-partially-correct');
            gradableCount++;
          } else {
            task.question.classList.add('feedback-incorrect');
            gradableCount++;
            const idx = questions.indexOf(task.question) + 1;
            wrongQuestions.push(idx);
          }
        } catch (err) {
          console.error('AI judger error:', err);
          task.feedbackEl.textContent = 'Error evaluating answer.';
        }
      }
    }

    // Summary
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'score-summary solution-box';
    if (gradableCount > 0) {
      const wrongText = wrongQuestions.length > 0 ? `<p>Incorrect questions: ${wrongQuestions.join(', ')}</p>` : `<p>All answers correct. Great job!</p>`;
      summaryDiv.innerHTML = `<h3>Score: ${correctCount} / ${gradableCount} correct</h3>${wrongText}`;
    } else {
      summaryDiv.innerHTML = `<h3>Solutions Revealed</h3><p>This exercise type is not automatically graded.</p>`;
    }
    output.prepend(summaryDiv);

    const checkButton = document.getElementById('check-answers-button');
    const tryAgainButton = document.getElementById('try-again-button');
    if (checkButton) checkButton.style.display = 'none';
    if (tryAgainButton) tryAgainButton.style.display = 'inline-block';
  }

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
  }

  return (
    <main>
      <div className="back-to-portal-container" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
        <Link to="/" className="button-like-link"><i className="fas fa-arrow-left"></i> Back to Portal</Link>
      </div>

      {!isConfigured ? (
        <section id="credentials-prompt-section">
          <h2><i className="fas fa-key"></i> API Provider Not Configured</h2>
          <p>To generate reading passages and questions, select a provider in Settings.</p>
          <p><Link to="/settings" className="button-like-link"><i className="fas fa-cog"></i> Go to Settings</Link></p>
        </section>
      ) : (
        <>
          <section id="exercise-generation-section">
            <h2><i className="fas fa-book"></i> Generate Reading Passage & Questions</h2>
            <form id="exercise-form" onSubmit={handleFormSubmit}>
              <div>
                <label htmlFor="topic"><i className="fas fa-comment-alt"></i> Topic / Prompt:</label>
                <input id="topic" name="topic" className="standard-input" required placeholder="Enter topic or prompt for the passage" value={topic} onChange={e => setTopic(e.target.value)} />
              </div>
              <div>
                <ImagePicker id="reading-image" label="Attach related image (optional)" onChange={setAttachedImage} onChangeAll={setAttachedImages} />
              </div>
              <div>
                <label><i className="fas fa-align-left"></i> Passage Length:</label>
                <select value={passageLength} onChange={e => setPassageLength(e.target.value)}>
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
              <div>
                <label><i className="fas fa-list-ul"></i> Question Types:</label>
                <div className="checkbox-group">
                  <label><input type="checkbox" value="multiple-choice" checked={questionTypes.includes('multiple-choice')} onChange={() => toggleQuestionType('multiple-choice')} /> Multiple Choice</label>
                  <label><input type="checkbox" value="fill-in-the-blank" checked={questionTypes.includes('fill-in-the-blank')} onChange={() => toggleQuestionType('fill-in-the-blank')} /> Fill-in-the-Blank</label>
                  <label><input type="checkbox" value="ai-judger" checked={questionTypes.includes('ai-judger')} onChange={() => toggleQuestionType('ai-judger')} /> Short Answer</label>
                </div>
              </div>
              {questionTypes.includes('multiple-choice') && (
                <div>
                  <label><i className="fas fa-list-ol"></i> Choices per MC question:</label>
                  <input type="number" min="2" max="6" value={mcOptionsCount} onChange={e => setMcOptionsCount(e.target.value)} />
                </div>
              )}
              <div>
                <label><i className="fas fa-list-ol"></i> Number of Questions:</label>
                <input type="number" min="1" max="20" value={questionCount} onChange={e => setQuestionCount(e.target.value)} />
              </div>
              <div>
                <label><i className="fas fa-robot"></i> OpenAI Model (optional):</label>
                <input type="text" placeholder="gpt-4.1" value={model} onChange={e => setModel(e.target.value)} />
              </div>
              <div>
                <label htmlFor="guidelines"><i className="fas fa-info-circle"></i> Extra Guidelines (optional):</label>
                <textarea id="guidelines" name="guidelines" rows="2" placeholder="Any extra instructions for the AI (grading style, strictness, hints to include)..." value={guidelines} onChange={e => setGuidelines(e.target.value)}></textarea>
              </div>
              <div>
                <label><i className="fas fa-chart-line"></i> Difficulty:</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <button type="submit" disabled={isLoading}>
                {isLoading ? <span><i className="fas fa-spinner fa-spin"></i> Generating...</span> : <span><i className="fas fa-magic"></i> Generate Passage & Questions</span>}
              </button>
            </form>
            {isLoading && <div style={{ marginTop: '1rem' }}><i className="fas fa-spinner fa-spin"></i> Generating, please wait...</div>}
            {error && <div style={{ color: 'red', marginTop: '1rem' }}><i className="fas fa-times-circle"></i> Error: {error}</div>}
          </section>

          {exerciseContent && (
            <section id="exercise-display-section">
              <h2><i className="fas fa-file-alt"></i> Generated Passage & Questions</h2>
              <div id="exercise-output" dangerouslySetInnerHTML={{ __html: exerciseContent }}></div>
              <div className="answer-buttons">
                <button id="check-answers-button" onClick={handleCheckAnswers}><i className="fas fa-check-double"></i> Check Answers</button>
                <button id="try-again-button" onClick={handleTryAgain} style={{ display: 'none' }}><i className="fas fa-redo"></i> Try Again</button>
              </div>
            </section>
          )}

          <section id="history-section">
            <h2><span><i className="fas fa-history"></i> History</span></h2>
            <ul id="history-list">{/* history items */}</ul>
          </section>
        </>
      )}
    </main>
  )
}

export default ReadingComprehension
