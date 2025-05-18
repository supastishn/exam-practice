// js/memorization.js - Memorization quiz generation and handling

const Memorization = (() => {
    const exerciseForm = document.getElementById('exercise-form');
    const exerciseOutput = document.getElementById('exercise-output');
    const answerForm = document.getElementById('answer-form');
    // const userAnswerInput = document.getElementById('user-answer'); // May not be a single input
    const answerFeedback = document.getElementById('answer-feedback');
    const solutionDisplay = document.getElementById('solution-display');
    const showSolutionButton = document.getElementById('show-solution');
    const copyExerciseButton = document.getElementById('copy-exercise');
    const printExerciseButton = document.getElementById('print-exercise');
    const historyList = document.getElementById('history-list');
    
    const memorizationTextEl = document.getElementById('memorization-text');
    const memorizationImageEl = document.getElementById('memorization-image');

    const CURRENT_CONTEXT = 'memorization';
    const HISTORY_STORAGE_KEY = `${CURRENT_CONTEXT}History`;
    let currentQuizItems = null; // Will store the parsed quiz items

    // Function to construct prompt for OpenAI
    const constructPrompt = (details) => {
        // details will contain:
        // details.materialType: 'text' or 'image'
        // details.materialContent: text string or base64 image string
        // details.quizLanguage, details.quizStyle, details.difficulty, details.questionCount
        // details.mcOptionCount (if applicable)

        let materialSection = "";
        if (details.materialType === 'text') {
            materialSection = `Here is the text to memorize:\n<material_text>\n${details.materialContent}\n</material_text>`;
        } else if (details.materialType === 'image') {
            // For image, the content is already part of the API message structure for multimodal models.
            // The prompt text itself will refer to the image.
            materialSection = "The user has provided an image containing the material to memorize. Please analyze the image content.";
        }

        const quizXMLStructure = `
<memorizationQuiz>
  <instruction>Based on the provided material, answer the following questions. These instructions should be in ${details.quizLanguage || 'English'}.</instruction>
  <quizItems>
    <quizItem id="1">
      <questionType>multiple-choice</questionType>
      <questionText>Sample multiple-choice question text based on the material?</questionText>
      <options>
        <option id="A">Option A</option>
        <option id="B">Option B</option>
        ${details.mcOptionCount ? `<option id="C">Option C</option>\n`.repeat(Math.max(0, details.mcOptionCount -2)) : '<option id="C">Option C</option>'}
      </options>
      <answerKey>B</answerKey>
      <explanation>Brief explanation for the MC answer (optional).</explanation>
    </quizItem>
    <quizItem id="2">
      <questionType>fill-in-the-blank</questionType>
      <questionText>The material mentions __________ as a key point, and it is also __________.</questionText> <!-- Blanks MUST be '__________' (10 underscores) -->
      <answerKey>this specific phrase||or this alternative</answerKey> <!-- For the first blank -->
      <answerKey>important||vital</answerKey> <!-- For the second blank -->
      <explanation>Explanation for fill-in-the-blank (optional).</explanation>
    </quizItem>
    <quizItem id="3">
      <questionType>ai-judger</questionType>
      <questionText>In your own words, what is the main idea of the provided material regarding [specific aspect]?</questionText>
      <!-- For ai-judger, the AI generating the quiz provides the question. User's answer is judged later. -->
      <!-- Optionally, the generating AI can provide its own 'idealAnswerSample' and 'explanationForIdealAnswer' here -->
      <!-- <idealAnswerSample>The main idea is that...</idealAnswerSample> -->
      <!-- <explanationForIdealAnswer>This is supported by...</explanationForIdealAnswer> -->
    </quizItem>
    <!-- Repeat quizItem structure for ${details.questionCount} questions, varying types if "mixed" style chosen -->
  </quizItems>
</memorizationQuiz>`;

        return `You are an expert tutor. The user wants to memorize some material.
${materialSection}

Your task is to generate a quiz to help the user learn and recall this material.
Please create a quiz with the following specifications:
- Quiz Language: ${details.quizLanguage || 'English'}
- Quiz Style/Question Types: ${details.quizStyle}
- Difficulty Level: ${details.difficulty}
- Number of Questions: ${details.questionCount}
${details.quizStyle === 'multiple-choice' && details.mcOptionCount ? `- Number of choices per multiple-choice question: ${details.mcOptionCount}` : ''}

Output the quiz STRICTLY in the following XML format. Do NOT include any other text, explanations, or markdown before or after the XML.
Ensure all XML special characters (e.g., &, <, >, ", ') within text content (like questionText, option text, answerKey, or explanation) are properly escaped (e.g., &amp;, &lt;, &gt;, &quot;, &apos;).

ABSOLUTELY CRITICAL: For any "fill-in-the-blank" questions, the blank in the <questionText> MUST be represented by '__________' (EXACTLY ten underscores). Using fewer or more underscores will break the quiz. This rule is paramount.

Expected XML Structure:
${quizXMLStructure}

Ensure each <quizItem> is relevant to the provided material.
For 'fill-in-the-blank' questions:
  - Use '__________' (EXACTLY ten underscores) in the <questionText> to represent each blank. Do not use fewer or more underscores for blanks.
  - For each '__________' (ten underscores) in the <questionText>, provide a corresponding <answerKey> tag. The order of <answerKey> tags must match the order of blanks.
  - If multiple answers are acceptable for a single blank (e.g., contractions, synonyms), include them in the *same* <answerKey> tag, separated by "||".
For 'ai-judger' questionType: provide a <questionText> that requires a free-form text response from the user based on the material. The user's response will be judged by a subsequent AI call. You do not need to provide <answerKey> or <options> for this type in the quiz generation phase, though you can optionally provide an <idealAnswerSample> and <explanationForIdealAnswer> if you think it's helpful context.
For 'true-false' questions, <questionText> should be a statement, and <answerKey> should be 'True' or 'False'.
The <explanation> tag (or <explanationForIdealAnswer> for ai-judger) within each <quizItem> is optional but helpful.
`;
    };
    
    const displayExercise = (xmlInputString) => {
        if (!exerciseOutput) return;
        exerciseOutput.innerHTML = ''; // Clear previous content

        let currentXmlString = xmlInputString.trim();
        const parser = new DOMParser();
        let xmlDoc = parser.parseFromString(currentXmlString, "text/xml");
        let mainErrorNode = xmlDoc.querySelector("parsererror");

        if (mainErrorNode) {
            console.warn("Initial XML parsing failed. Original error content:", mainErrorNode.textContent);
            const firstTagIndex = currentXmlString.indexOf('<');
            
            if (firstTagIndex > 0) { // If '<' is found, but not at the beginning
                const problematicPrefix = currentXmlString.substring(0, firstTagIndex);
                console.warn(`Attempting to strip problematic prefix (length ${problematicPrefix.length}): "${problematicPrefix.trim()}"`);
                const strippedXmlString = currentXmlString.substring(firstTagIndex);
                
                const strippedXmlDoc = parser.parseFromString(strippedXmlString, "text/xml");
                const strippedErrorNode = strippedXmlDoc.querySelector("parsererror");

                if (!strippedErrorNode) {
                    console.log("Successfully parsed XML after stripping prefix.");
                    currentXmlString = strippedXmlString; // Use the successfully parsed string
                    xmlDoc = strippedXmlDoc;             // Use the successfully parsed document
                    mainErrorNode = null;               // Clear the error node as we succeeded
                } else {
                    console.error("XML parsing still failed after stripping prefix. Error on stripped XML:", strippedErrorNode.textContent);
                    // mainErrorNode remains from the original parse attempt for the final error display
                }
            } else if (firstTagIndex === -1) {
                console.error("XML parsing failed, and no '<' character found in the string. It's not XML.");
                // mainErrorNode already holds the error from parsing the original non-XML string
            }
            // If firstTagIndex is 0, it means it starts with '<' but is still malformed.
            // mainErrorNode from the initial parse is still relevant in this case.
        }

        if (mainErrorNode) { // If, after all attempts, an error remains
            console.error("Final Error parsing XML. Displaying original input. Error details:", mainErrorNode.textContent);
            // Display the original input string that caused the error
            exerciseOutput.innerHTML = `<p class="error">Failed to parse quiz XML.</p><pre>${xmlInputString.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
            UI.hideAnswerSection();
            return;
        }
        
        const quizNode = xmlDoc.querySelector("memorizationQuiz");
        if (!quizNode) {
            exerciseOutput.innerHTML = `<p class="error">Invalid quiz format: Missing &lt;memorizationQuiz&gt; tag.</p><pre>${currentXmlString.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
            UI.hideAnswerSection();
            return;
        }

        const overallInstruction = quizNode.querySelector("instruction")?.textContent;
        if (overallInstruction) {
            const instructionEl = document.createElement('p');
            instructionEl.className = 'exercise-instruction';
            instructionEl.textContent = overallInstruction;
            exerciseOutput.appendChild(instructionEl);
        }
        
        currentQuizItems = []; 
        const itemNodes = quizNode.querySelectorAll("quizItems quizItem");

        if (itemNodes.length === 0) {
            exerciseOutput.innerHTML += `<p class="error">No quiz questions found in the XML.</p>`;
            UI.hideAnswerSection();
            return;
        }

        itemNodes.forEach((itemNode, index) => {
            const questionContainer = document.createElement('div');
            questionContainer.className = 'question-container'; // Re-use style
            questionContainer.dataset.questionIndex = index;

            const questionNumberEl = document.createElement('h4');
            questionNumberEl.className = 'question-number';
            questionNumberEl.textContent = `Question ${index + 1}`;
            questionContainer.appendChild(questionNumberEl);

            const questionText = itemNode.querySelector("questionText")?.textContent;
            const questionType = itemNode.querySelector("questionType")?.textContent.toLowerCase() || 'ai-judger';
            const explanationFromXml = itemNode.querySelector("explanation")?.textContent;
            const idealAnswerSampleFromXml = itemNode.querySelector("idealAnswerSample")?.textContent;
            const explanationForIdealAnswerFromXml = itemNode.querySelector("explanationForIdealAnswer")?.textContent;

            let answerKeysForQuestion = []; // Will be array of arrays for fill-in, or single array for MC/TF

            if (questionType === 'fill-in-the-blank') {
                const answerKeyNodes = Array.from(itemNode.querySelectorAll("answerKey"));
                answerKeyNodes.forEach(akNode => {
                    answerKeysForQuestion.push(akNode.textContent.split('||').map(ak => ak.trim()).filter(ak => ak));
                });
            } else { // MC, True/False, potentially AI Judger if it had an answerKey (though not standard for AI Judger)
                const singleAnswerKeyNode = itemNode.querySelector("answerKey");
                if (singleAnswerKeyNode) {
                    answerKeysForQuestion.push(singleAnswerKeyNode.textContent.trim()); // Stored as [ "CorrectAnswer" ]
                }
            }

            const questionData = {
                id: itemNode.getAttribute("id") || `q-${index}`,
                type: questionType,
                text: questionText,
                answerKey: answerKeysForQuestion, // Now structured like exercises.js for fill-in
                explanation: explanationFromXml,
                idealAnswerSample: idealAnswerSampleFromXml, // Specific to ai-judger, if AI provides it
                explanationForIdealAnswer: explanationForIdealAnswerFromXml, // Specific to ai-judger
                options: [],
                userAnswer: '',
                isCorrect: null,
                judgment: null // For AI Judger responses
            };

            if (questionText) {
                const stimulusContainer = document.createElement('p');
                stimulusContainer.className = 'exercise-stimulus';

                if (questionType === 'fill-in-the-blank') {
                    const parts = questionText.split('__________'); // Split by ten underscores
                    for (let i = 0; i < parts.length; i++) {
                        // Apply markdown parsing to text parts only, not the HTML input tag
                        stimulusContainer.appendChild(document.createRange().createContextualFragment(Utils.customMarkdownParse(parts[i])));
                        if (i < parts.length - 1) {
                            const inputEl = document.createElement('input');
                            inputEl.type = 'text';
                            inputEl.id = `memorization-blank-input_q${index}_b${i}`;
                            inputEl.className = 'inline-blank memorization-blank';
                            inputEl.setAttribute('aria-label', `Blank ${i + 1} for question ${index + 1}`);
                            const wordBefore = Utils.getLastWord(parts[i]);
                            if (wordBefore) {
                                inputEl.dataset.wordBefore = wordBefore.toLowerCase();
                            }
                            stimulusContainer.appendChild(inputEl);
                        }
                    }
                } else {
                    // For other types, parse the whole question text
                    stimulusContainer.innerHTML = Utils.customMarkdownParse(questionText);
                }
                questionContainer.appendChild(stimulusContainer);
            }
            
            const interactiveArea = document.createElement('div');
            interactiveArea.className = 'interactive-answer-area';

            if (questionType === 'multiple-choice' || questionType === 'true-false') {
                const optionsWrapper = document.createElement('div');
                optionsWrapper.className = 'exercise-options memorization-options-inline';
                // For the '\t' to render as a tab, CSS 'white-space: pre-wrap;' or similar might be needed on this wrapper.
                // optionsWrapper.style.whiteSpace = 'pre-wrap'; // Optional: uncomment if explicit CSS is desired here

                let optionSources = [];
                if (questionType === 'multiple-choice') {
                    const optionsNode = itemNode.querySelector("options");
                    if (optionsNode) {
                        optionsNode.querySelectorAll("option").forEach(optNode => {
                            optionSources.push({
                                id: optNode.getAttribute("id"),
                                text: optNode.textContent,
                                value: optNode.getAttribute("id") // Value for radio button
                            });
                        });
                    }
                } else { // true-false
                    optionSources = [
                        { id: 'true', text: 'True', value: 'True' },
                        { id: 'false', text: 'False', value: 'False' }
                    ];
                }

                optionSources.forEach((optSrc, idx) => {
                    questionData.options.push({ id: optSrc.id, text: optSrc.text }); // Store for logic

                    const optionContainerSpan = document.createElement('span'); // Use span for inline behavior
                    optionContainerSpan.className = 'option'; // Keep class if styling applies

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `quiz_option_q${index}`;
                    radio.value = optSrc.value;
                    radio.id = `option_q${index}_${optSrc.id.toLowerCase().replace(/\s+/g, '-')}`; // Make ID more robust

                    const label = document.createElement('label');
                    label.htmlFor = radio.id;
                    label.textContent = optSrc.text;

                    optionContainerSpan.appendChild(radio);
                    optionContainerSpan.appendChild(label);
                    optionsWrapper.appendChild(optionContainerSpan);

                    if (idx < optionSources.length - 1) { // If not the last option
                        optionsWrapper.appendChild(document.createTextNode('\t'));
                    }
                });
                interactiveArea.appendChild(optionsWrapper);
            } else if (questionType === 'fill-in-the-blank') {
                // Blanks are already rendered in qTextEl if '__________' was used for fill-in-the-blank.
            } else if (questionType === 'ai-judger') {
                const textareaEl = document.createElement('textarea');
                textareaEl.id = `ai_judger_input_q${index}`;
                textareaEl.className = 'ai-judger-textarea'; // Re-use style from exercises.css
                textareaEl.rows = 4;
                textareaEl.setAttribute('aria-label', `Response for question ${index + 1}`);
                interactiveArea.appendChild(textareaEl);
            }
            
            questionContainer.appendChild(interactiveArea);
            exerciseOutput.appendChild(questionContainer);
            currentQuizItems.push(questionData);

            if(index < itemNodes.length -1) { 
                const separator = document.createElement('hr');
                separator.className = 'question-separator';
                exerciseOutput.appendChild(separator);
            }
        });
        
        if (currentQuizItems.length > 0) {
            UI.showAnswerSection();
        } else {
            UI.hideAnswerSection();
        }
    };
    
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const generateButton = exerciseForm.querySelector('button[type="submit"]');
        const textToMemorize = memorizationTextEl.value.trim();
        const imageFile = memorizationImageEl.files && memorizationImageEl.files[0] ? memorizationImageEl.files[0] : null;

        if (!textToMemorize && !imageFile) {
            alert('Please provide text or an image to generate a quiz from.');
            return;
        }

        UI.showExerciseDisplay();
        if (exerciseOutput) {
            exerciseOutput.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Generating quiz, please wait...</p>`;
            UI.hideAnswerSection();
        }
        if (generateButton) {
            generateButton.disabled = true;
            generateButton.textContent = 'Generating...';
        }

        const quizLanguage = document.getElementById('target-language').value.trim() || "English";
        const quizStyle = document.getElementById('exercise-type').value;
        const difficulty = document.getElementById('difficulty').value;
        const questionCount = parseInt(document.getElementById('exercise-count').value) || 5;
        const modelInputEl = document.getElementById('model');
        const modelInputValue = modelInputEl.value.trim();
        const { defaultModel: savedDefaultModel } = Auth.getCredentials();
        let model = modelInputValue || savedDefaultModel || "gpt-4.1"; 
        const mcOptionCount = quizStyle === 'multiple-choice' ? parseInt(document.getElementById('mc-options-count').value) : null;

        const promptDetails = {
            materialType: 'text', // Default
            materialContent: textToMemorize, // Will be replaced by base64 if image is used
            quizLanguage,
            quizStyle,
            difficulty,
            questionCount,
            // model will be set below after image processing
            mcOptionCount
        };
        
        let base64Image = null;

        if (imageFile && !textToMemorize) {
            promptDetails.materialType = 'image';
            try {
                base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = e => resolve(e.target.result); // e.g., "data:image/jpeg;base64,..."
                    reader.onerror = e => reject(e);
                    reader.readAsDataURL(imageFile);
                });
                promptDetails.materialContent = base64Image; // Store for history, though it will be large
            } catch (e) {
                alert('Error reading image file.');
                console.error("Error reading image:", e);
                if (generateButton) {
                    generateButton.disabled = false;
                    generateButton.textContent = 'Generate Quiz';
                }
                exerciseOutput.innerHTML = `<p class="error">Error reading image file.</p>`;
                return;
            }
        }

        // Set model for promptDetails (used for history and logging)
        promptDetails.model = model;

        // Log a warning if an image is used with a potentially non-vision model
        if (promptDetails.materialType === 'image') {
            const isLikelyNonVisionModel = !model.includes('vision') && !model.includes('4o') && !model.includes('4-turbo') && model !== "gpt-4-turbo-preview"; // Add other known vision models if needed
            if (isLikelyNonVisionModel) {
                console.warn(`Image provided with model '${model}'. This model might not be vision-capable. For best results with images, consider using a vision-specific model (e.g., gpt-4o, gpt-4-turbo, or a model with 'vision' in its name).`);
                // Optionally, you could update the placeholder here as well, but not changing the model itself.
                // if (modelInputEl) {
                //     modelInputEl.placeholder = `Warning: '${model}' may not support images. Try 'gpt-4o'.`;
                // }
            }
        }

        const textPromptForLlm = constructPrompt(promptDetails); // This prompt describes the task and refers to the material/image.
        let apiInput;

        if (promptDetails.materialType === 'image' && base64Image) {
            apiInput = {
                textPrompt: textPromptForLlm,
                base64Image: base64Image
            };
        } else {
            apiInput = textPromptForLlm; // Send as string for text-only
        }
        
        let quizXml = null;

        try {
            exerciseOutput.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Generating quiz... Receiving data...</p>';
            const streamingPre = document.createElement('pre');
            streamingPre.style.whiteSpace = 'pre-wrap';
            streamingPre.style.border = '1px dashed #ccc';
            streamingPre.style.padding = '10px';
            streamingPre.style.maxHeight = '200px';
            streamingPre.style.overflowY = 'auto';
            streamingPre.textContent = 'Streaming XML data...\n';
            exerciseOutput.appendChild(streamingPre);
            
            const onProgressCallback = (chunk) => {
                streamingPre.textContent += chunk;
                streamingPre.scrollTop = streamingPre.scrollHeight;
            };

            quizXml = await Api.generateExercise(apiInput, model, onProgressCallback);

            if (quizXml) {
                displayExercise(quizXml);
                // Save a version of promptDetails that doesn't include the full base64 image if it's too large for localStorage
                const historyPromptDetails = { ...promptDetails };
                if (historyPromptDetails.materialType === 'image' && historyPromptDetails.materialContent && historyPromptDetails.materialContent.length > 1000) { // Heuristic for large image
                    historyPromptDetails.materialContent = `Image data (length: ${historyPromptDetails.materialContent.length}) - Not stored in history preview.`;
                }
                saveToHistory(historyPromptDetails, quizXml);
            } else {
                exerciseOutput.innerHTML = '<p class="error">Failed to generate quiz. API returned no content.</p>';
            }
        } catch (error) {
            exerciseOutput.innerHTML = `<p class="error">Error generating quiz: ${error.message}</p>`;
            console.error('Quiz generation error:', error);
        } finally {
            if (generateButton) {
                generateButton.disabled = false;
                generateButton.textContent = 'Generate Quiz';
            }
        }
    };

    const checkAnswer = () => {
        // Placeholder: Implement answer checking logic for various quiz item types
        // This will be similar to Exercises.js checkAnswer but adapted for quizItems
        if (!currentQuizItems) return [];
        console.log("Checking answers for quiz items:", currentQuizItems);
        // Iterate through currentQuizItems, get user inputs, compare with answerKey
        // Update item.isCorrect and item.userAnswer
        // Return array of results
        currentQuizItems.forEach((item, index) => {
            const questionContainer = document.querySelector(`.question-container[data-question-index="${index}"]`);
            if (!questionContainer) return;

            if (item.type === 'multiple-choice' || item.type === 'true-false') {
                const selectedOption = questionContainer.querySelector(`input[name="quiz_option_q${index}"]:checked`);
                if (selectedOption) {
                    item.userAnswer = selectedOption.value;
                    // For MC/TF, answerKey is like [ "CorrectOptionID" ] or [ "True" ]
                    item.isCorrect = item.userAnswer.toLowerCase() === (item.answerKey[0] || "").toLowerCase();
                } else {
                    item.userAnswer = '';
                    item.isCorrect = false;
                }
            } else if (item.type === 'fill-in-the-blank') {
                const inputElements = questionContainer.querySelectorAll('input.memorization-blank');
                let userAnswersArray = [];
                let allBlanksFilled = true;
                inputElements.forEach(inputEl => {
                    const val = inputEl.value.trim();
                    userAnswersArray.push(val);
                    if (val === '') allBlanksFilled = false;
                });
                item.userAnswer = userAnswersArray; // Store array for fill-in

                if (userAnswersArray.length === item.answerKey.length) {
                    item.isCorrect = userAnswersArray.every((userAnsTrimmed, i) => {
                        const acceptedKeysForBlank = item.answerKey[i]; // item.answerKey[i] is an array of strings
                        if (!acceptedKeysForBlank || acceptedKeysForBlank.length === 0) return false;
                        
                        let wordBefore = '';
                        if (inputElements[i] && inputElements[i].dataset.wordBefore) {
                            wordBefore = inputElements[i].dataset.wordBefore;
                        }

                        return acceptedKeysForBlank.some(keyAns => {
                            const userEquivalentForms = Utils.getEquivalentForms(userAnsTrimmed);
                            const keyEquivalentForms = Utils.getEquivalentForms(keyAns);
                            if (userEquivalentForms.some(uf => keyEquivalentForms.includes(uf))) return true;
                            // Contraction check (simplified from exercises.js, can be enhanced if needed)
                            if (wordBefore) {
                                const potentialUserContractedFull = wordBefore + userAnsTrimmed.toLowerCase();
                                const contractionPairs = Utils.getContractionPairs();
                                for (const pair of contractionPairs) {
                                    if (pair.contracted === potentialUserContractedFull) {
                                        const expandedRemainder = pair.expanded.toLowerCase().substring(wordBefore.length).trim();
                                        if (Utils.getEquivalentForms(expandedRemainder).includes(keyAns.toLowerCase())) return true;
                                    }
                                }
                            }
                            return false;
                        });
                    });
                } else {
                    item.isCorrect = false; // Mismatch in number of blanks vs answer keys
                }
                if (!allBlanksFilled && userAnswersArray.some(ans => ans !== '')) item.isCorrect = false; // Penalize if some blanks are filled but not all

            } else if (item.type === 'ai-judger') {
                const textarea = questionContainer.querySelector(`#ai_judger_input_q${index}`);
                if (textarea) {
                    item.userAnswer = textarea.value.trim();
                }
                item.isCorrect = null; // AI will determine this
            }
        });
        return currentQuizItems.map((item, idx) => ({
            questionIndex: idx,
            id: item.id, // Pass ID for matching judgment
            taskText: item.text, // Pass the question text as the task for AI judger
            userAnswer: item.userAnswer,
            correctAnswer: item.answerKey, // Original answerKey from XML (for non-AI-judger types)
            isCorrect: item.isCorrect,
            answered: item.userAnswer !== '' || (item.type === 'ai-judger' && item.userAnswer !== ''), // For AI judger, empty is not answered
            type: item.type
        }));
    };

    const showSolution = () => {
        // Placeholder: Implement solution display
        // Similar to Exercises.js showSolution
        if (!currentQuizItems || !solutionDisplay) return;
        
        let solutionHtml = `<h4>Answer Key & Your Answers:</h4>`;
        currentQuizItems.forEach((item, index) => {
            solutionHtml += `<div class="solution-question-block">`;
            solutionHtml += `<p><strong>Question ${index + 1}:</strong> ${Utils.customMarkdownParse(item.text)}</p>`;
            
            if (item.type === 'ai-judger') {
                solutionHtml += `<p><strong>Your Response:</strong><br>${Utils.customMarkdownParse(item.userAnswer) || '<em>Not answered</em>'}</p>`;
                if (item.judgment) {
                    let statusIcon = '';
                    if (item.judgment.status === 'correct') statusIcon = '&#9989;';
                    else if (item.judgment.status === 'incorrect') statusIcon = '&#10060;';
                    else if (item.judgment.status === 'partially-correct') statusIcon = '&#9998;';
                    solutionHtml += `<p><strong>AI Judgment:</strong> <span class="judgment-status-${item.judgment.status}">${item.judgment.status.toUpperCase()}</span> ${statusIcon}</p>`;
                    solutionHtml += `<div class="ai-feedback">${Utils.customMarkdownParse(item.judgment.feedback)}</div>`;
                } else {
                    solutionHtml += `<p><strong>AI Judgment:</strong> <em>Awaiting evaluation or not applicable.</em></p>`;
                }
                if (item.idealAnswerSample) {
                    solutionHtml += `<p><strong>Suggested Answer (from quiz generation):</strong> ${Utils.customMarkdownParse(item.idealAnswerSample)}</p>`;
                }
                if (item.explanationForIdealAnswer) {
                    solutionHtml += `<p><em>Explanation (from quiz generation): ${Utils.customMarkdownParse(item.explanationForIdealAnswer)}</em></p>`;
                }
            } else if (item.type === 'fill-in-the-blank') {
                const parts = item.text.split(/_{2,3}/g);
                let filledStimulusUser = '';
                let filledStimulusCorrect = '';

                // Ensure parts are split by the new 10-underscore blank
                const stimulusPartsForSolution = item.text.split('__________'); 

                stimulusPartsForSolution.forEach((part, i) => {
                    filledStimulusUser += Utils.customMarkdownParse(part);
                    filledStimulusCorrect += Utils.customMarkdownParse(part);
                    if (i < item.answerKey.length) { // answerKey is an array of arrays of strings
                        const userAnswerForBlank = (Array.isArray(item.userAnswer) && item.userAnswer[i]) ? item.userAnswer[i] : '';
                        const correctAnswersForBlank = item.answerKey[i]; // This is an array of correct strings for this blank
                        
                        // Check if this specific blank was answered correctly
                        const isThisBlankCorrect = correctAnswersForBlank.some(ca => 
                            Utils.getEquivalentForms(userAnswerForBlank).includes(ca.toLowerCase()) || // Basic check
                            Utils.getEquivalentForms(ca).includes(userAnswerForBlank.toLowerCase()) // Check other way too
                        );
                        
                        filledStimulusUser += `<strong>${userAnswerForBlank || '(empty)'}</strong>${isThisBlankCorrect ? '&#9989;' : (userAnswerForBlank ? '&#10060;' : '')}`;
                        filledStimulusCorrect += `<em>${correctAnswersForBlank.join(' / ')}</em>`;
                    }
                });
                solutionHtml += `<p>Your Answer: ${filledStimulusUser}</p>`;
                solutionHtml += `<p>Correct Answer(s): ${filledStimulusCorrect}</p>`;
                 if (item.explanation) { // Overall explanation for the fill-in item
                    solutionHtml += `<p><em>Explanation: ${Utils.customMarkdownParse(item.explanation)}</em></p>`;
                }
            } else { // MC, True/False
                // For MC/TF, answerKey is like ["CorrectOptionID"] or ["True"]
                solutionHtml += `<p>Correct Answer: <strong>${item.answerKey[0]}</strong></p>`;
                solutionHtml += `<p>Your Answer: <strong>${item.userAnswer || '<em>Not answered</em>'}</strong> ${item.isCorrect ? '&#9989;' : (item.userAnswer ? '&#10060;' : '')}</p>`;
                if (item.explanation) {
                    solutionHtml += `<p><em>Explanation: ${Utils.customMarkdownParse(item.explanation)}</em></p>`;
                }
            }
            solutionHtml += `</div>`;
        });
        
        solutionDisplay.innerHTML = solutionHtml;
        solutionDisplay.style.display = 'block';
    };
    
    const handleAnswerSubmit = async (event) => {
        event.preventDefault();
        if (!answerFeedback) return;

        const results = checkAnswer();
        if (results.length === 0) {
            answerFeedback.textContent = 'No quiz loaded or no answers to check.';
            answerFeedback.className = 'feedback-message feedback-incorrect';
            answerFeedback.style.display = 'block';
            return;
        }
        
        const isAiJudgerQuiz = results.some(r => r.type === 'ai-judger');
        let tasksToJudge = []; // Declare tasksToJudge here to widen its scope

        if (isAiJudgerQuiz) {
            answerFeedback.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Receiving AI judgment for some questions...</p>';
            const streamingJudgmentPre = document.createElement('pre');
            streamingJudgmentPre.id = `streaming-judgment-pre-memorization`; // Unique ID
            streamingJudgmentPre.style.whiteSpace = 'pre-wrap';
            // ... (styles similar to exercises.js)
            streamingJudgmentPre.textContent = 'Streaming judgment XML data...\n';
            answerFeedback.appendChild(streamingJudgmentPre);
            answerFeedback.className = 'feedback-message';
            answerFeedback.style.display = 'block';
            if (solutionDisplay) solutionDisplay.style.display = 'none';

            const modelInputEl = document.getElementById('model');
            const modelInputValue = modelInputEl ? modelInputEl.value.trim() : '';
            const { defaultModel: savedDefaultModel } = Auth.getCredentials();
            const modelForJudging = modelInputValue || savedDefaultModel || "gpt-4.1";

            const onJudgmentProgressCallback = (chunk) => {
                streamingJudgmentPre.textContent += chunk;
                // scroll
            };
            
            tasksToJudge = results.filter(r => r.type === 'ai-judger' && r.answered)
                .map(r => ({ id: r.id, taskText: r.taskText, userAnswer: r.userAnswer }));

            if (tasksToJudge.length > 0) {
                const judgmentXmlString = await Api.judgeUserResponses(tasksToJudge, modelForJudging, onJudgmentProgressCallback, 'memorization_quiz');
                
                if (answerFeedback.contains(streamingJudgmentPre)) {
                    answerFeedback.removeChild(streamingJudgmentPre);
                }
                answerFeedback.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Processing AI judgment...</p>';


                if (judgmentXmlString) {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(judgmentXmlString, "text/xml");
                    const errorNode = xmlDoc.querySelector("parsererror");

                    if (errorNode) {
                        console.error("Error parsing AI judgment XML:", errorNode.textContent);
                        answerFeedback.querySelector('p').textContent = 'Error processing AI judgment. Invalid XML.';
                        answerFeedback.className = 'feedback-message feedback-incorrect';
                    } else {
                        const judgmentNodes = xmlDoc.querySelectorAll("judgments > judgment");
                        judgmentNodes.forEach(jNode => {
                            const taskId = jNode.getAttribute("taskId");
                            const status = jNode.querySelector("status")?.textContent.toLowerCase();
                            const feedbackText = jNode.querySelector("feedback")?.textContent;

                            const itemToUpdate = currentQuizItems.find(item => item.id === taskId && item.type === 'ai-judger');
                            if (itemToUpdate) {
                                itemToUpdate.judgment = { status, feedback: feedbackText };
                                itemToUpdate.isCorrect = (status === 'correct' || status === 'partially-correct');
                            }
                        });
                    }
                } else {
                    answerFeedback.querySelector('p').textContent = 'Failed to get AI judgment.';
                    answerFeedback.className = 'feedback-message feedback-incorrect';
                }
            } else {
                 if (answerFeedback.contains(streamingJudgmentPre)) {
                    answerFeedback.removeChild(streamingJudgmentPre);
                }
                answerFeedback.innerHTML = ''; // Clear loading if no AI tasks were answered
            }
        }

        // Recalculate overall score after AI judgment (if any)
        const finalCorrectCount = currentQuizItems.filter(item => item.isCorrect).length;
        const totalQuestions = currentQuizItems.length;
        
        let feedbackSummaryText = `You got ${finalCorrectCount} out of ${totalQuestions} correct!`;
        if (isAiJudgerQuiz && tasksToJudge.length > 0) {
            feedbackSummaryText = `Overall score (including AI-judged questions): ${finalCorrectCount} out of ${totalQuestions} correct!`;
        }
        
        // Ensure feedback message area is clean before adding new summary
        const existingFeedbackP = answerFeedback.querySelector('p');
        if (existingFeedbackP) {
            existingFeedbackP.textContent = feedbackSummaryText;
        } else {
            answerFeedback.innerHTML = `<p>${feedbackSummaryText}</p>`;
        }
        answerFeedback.className = `feedback-message feedback-${finalCorrectCount === totalQuestions ? 'correct' : 'incorrect'}`;
        answerFeedback.style.display = 'block';
        showSolution();
    };

    // History functions (can be similar to Exercises.js, just different key and details)
    const saveToHistory = (promptDetails, quizXml) => {
        const history = loadHistory();
        // Remove base64 image data before saving to history if it's too large
        let storablePromptDetails = {...promptDetails};
        if (storablePromptDetails.materialType === 'image' && storablePromptDetails.materialContent) {
            storablePromptDetails.materialContent = `Image data (length: ${storablePromptDetails.materialContent.length}) - Not stored in history preview.`;
        }

        const newEntry = {
            id: new Date().getTime(),
            date: new Date().toISOString(),
            promptDetails: storablePromptDetails, // Contains material type, language, style, etc.
            quizXml: quizXml
        };
        history.unshift(newEntry);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 50))); // Limit history size
        renderHistory();
    };

    const loadHistory = () => {
        const storedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
        return storedHistory ? JSON.parse(storedHistory) : [];
    };

    const renderHistory = () => {
        if (!historyList) return;
        const history = loadHistory();
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<li>No quizzes in history yet.</li>';
            return;
        }

        history.forEach(item => {
            const li = document.createElement('li');
            // Simplified history display
            const materialDesc = item.promptDetails.materialType === 'text' 
                ? (item.promptDetails.materialContent ? `Text: "${item.promptDetails.materialContent.substring(0,30)}..."` : "Text provided")
                : "Image provided";
            
            li.innerHTML = `
                <div class="history-details">
                    <span class="history-prompt">Quiz from: ${materialDesc} (${item.promptDetails.quizStyle}, ${item.promptDetails.questionCount} questions)</span>
                    <span class="history-meta">Generated on: ${Utils.formatDate(item.date)}</span>
                </div>
                <div class="history-buttons">
                    <button class="view-history-btn"><i class="fas fa-eye"></i> View</button>
                    <button class="delete-history-btn"><i class="fas fa-trash"></i> Delete</button>
                </div>`;
            
            li.querySelector('.view-history-btn').addEventListener('click', () => {
                displayExercise(item.quizXml);
                UI.showExerciseDisplay();
                if(exerciseOutput) exerciseOutput.scrollIntoView({ behavior: 'smooth' });
            });
            li.querySelector('.delete-history-btn').addEventListener('click', () => deleteFromHistory(item.id));
            historyList.appendChild(li);
        });
    };
    
    const deleteFromHistory = (itemId) => {
        if (confirm("Are you sure you want to delete this quiz from history?")) {
            let history = loadHistory();
            history = history.filter(item => item.id !== itemId);
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
            renderHistory();
        }
    };

    const init = () => {
        if (exerciseForm) {
            exerciseForm.addEventListener('submit', handleFormSubmit);
        }
        if (answerForm) {
            answerForm.addEventListener('submit', handleAnswerSubmit);
        }
        if (showSolutionButton) {
            showSolutionButton.addEventListener('click', showSolution);
        }
        if (copyExerciseButton && exerciseOutput) {
            copyExerciseButton.addEventListener('click', () => Utils.copyToClipboard(exerciseOutput.innerText, 'Quiz copied to clipboard!'));
        }
        if (printExerciseButton && exerciseOutput) {
            printExerciseButton.addEventListener('click', () => Utils.printElement(exerciseOutput));
        }

        // Show/hide MC options count based on exercise type
        const exerciseTypeSelect = document.getElementById('exercise-type');
        const mcOptionsGroup = document.getElementById('mc-options-count-group');
        if (exerciseTypeSelect && mcOptionsGroup) {
            const toggleMcOptionsVisibility = () => {
                mcOptionsGroup.style.display = exerciseTypeSelect.value === 'multiple-choice' ? 'block' : 'none';
            };
            exerciseTypeSelect.addEventListener('change', toggleMcOptionsVisibility);
            toggleMcOptionsVisibility(); // Initial check
        }
        renderHistory();
    };
    
    return {
        init,
        displayExercise, // Expose for history view if needed elsewhere
        // No need to expose checkAnswer or showSolution if only used internally by submit
    };
})();
