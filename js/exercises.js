// js/exercises.js - Exercise generation and handling

const Exercises = (() => {
    let exerciseForm, exerciseOutput, answerForm, userAnswerInput, 
        answerFeedback, solutionDisplay, showSolutionButton, 
        copyExerciseButton, printExerciseButton, historyList, 
        imageFileInput, fileNameDisplay;

    // Camera Modal Elements
    let cameraModal, cameraVideoFeed, cameraCanvas, useCameraButton, 
        captureCameraImageButton, closeCameraModalButton;

    let currentCameraStream = null;
    let capturedImageDataURLs = []; // To store base64 data from camera (multiple)

    const getCurrentSubject = () => {
        const pathname = window.location.pathname;
        if (pathname.includes('english.html')) {
            return 'english';
        } else if (pathname.includes('math.html')) {
            return 'math';
        }
        // Fallback for other pages or if no specific subject page is identified
        // This might occur if Exercises.js is loaded on a page without a subject context
        // For safety, default to 'english' or a generic key if needed.
        console.warn("Exercises.js: Could not determine subject from pathname:", pathname, ". Defaulting to 'english'.");
        return 'english'; 
    };
    
    const CURRENT_SUBJECT = getCurrentSubject();
    const HISTORY_STORAGE_KEY = `${CURRENT_SUBJECT}ExerciseHistory`;
    let currentExerciseAnswers = null; // Will store the parsed answers for current exercise

    // Function to construct prompt for OpenAI
    const constructPrompt = (details) => {
        // details includes: prompt (text instruction), exerciseType, difficulty, targetLanguage, model,
        // exerciseCount, mcOptionCount, batchIndex, batchTotal,
        // materialType ('text' or 'image'), materialContent (text or base64 image string - though image content is handled by API structure)

        let batchInfo = '';
        if (details.batchTotal > 1) {
            batchInfo = `
Note: This is exercise ${details.batchIndex + 1} of ${details.batchTotal}. Create a unique XML exercise.`;
        }

        let materialContextInstruction = "";
        if (details.materialType === 'image') {
            materialContextInstruction = `The user has provided an image. Generate questions based on the content and/or format of this image. The user's text prompt (topic/instructions) below will guide what kind of questions to create about the image.`;
        } else {
            // For text-only, the prompt itself is the primary source of content/topic
            materialContextInstruction = `Generate questions based on the user's text prompt (topic/instructions) below.`;
        }


        // Base XML structure for a single question
        const singleQuestionMC = `
  <questionBlock>
    <stimulus>Which word means 'very happy'?</stimulus>
    <options>
      <option id="A">Sad</option>
      <option id="B">Joyful</option>
      <option id="C">Angry</option>
      <!-- If specified, generate ${details.mcOptionCount || 'the default number of'} options -->
    </options>
    <answerKey>B</answerKey>
  </questionBlock>`;

        const singleQuestionFill = `
  <questionBlock>
    <stimulus>She __________ to the market every day.</stimulus> <!-- Blanks MUST be '__________' (10 underscores) -->
    <answerKey>goes||went</answerKey> <!-- Multiple acceptable answers separated by || -->
  </questionBlock>`;

        const singleAIJudgerTask = `
  <task id="1">Describe your favorite holiday destination.</task>`;
        // mathAIJudgerWithScript is removed as Math AI Judger will now use API for judgment.
        // The AI will just provide a <task> like the English AI Judger.

        const singleMathProblemWithCode = `
  <questionBlock>
    <stimulus>What is 9 + 10?</stimulus>
    <scriptCode>return 9 + 10;</scriptCode>
    <!-- Optional: AI can still provide an answerKey for direct display or fallback -->
    <answerKey>19</answerKey> 
  </questionBlock>`;

        const mathMultipleChoiceWithCode = `
  <questionBlock>
    <type>multiple-choice</type>
    <stimulus>What is 7 multiplied by 6?</stimulus>
    <options>
      <option id="A">35</option>
      <option id="B">42</option>
      <option id="C">48</option>
      <option id="D">52</option>
    </options>
    <scriptCode>
      // Calculate 7 * 6
      let result = 7 * 6;
      return String(result); // Must return the string content of the correct option
    </scriptCode>
    <!-- No static answerKey here; it's derived from scriptCode -->
  </questionBlock>`;

        const complexMathProblemWithCode = `
  <questionBlock>
    <stimulus>Solve for x: 2x + 5 = 15</stimulus>
    <scriptCode>
      // Solve for x: 2x + 5 = 15
      // 2x = 15 - 5
      // 2x = 10
      // x = 10 / 2
      return 5;
    </scriptCode>
    <answerKey>5</answerKey>
  </questionBlock>`;
        
        const singleQuestionMultiFill = `
  <questionBlock>
    <type>fill-in-the-blank</type> <!-- Optional: type can be per questionBlock -->
    <instruction>Fill in the blanks with the correct words.</instruction>
    <stimulus>A __________ is a domestic animal, and it says "__________".</stimulus> <!-- Blanks MUST be '__________' (10 underscores) -->
    <answerKey>cat||feline</answerKey> <!-- Corresponds to the first __________, multiple options -->
    <answerKey>meow||purr</answerKey> <!-- Corresponds to the second __________, multiple options -->
  </questionBlock>`;

        let questionBlockStructure;
        if (details.exerciseType === 'fill-in-the-blank') {
            // For fill-in-the-blank, provide both single and multi-blank examples to guide the AI.
            // The actual number of blanks will depend on the AI's interpretation of the prompt and Number of Questions.
            // We instruct it to use multiple <answerKey> tags if it generates multiple blanks.
            questionBlockStructure = `<!-- Example for a single blank -->${singleQuestionFill}\n<!-- Example for multiple blanks in one stimulus -->${singleQuestionMultiFill}`;
        } else if (details.exerciseType === 'ai-judger') { // AI Judger for both English and Math will use the same simple task structure
            questionBlockStructure = singleAIJudgerTask; 
        } else if (CURRENT_SUBJECT === 'math' && details.exerciseType === 'fill-in-the-blank') { // Math problem with code (fill-in)
            questionBlockStructure = `<!-- Example for simple arithmetic -->${singleMathProblemWithCode}\n<!-- Example for solving an equation -->${complexMathProblemWithCode}`;
        } else if (CURRENT_SUBJECT === 'math' && details.exerciseType === 'multiple-choice') { // Math MC with code
            questionBlockStructure = mathMultipleChoiceWithCode;
        }
         else { // English multiple-choice, or other non-math MC scenarios
            questionBlockStructure = singleQuestionMC;
        }
        
        // Determine if we need a <questions> or <tasks> wrapper
        let exerciseContentStructure;
        if (details.exerciseType === 'ai-judger') {
            exerciseContentStructure = `
  <tasks>
    ${questionBlockStructure.repeat(details.exerciseCount)} <!-- AI should generate unique tasks -->
  </tasks>`;
        } else if (details.exerciseCount > 1) {
            exerciseContentStructure = `
  <questions>
    ${questionBlockStructure.repeat(details.exerciseCount)} <!-- AI should generate unique question blocks -->
  </questions>`;
        } else { // Single question for MC or Fill-in
            exerciseContentStructure = questionBlockStructure;
        }
        
        const subjectNameCap = CURRENT_SUBJECT.charAt(0).toUpperCase() + CURRENT_SUBJECT.slice(1);

        const overallXMLStructure = `
<${CURRENT_SUBJECT}Exercise>
  <type>${details.exerciseType}</type>
  <instruction>General instructions for the exercise. Adjust based on the type and number of questions/tasks. These instructions should be in ${details.targetLanguage || 'English'}.</instruction>
${exerciseContentStructure}
</${CURRENT_SUBJECT}Exercise>`;
        
        const languageInstruction = (details.targetLanguage && details.targetLanguage.toLowerCase() !== 'english') 
            ? `Create a ${subjectNameCap} exercise in ${details.targetLanguage}. All content, including instructions within the XML, should be in ${details.targetLanguage}.`
            : `Create a ${subjectNameCap} exercise in English.`;

        return `${languageInstruction}
${materialContextInstruction}

Specifications:
- Subject: ${subjectNameCap}
- Language for questions/instructions: ${details.targetLanguage || 'English'}
- Exercise Type: ${details.exerciseType}
- Difficulty: ${details.difficulty}
- User's Text Prompt (Topic/Instructions): "${details.prompt}"
- Number of questions to include: ${details.exerciseCount} (This refers to the number of <questionBlock> or <task> elements)
${details.exerciseType === 'multiple-choice' && details.mcOptionCount ? `- Number of choices per multiple-choice question: ${details.mcOptionCount}` : ''}

Output the exercise STRICTLY in the following XML format. Do NOT include any other text, explanations, or markdown before or after the XML.
Ensure all XML special characters (e.g., &, <, >, ", ') within text content (like stimulus, options, or answerKey text) are properly escaped (e.g., &amp;, &lt;, &gt;, &quot;, &apos;).

ABSOLUTELY CRITICAL: For any "fill-in-the-blank" questions, the blank in the <stimulus> text MUST be represented by '__________' (EXACTLY ten underscores). Using fewer or more underscores will break the exercise. This rule is paramount.

Expected XML Structure:
${overallXMLStructure}

If "Number of questions to include" is greater than 1, wrap all <questionBlock> elements inside a single <questions> parent tag.
Each <questionBlock> should be complete and relevant to the topic and difficulty.
For "fill-in-the-blank" type questions that involve blanks:
  - Use '__________' (EXACTLY ten underscores) in the <stimulus> text to represent each blank. Do not use fewer or more underscores.
  - For each '__________' (ten underscores) in the stimulus, provide a corresponding <answerKey> tag. The order of <answerKey> tags must match the order of blanks.
  - If multiple answers are acceptable for a single blank (e.g., contractions, synonyms, or alternative phrasing), include them in the *same* <answerKey> tag, separated by "||".
  - Example for one blank with multiple answers (contraction): <stimulus>She __________ happy.</stimulus><answerKey>is not||isn't</answerKey>
  - Example for one blank with multiple answers (alternative phrasing): <stimulus>I study hard __________ pass the exam.</stimulus><answerKey>to||in order to</answerKey>
  - Example for one blank with multiple answers (similar meaning): <stimulus>She was tired, __________ she went to bed.</stimulus><answerKey>so||so that</answerKey>
  - Example for multiple blanks, each with potentially multiple answers: <stimulus>A __________ is __________.</stimulus><answerKey>cat||feline</answerKey><answerKey>small||tiny</answerKey>
For "ai-judger" type (English):
  - Generate a series of <task id="unique_id">Task description or question for the user to write about.</task> elements within a <tasks> parent tag.
  - The 'Number of questions to include' corresponds to the number of <task> elements. Each task should solicit a sentence or short text response.
  - Example for English: <tasks><task id="1">Describe your morning routine.</task></tasks>
  - Example for Math: <tasks><task id="1">Explain the Pythagorean theorem in your own words.</task></tasks>
  - For Math AI Judger, the AI should NOT provide a <judgingScript>. Judgment will be handled by API call.
For "math" subject, "fill-in-the-blank" type (problem solving):
  - Each <questionBlock> should contain:
    - A <stimulus> tag with the math problem statement (e.g., "What is 5 * 7?", "Solve for x: 3x - 4 = 11").
    - A <scriptCode> tag containing JavaScript code that, when executed, returns the numerical answer.
      - Example 1 (Arithmetic): <stimulus>What is 12 / 4?</stimulus><scriptCode>return 12 / 4;</scriptCode>
      - Example 2 (Algebra): <stimulus>If 2y + 3 = 9, what is y?</stimulus><scriptCode>// 2y = 9 - 3; 2y = 6; y = 3; return 3;</scriptCode>
      - Example 3 (Word Problem): <stimulus>John has 5 apples and buys 3 more. How many apples does he have?</stimulus><scriptCode>let initialApples = 5; let boughtApples = 3; return initialApples + boughtApples;</scriptCode>
    - Optionally, an <answerKey> tag with the plain numerical answer for display or fallback. The <scriptCode> result is primary.
  - The user will input their numerical answer into a single blank.
For "math" subject, "multiple-choice" type:
  - Each <questionBlock> should contain:
    - A <stimulus> tag with the math problem statement.
    - An <options> tag containing multiple <option id="X">text_value</option> tags.
    - A <scriptCode> tag containing JavaScript. This script MUST calculate the correct answer and then RETURN THE STRING VALUE of the text_value of the correct <option>.
      - Example: <stimulus>What is 5 + 3?</stimulus><options><option id="A">7</option><option id="B">8</option></options><scriptCode>return "8";</scriptCode>
  - DO NOT provide a static <answerKey> tag for math multiple-choice. The correct option ID will be determined by matching the scriptCode's return value with the option texts.

The main <type> tag in <${CURRENT_SUBJECT}Exercise> should reflect the overall exercise type. Individual <questionBlock> elements can optionally have their own <type> tag if the exercise mixes types (though this is advanced, for now, assume all questionBlocks are of the main type unless specified in the questionBlock).
The <answerKey> for English multiple-choice should correspond to the 'id' of the correct <option>.
${batchInfo}`;
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
            exerciseOutput.innerHTML = `<p class="error">Failed to parse exercise XML. Ensure AI provides valid XML.</p><pre>${xmlInputString.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
            UI.hideAnswerSection();
            return;
        }
        
        // Use CURRENT_SUBJECT to find the root node
        const exerciseNode = xmlDoc.querySelector(`${CURRENT_SUBJECT}Exercise`);
        if (!exerciseNode) {
            exerciseOutput.innerHTML = `<p class="error">Invalid exercise format: Missing &lt;${CURRENT_SUBJECT}Exercise&gt; tag.</p><pre>${currentXmlString.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
            UI.hideAnswerSection();
            return;
        }

        const overallType = exerciseNode.querySelector("type")?.textContent.toLowerCase() || 'unknown';
        const overallInstruction = exerciseNode.querySelector("instruction")?.textContent;

        if (overallInstruction) {
            const instructionEl = document.createElement('p');
            instructionEl.className = 'exercise-instruction';
            instructionEl.textContent = overallInstruction;
            exerciseOutput.appendChild(instructionEl);
        }
        
        currentExerciseAnswers = []; // Reset to an array for multiple questions/tasks

        if (overallType === 'ai-judger') {
            const tasksNode = exerciseNode.querySelector("tasks");
            if (!tasksNode) {
                exerciseOutput.innerHTML += `<p class="error">Invalid AI Judger format: Missing &lt;tasks&gt; tag.</p>`;
                UI.hideAnswerSection();
                return;
            }
            const taskElements = Array.from(tasksNode.querySelectorAll("task"));
            if (taskElements.length === 0) {
                exerciseOutput.innerHTML += `<p class="error">Invalid AI Judger format: No &lt;task&gt; elements found within &lt;tasks&gt;.</p>`;
                UI.hideAnswerSection();
                return;
            }

            taskElements.forEach((taskNode, index) => {
                const taskId = taskNode.getAttribute("id") || `task-${index + 1}`;
                let taskText;

                // For AI Judger (both Math and English), the task is just text content.
                // If Math AI Judger tasks were previously wrapped in <text>, we simplify.
                // For now, assume <task> directly contains the text for both.
                taskText = taskNode.textContent; 
                if (CURRENT_SUBJECT === 'math' && taskNode.querySelector("text")) {
                    // If AI still provides <text> for math, use it.
                    taskText = taskNode.querySelector("text").textContent;
                }
                
                if (!taskText) {
                     console.error(`AI Judger task ${index + 1} is missing text content. XML:`, taskNode.outerHTML);
                     taskText = "Error: Invalid task structure from AI - missing text.";
                }

                const taskContainer = document.createElement('div');
                taskContainer.className = 'question-container ai-judger-task'; // Use question-container for consistent styling
                taskContainer.dataset.taskIndex = index; // Or use taskId if always present and unique

                const taskNumberEl = document.createElement('h4');
                taskNumberEl.className = 'question-number'; // Consistent styling
                taskNumberEl.textContent = `Task ${index + 1}`;
                taskContainer.appendChild(taskNumberEl);

                const taskDescriptionEl = document.createElement('p');
                taskDescriptionEl.className = 'exercise-stimulus'; // Consistent styling for the task prompt
                taskDescriptionEl.textContent = taskText;
                taskContainer.appendChild(taskDescriptionEl);

                const textareaEl = document.createElement('textarea');
                textareaEl.id = `ai-judger-input_q${index}`; // Keep q${index} for consistency with other types if needed
                textareaEl.className = 'ai-judger-textarea';
                textareaEl.rows = 4;
                textareaEl.setAttribute('aria-label', `Response for task ${index + 1}`);
                taskContainer.appendChild(textareaEl);
                
                exerciseOutput.appendChild(taskContainer);
                if(index < taskElements.length -1) { 
                    const separator = document.createElement('hr');
                    separator.className = 'question-separator';
                    exerciseOutput.appendChild(separator);
                }

                currentExerciseAnswers.push({
                    id: taskId,
                    type: 'ai-judger',
                    taskText: taskText,
                    // judgingScript: null, // No longer storing judgingScript
                    userAnswer: '', 
                    judgment: null, 
                    isCorrect: null 
                });
            });
            UI.showAnswerSection(); // Show "Check Answer" button for AI Judger
            // Clear feedback areas
            if (answerFeedback) { answerFeedback.style.display = 'none'; answerFeedback.innerHTML = ''; }
            if (solutionDisplay) { solutionDisplay.style.display = 'none'; solutionDisplay.innerHTML = ''; }

        } else { // Handle existing types (multiple-choice, fill-in-the-blank)
            const questionsNode = exerciseNode.querySelector("questions");
            let questionBlocks = [];

            if (questionsNode) {
                questionBlocks = Array.from(questionsNode.querySelectorAll("questionBlock"));
            } else {
                const singleQB = exerciseNode.querySelector("questionBlock");
                if (singleQB) questionBlocks.push(singleQB);
            }

            if (questionBlocks.length === 0) {
                exerciseOutput.innerHTML += `<p class="error">Invalid exercise format: Missing &lt;questionBlock&gt; or &lt;questions&gt; tag not containing &lt;questionBlock&gt;s.</p>`;
                UI.hideAnswerSection();
                return;
            }

            let hasAnyAnswerKey = false;

            questionBlocks.forEach((questionBlock, index) => {
                let executionError = null; // Declare executionError here
                const questionContainer = document.createElement('div');
                questionContainer.className = 'question-container';
                questionContainer.dataset.questionIndex = index;

                const questionNumberEl = document.createElement('h4');
                questionNumberEl.className = 'question-number';
                questionNumberEl.textContent = `Question ${index + 1}`;
                questionContainer.appendChild(questionNumberEl);

                const questionInstruction = questionBlock.querySelector("instruction")?.textContent;
                const stimulusText = questionBlock.querySelector("stimulus")?.textContent;
                const questionSpecificTypeNode = questionBlock.querySelector("type");
                const questionType = questionSpecificTypeNode ? questionSpecificTypeNode.textContent.toLowerCase() : overallType;
                
                let answerKeys = []; // For English fill-in: array of arrays of strings. For MC: array containing one array of one string. For Math fill-in: array of one string (the computed answer).
                
                if (CURRENT_SUBJECT === 'math' && questionType === 'fill-in-the-blank') {
                    const scriptCodeNode = questionBlock.querySelector("scriptCode");
                    const staticAnswerKeyNode = questionBlock.querySelector("answerKey"); // Fallback or for display
                    let computedAnswer = null;
                    let executionError = null;

                    if (scriptCodeNode && scriptCodeNode.textContent) {
                        try {
                            const scriptFunction = new Function(scriptCodeNode.textContent);
                            computedAnswer = scriptFunction();
                            // Ensure the answer is stored as a string for consistent comparison later
                            answerKeys.push([String(computedAnswer)]);
                            hasAnyAnswerKey = true;
                        } catch (e) {
                            console.error(`Error executing scriptCode for question ${index + 1}:`, e, "\nCode:", scriptCodeNode.textContent);
                            executionError = e.message;
                            // Fallback to static answerKey if script execution fails
                            if (staticAnswerKeyNode && staticAnswerKeyNode.textContent) {
                                answerKeys.push([staticAnswerKeyNode.textContent.trim()]);
                                hasAnyAnswerKey = true;
                                console.warn(`Fell back to static answerKey for question ${index + 1} due to script error.`);
                            } else {
                                answerKeys.push(['ERROR_IN_SCRIPT']); // Placeholder if no static key
                            }
                        }
                    } else if (staticAnswerKeyNode && staticAnswerKeyNode.textContent) {
                        // No scriptCode, but static answerKey exists
                        answerKeys.push([staticAnswerKeyNode.textContent.trim()]);
                        hasAnyAnswerKey = true;
                        console.warn(`Used static answerKey for math question ${index + 1} as no scriptCode was provided.`);
                    } else {
                        answerKeys.push(['NO_ANSWER_DEFINED']);
                        console.error(`No scriptCode or static answerKey for math fill-in question ${index + 1}.`);
                    }
                } else if (CURRENT_SUBJECT === 'math' && questionType === 'multiple-choice') {
                    const scriptCodeNode = questionBlock.querySelector("scriptCode");
                    const optionsNodes = Array.from(questionBlock.querySelectorAll("options option"));
                    let computedAnswerText = null;

                    if (scriptCodeNode && scriptCodeNode.textContent && optionsNodes.length > 0) {
                        try {
                            const scriptFunction = new Function(scriptCodeNode.textContent);
                            computedAnswerText = String(scriptFunction()).trim(); // Result of script is the correct option's text
                            
                            const correctOptionNode = optionsNodes.find(optNode => optNode.textContent.trim() === computedAnswerText);

                            if (correctOptionNode) {
                                answerKeys.push([correctOptionNode.getAttribute("id")]);
                                hasAnyAnswerKey = true;
                            } else {
                                console.error(`Math MC Q${index + 1}: Script returned "${computedAnswerText}", but no option matched this text.`);
                                answerKeys.push(['OPTION_MISMATCH']);
                                executionError = `Script result "${computedAnswerText}" did not match any option text.`;
                            }
                        } catch (e) {
                            console.error(`Error executing scriptCode for Math MC Q${index + 1}:`, e, "\nCode:", scriptCodeNode.textContent);
                            executionError = e.message;
                            answerKeys.push(['ERROR_IN_SCRIPT']);
                        }
                    } else {
                        if (!scriptCodeNode || !scriptCodeNode.textContent) console.error(`Math MC Q${index + 1}: Missing scriptCode.`);
                        if (optionsNodes.length === 0) console.error(`Math MC Q${index + 1}: Missing options.`);
                        answerKeys.push(['NO_ANSWER_LOGIC']);
                    }
                } else if (questionType === 'fill-in-the-blank') { // English fill-in-the-blank
                    const parts = stimulusText.split('___');
                    const answerKeyNodesFromXml = Array.from(questionBlock.querySelectorAll("answerKey"));
                    for (let markerIdx = 0; markerIdx < parts.length - 1; markerIdx++) {
                        const shouldIncludeThisKey = (markerIdx === 0) || (parts[markerIdx].trim() !== "");
                        if (shouldIncludeThisKey) {
                            if (answerKeyNodesFromXml[markerIdx]) {
                                const keyText = answerKeyNodesFromXml[markerIdx].textContent;
                                answerKeys.push(keyText.split('||').map(ak => ak.trim()).filter(ak => ak));
                            } else {
                                answerKeys.push([]);
                            }
                        }
                    }
                    if (answerKeys.length > 0 && answerKeys.some(akList => akList.length > 0)) hasAnyAnswerKey = true;
                } else { // For MCQs (English or Math)
                    const singleAnswerKeyNode = questionBlock.querySelector("answerKey");
                    if (singleAnswerKeyNode) {
                        answerKeys.push([singleAnswerKeyNode.textContent.trim()]);
                        hasAnyAnswerKey = true;
                    }
                }
                // Ensure hasAnyAnswerKey is true if answerKeys actually got populated,
                // especially for script-based ones where it's set inside try/catch.
                if (!hasAnyAnswerKey && answerKeys.length > 0 && answerKeys[0] && answerKeys[0][0] && 
                    !['ERROR_IN_SCRIPT', 'NO_ANSWER_DEFINED', 'OPTION_MISMATCH', 'NO_ANSWER_LOGIC'].includes(answerKeys[0][0])) {
                    hasAnyAnswerKey = true;
                }


            const questionData = { 
                type: questionType, 
                stimulus: stimulusText, 
                answerKey: answerKeys, 
                options: [], // For MC
                userAnswer: (questionType === 'fill-in-the-blank' && CURRENT_SUBJECT === 'math') ? '' : [], // String for single math blank, array for English multi-blank
                isCorrect: null,
                scriptExecutionError: executionError || null // Store script execution error if any
            };

            if (questionInstruction) {
                const qInstructionEl = document.createElement('p');
                qInstructionEl.className = 'question-block-instruction';
                qInstructionEl.textContent = questionInstruction;
                questionContainer.appendChild(qInstructionEl);
            }

            const interactiveArea = document.createElement('div');
            interactiveArea.id = `interactive-answer-area_q${index}`;
            interactiveArea.className = 'interactive-answer-area';

            if (stimulusText) {
                if (questionType === 'fill-in-the-blank') {
                    const stimulusContainer = document.createElement('p');
                    stimulusContainer.className = 'exercise-stimulus';
                    const parts = stimulusText.split('__________'); // Split by ten underscores

                    if (CURRENT_SUBJECT === 'math') { // Math fill-in-the-blank expects one input for the answer
                        stimulusContainer.appendChild(document.createTextNode(stimulusText + " ")); // Add space before input
                        const inputEl = document.createElement('input');
                        inputEl.type = 'text'; // Could be 'number' but 'text' is more flexible for now
                        inputEl.id = `fill-in-blank-input_q${index}_b0`; // Single blank
                        inputEl.className = 'fill-in-blank-input inline-blank math-answer-input';
                        inputEl.setAttribute('aria-label', `Answer for question ${index + 1}`);
                        stimulusContainer.appendChild(inputEl);
                    } else { // English fill-in-the-blank (handles __ or ___)
                        for (let i = 0; i < parts.length; i++) {
                            stimulusContainer.appendChild(document.createTextNode(parts[i]));
                            if (i < parts.length - 1) { // If not the last part, means there was a separator (blank)
                                const inputEl = document.createElement('input');
                                inputEl.type = 'text';
                                inputEl.id = `fill-in-blank-input_q${index}_b${i}`; // Use loop index i for blank ID
                                inputEl.className = 'fill-in-blank-input inline-blank';
                                inputEl.setAttribute('aria-label', `Blank ${i + 1} for question ${index + 1}`);
                                
                                const wordBefore = Utils.getLastWord(parts[i]); // Get word before this blank
                                if (wordBefore) {
                                    inputEl.dataset.wordBefore = wordBefore.toLowerCase();
                                }
                                stimulusContainer.appendChild(inputEl);
                            }
                        }
                    }
                    questionContainer.appendChild(stimulusContainer);
                } else { // For MCQs (English or Math) and other non-fill-in types, display stimulus as is
                    const stimulusEl = document.createElement('p');
                    stimulusEl.className = 'exercise-stimulus';
                    stimulusEl.textContent = stimulusText;
                    questionContainer.appendChild(stimulusEl);
                }
            }
            
            if (questionType === 'multiple-choice') { // Applies to both English and Math MCQs
                const optionsNode = questionBlock.querySelector("options");
                if (optionsNode) {
                    const optionsWrapper = document.createElement('div');
                    optionsWrapper.className = 'exercise-options';
                    optionsNode.querySelectorAll("option").forEach(optNode => {
                        const optionId = optNode.getAttribute("id");
                        const optionText = optNode.textContent;
                        questionData.options.push({ id: optionId, text: optionText });

                        const optionDiv = document.createElement('div');
                        optionDiv.className = 'option';
                        const radio = document.createElement('input');
                        radio.type = 'radio';
                        radio.name = `exercise_option_q${index}`; 
                        radio.value = optionId;
                        radio.id = `option_q${index}_${optionId}`;
                        
                        const label = document.createElement('label');
                        label.htmlFor = `option_q${index}_${optionId}`;
                        label.textContent = optionText;
                        
                        optionDiv.appendChild(radio);
                        optionDiv.appendChild(label);
                        optionsWrapper.appendChild(optionDiv);
                    });
                    interactiveArea.appendChild(optionsWrapper); // Options go into interactiveArea
                }
                 questionContainer.appendChild(interactiveArea); // Then interactiveArea into questionContainer
            } else if (questionType === 'fill-in-the-blank') {
                // Inputs are already added within the stimulus for fill-in-the-blank
                // interactiveArea might not be needed here or could wrap the stimulusContainer
                // For consistency, let's ensure interactiveArea is added, even if it's empty for fill-in-the-blank if stimulus handled inputs.
                // However, the current logic puts inputs inside stimulusContainer, so interactiveArea might be redundant.
                // Let's remove appending an empty interactiveArea if fill-in-the-blank inputs are inline.
                // If there was no stimulus but it's fill-in-the-blank (unlikely), we might need a fallback.
                // For now, assuming stimulus parsing handles inputs.
            } else { // Other unknown types
                interactiveArea.innerHTML = `<p class="warning">Unsupported exercise type: ${questionType} for question ${index + 1}</p>`;
                questionContainer.appendChild(interactiveArea);
            }
            // Append questionContainer to main output
            exerciseOutput.appendChild(questionContainer);

            if(index < questionBlocks.length -1) { 
                const separator = document.createElement('hr');
                separator.className = 'question-separator';
                exerciseOutput.appendChild(separator);
            }
                currentExerciseAnswers.push(questionData);
            }); // End of questionBlocks.forEach
            
            if (hasAnyAnswerKey) {
                UI.showAnswerSection();
                if (answerFeedback) {
                    answerFeedback.innerHTML = '';
                    answerFeedback.className = 'feedback-message';
                    answerFeedback.style.display = 'none';
                }
                if (solutionDisplay) {
                    solutionDisplay.innerHTML = '';
                    solutionDisplay.style.display = 'none';
                }
            } else {
                UI.hideAnswerSection();
            }
        } // End of else for non-ai-judger types
    };
    
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const generateButton = exerciseForm.querySelector('button[type="submit"]');
        const promptText = document.getElementById('prompt').value.trim();
        // imageFileInput is already defined at module scope
        const imageFiles = Array.from(imageFileInput && imageFileInput.files ? imageFileInput.files : []);

        // Difficulty auto-tuning logic
        let difficulty = document.getElementById('difficulty').value;
        let autoTuned = false;
        try {
            const autoTuneCheckbox = document.getElementById('auto-tune');
            if (autoTuneCheckbox && autoTuneCheckbox.checked && window.PerformanceTracker) {
                const suggested = PerformanceTracker.getSuggestedDifficulty(CURRENT_SUBJECT);
                document.getElementById('difficulty').value = suggested;
                difficulty = suggested;
                const badge = document.getElementById('auto-tune-badge');
                if (badge) badge.style.display = 'inline';
                console.log(`Auto-tuned difficulty to: ${suggested}`);
                autoTuned = true;
            }
        } catch (e) {
            console.warn("Auto-tune error:", e);
        }

        const exerciseType = document.getElementById('exercise-type').value;
        const targetLanguage = document.getElementById('target-language').value.trim() || "English";
        
        const modelInputEl = document.getElementById('model');
        const modelInputValue = modelInputEl.value.trim();
        const { defaultModel: savedDefaultModel } = Auth.getCredentials();
        const model = modelInputValue || savedDefaultModel || "gpt-4.1"; // Prioritize input, then saved default, then hardcoded fallback
        
        const mcOptionCountInput = document.getElementById('mc-options-count');
        const mcOptionCount = exerciseType === 'multiple-choice' ? parseInt(mcOptionCountInput.value) : null;

        const batchCount = parseInt(document.getElementById('batch-count').value) || 1;
        const exerciseCountInput = parseInt(document.getElementById('exercise-count').value);
        const exerciseCount = isNaN(exerciseCountInput) || exerciseCountInput < 1 ? 1 : exerciseCountInput; 
        
        // Limit batch count for API usage safety
        const actualBatchCount = Math.min(Math.max(batchCount, 1), 5);

        UI.showExerciseDisplay(); // Show the display section for loading message
        if (exerciseOutput) {
            // Clear existing content and show main loading message
            exerciseOutput.innerHTML = `<p>Generating ${actualBatchCount > 1 ? actualBatchCount + ' exercises' : 'exercise'}, please wait...</p>`;
             UI.hideAnswerSection(); // Hide answer section while loading new exercise(s)
        }
        if (generateButton) {
            generateButton.disabled = true;
            generateButton.textContent = 'Generating...';
        }
        
        // Clear previous output
        exerciseOutput.innerHTML = '';
        
        // Create a general container for all batched exercises if actualBatchCount > 1
        const allExercisesContainer = (actualBatchCount > 1) ? document.createElement('div') : exerciseOutput;
        if (actualBatchCount > 1) {
            exerciseOutput.appendChild(allExercisesContainer);
        }

        for (let i = 0; i < actualBatchCount; i++) {
            let currentExerciseDisplayContainer;
            
            if (actualBatchCount > 1) {
                const exerciseBatchWrapper = document.createElement('div');
                exerciseBatchWrapper.className = 'exercise-batch-item';
                
                const batchHeader = document.createElement('h3');
                batchHeader.textContent = `Exercise ${i + 1} of ${actualBatchCount}`;
                batchHeader.style.marginBottom = '1rem';
                exerciseBatchWrapper.appendChild(batchHeader);
                
                currentExerciseDisplayContainer = document.createElement('div');
                currentExerciseDisplayContainer.className = 'single-exercise-content-area';
                exerciseBatchWrapper.appendChild(currentExerciseDisplayContainer);
                allExercisesContainer.appendChild(exerciseBatchWrapper);

                if (i < actualBatchCount - 1) {
                    const separator = document.createElement('hr');
                    separator.style.margin = '2rem 0';
                    allExercisesContainer.appendChild(separator);
                }
            } else {
                currentExerciseDisplayContainer = allExercisesContainer; // Directly use exerciseOutput
            }

            currentExerciseDisplayContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Generating exercise, please wait... Receiving data...</p>';
            const streamingPre = document.createElement('pre');
            streamingPre.id = `streaming-output-pre-${i}`;
            streamingPre.style.whiteSpace = 'pre-wrap';
            streamingPre.style.border = '1px dashed #ccc';
            streamingPre.style.padding = '10px';
            streamingPre.style.maxHeight = '200px';
            streamingPre.style.overflowY = 'auto';
            streamingPre.textContent = 'Streaming XML data...\n';
            currentExerciseDisplayContainer.appendChild(streamingPre);
            
            // Build base64Images array from camera or file input
            let base64Images = [];
            if (capturedImageDataURLs.length) {
                base64Images = capturedImageDataURLs.slice();
            } else if (imageFiles.length) {
                base64Images = await Promise.all(
                    imageFiles.map(f =>
                        new Promise((res, rej) => {
                            const r = new FileReader();
                            r.onload = _=> res(r.result);
                            r.onerror = e=> rej(e);
                            r.readAsDataURL(f);
                        })
                    )
                );
            }

            const promptDetails = {
                prompt: promptText,
                materialType: base64Images.length ? 'image' : 'text',
                materialContent: base64Images.length
                    ? (imageFiles.map(f=>f.name).concat(capturedImageDataURLs.map((_,i)=>`camera_${i}`)).join(', '))
                    : promptText,
                exerciseType: exerciseType,
                difficulty: difficulty,
                targetLanguage: targetLanguage,
                model: model,
                exerciseCount: exerciseCount,
                mcOptionCount: mcOptionCount,
                batchIndex: i,
                batchTotal: actualBatchCount
            };

            let apiCallInput;
            const llmTextPrompt = constructPrompt(promptDetails);

            if (base64Images.length) {
                apiCallInput = { textPrompt: llmTextPrompt, base64Images };
            } else {
                apiCallInput = llmTextPrompt;
            }

            try {
                const onProgressCallback = (chunk) => {
                    streamingPre.textContent += chunk;
                    streamingPre.scrollTop = streamingPre.scrollHeight; // Auto-scroll
                };

                const exerciseXml = await Api.generateExercise(apiCallInput, model, onProgressCallback);
                
                // Clear "Generating..." message and the streaming <pre>
                currentExerciseDisplayContainer.innerHTML = '';

                if (exerciseXml) {
                    if (actualBatchCount > 1) {
                        const exerciseContentDiv = document.createElement('div');
                        currentExerciseDisplayContainer.appendChild(exerciseContentDiv);
                        
                        if (i === actualBatchCount - 1) {
                            displayExercise(exerciseXml); 
                        } else {
                            const preXml = document.createElement('pre');
                            preXml.textContent = exerciseXml;
                            preXml.style.whiteSpace = 'pre-wrap';
                            exerciseContentDiv.innerHTML = `<h4>Exercise ${i+1} Content (View in history for full interaction)</h4>`;
                            exerciseContentDiv.appendChild(preXml);
                        }
                    } else { 
                        displayExercise(exerciseXml); 
                    }
                    saveExerciseToHistory(promptDetails, exerciseXml);
                } else {
                    currentExerciseDisplayContainer.innerHTML = '<p class="error">Failed to generate this exercise. API returned no content.</p>';
                }
            } catch (error) {
                currentExerciseDisplayContainer.innerHTML = `<p class="error">Error generating exercise: ${error.message}</p>`;
                console.error('Exercise generation error:', error);
            }
        } // End of batch loop
        
        // If batching, and displayExercise only affects the main output for the last item,
        // ensure the main exerciseOutput is not showing "Generating..." from the initial setup.
        if (actualBatchCount > 1 && exerciseOutput !== allExercisesContainer) {
             // If displayExercise was called for the last item, it would have cleared exerciseOutput.
             // If not (e.g. error on last item), ensure exerciseOutput is clean or shows the batch container.
        }


        if (generateButton) {
            generateButton.disabled = false;
            generateButton.textContent = 'Generate Exercise';
        }
    };

    const saveExerciseToHistory = (promptDetails, exerciseXml) => {
        const history = loadHistory();
        const newEntry = {
            id: new Date().getTime(), // Simple unique ID
            date: new Date().toISOString(),
            promptDetails: promptDetails,
            exerciseText: exerciseXml // Store the XML string
        };
        history.unshift(newEntry);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
        renderHistory();
    };

    const deleteFromHistory = (itemId) => {
        if (confirm("Are you sure you want to delete this exercise from history?")) {
            const history = loadHistory();
            const updatedHistory = history.filter(item => item.id !== itemId);
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
            renderHistory();
        }
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
            historyList.innerHTML = '<li>No exercises in history yet.</li>';
            return;
        }

        history.forEach(item => {
            const li = document.createElement('li');
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'history-details';

            const promptSpan = document.createElement('span');
            promptSpan.className = 'history-prompt';
            
            let promptDisplayContent = `Prompt: "${item.promptDetails.prompt.substring(0, 37)}${item.promptDetails.prompt.length > 40 ? "..." : ""}"`;
            if (item.promptDetails.materialType === 'image' && item.promptDetails.materialContent) {
                // materialContent for image in history is "Image: ${imageFile.name}"
                promptDisplayContent += ` (with ${item.promptDetails.materialContent})`;
            }

            const modelUsed = item.promptDetails.model || "gpt-4.1";
            const language = item.promptDetails.targetLanguage || "English";
            let typeDetails = `${item.promptDetails.exerciseType}`;
            if (item.promptDetails.exerciseType === 'multiple-choice' && item.promptDetails.mcOptionCount) {
                typeDetails += ` (${item.promptDetails.mcOptionCount} choices)`;
            }
            
            let languageText = "";
            if (language.toLowerCase() !== 'english') {
                languageText = `${language}, `;
            }

            promptSpan.textContent = `${promptDisplayContent} (${languageText}${typeDetails}, ${item.promptDetails.difficulty}, Model: ${modelUsed})`;
            
            const metaSpan = document.createElement('span');
            metaSpan.className = 'history-meta';
            metaSpan.textContent = `Generated on: ${Utils.formatDate(item.date)}`;

            detailsDiv.appendChild(promptSpan);
            detailsDiv.appendChild(metaSpan);

            const buttonDiv = document.createElement('div');
            buttonDiv.className = 'history-buttons';

            const viewButton = document.createElement('button');
            viewButton.textContent = 'View';
            viewButton.className = 'view-history-btn';
            viewButton.addEventListener('click', () => {
                // exerciseText is now XML
                displayExercise(item.exerciseText); 
                UI.showExerciseDisplay();
                exerciseOutput.scrollIntoView({ behavior: 'smooth' });
            });

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.className = 'delete-history-btn';
            deleteButton.addEventListener('click', () => deleteFromHistory(item.id));

            buttonDiv.appendChild(viewButton);
            buttonDiv.appendChild(deleteButton);
            li.appendChild(detailsDiv);
            li.appendChild(buttonDiv);
            historyList.appendChild(li);
        });
    };

    // Check the user's answer against the solution
    const checkAnswer = () => {
        if (!currentExerciseAnswers || currentExerciseAnswers.length === 0) return [];

        const results = currentExerciseAnswers.map((question, index) => {
            let userAnswerText = ''; // For MC
            let userAnswersArray = []; // For multi-blank fill-in
            let questionAnswered = false;
            let allBlanksFilled = true; // For multi-blank

            if (question.type === 'multiple-choice') {
                const selectedOption = document.querySelector(`#interactive-answer-area_q${index} input[name="exercise_option_q${index}"]:checked`);
                if (selectedOption) {
                    userAnswerText = selectedOption.value;
                    question.userAnswer = userAnswerText; // Store single string for MC
                    questionAnswered = true;
                }
            } else if (question.type === 'fill-in-the-blank') {
                const stimulusHolder = document.querySelector(`.question-container[data-question-index="${index}"]`); // Check within the whole container
                if (stimulusHolder) { // Ensure the question container exists
                    const inputElements = stimulusHolder.querySelectorAll('input.inline-blank');
                    inputElements.forEach((inputEl, blankIdx) => {
                        const val = inputEl.value.trim();
                        userAnswersArray.push(val);
                        if (val === '') {
                            allBlanksFilled = false;
                        }
                    });
                    if (CURRENT_SUBJECT === 'math') { // Single answer for math problem
                        const inputEl = stimulusHolder.querySelector('input.math-answer-input');
                        if (inputEl) {
                            const val = inputEl.value.trim();
                            question.userAnswer = val; // Store single string for math answer
                            questionAnswered = val !== '';
                        }
                    } else { // English multi-blank
                        const inputElements = stimulusHolder.querySelectorAll('input.inline-blank');
                        inputElements.forEach((inputEl, blankIdx) => {
                            const val = inputEl.value.trim();
                            userAnswersArray.push(val);
                            if (val === '') {
                                allBlanksFilled = false;
                            }
                        });
                        question.userAnswer = userAnswersArray; // Store array for English fill-in
                        questionAnswered = inputElements.length > 0 ? userAnswersArray.some(ans => ans !== '') : false;
                    }
                }
            } else if (question.type === 'ai-judger') {
                const textareaEl = document.getElementById(`ai-judger-input_q${index}`);
                if (textareaEl) {
                    question.userAnswer = textareaEl.value.trim();
                    questionAnswered = question.userAnswer !== '';
                }
            }
            
            // Determine correctness (for non-AI-judger types)
            if (question.type === 'multiple-choice') {
                // question.answerKey for MC is [ ['A'] ] (or e.g. [['B']] if script for Math MC determined B was correct)
                const correctAnswerID = (question.answerKey && question.answerKey[0] && question.answerKey[0][0]) ? question.answerKey[0][0] : null;
                if (correctAnswerID && ['ERROR_IN_SCRIPT', 'OPTION_MISMATCH', 'NO_ANSWER_LOGIC'].includes(correctAnswerID)) {
                    question.isCorrect = false; // Cannot be correct if answer logic failed
                } else if (correctAnswerID) {
                    question.isCorrect = userAnswerText.toLowerCase() === correctAnswerID.toLowerCase();
                } else {
                    question.isCorrect = false; // No answer key defined
                }
            } else if (question.type === 'fill-in-the-blank') {
                if (CURRENT_SUBJECT === 'math') {
                    // For math fill-in, question.userAnswer is a string, question.answerKey is [['computedAnswerString']]
                    if (question.answerKey && question.answerKey[0] && question.answerKey[0][0]) {
                        const correctAnswerString = question.answerKey[0][0];
                        if (correctAnswerString === 'ERROR_IN_SCRIPT' || correctAnswerString === 'NO_ANSWER_DEFINED') {
                            question.isCorrect = false; 
                        } else {
                            // Normalize by trimming. Consider more robust normalization for numbers.
                            question.isCorrect = question.userAnswer.trim() === correctAnswerString.trim();
                        }
                    } else {
                        question.isCorrect = false;
                    }
                } else { // English fill-in-the-blank
                    if (userAnswersArray.length === question.answerKey.length) {
                        question.isCorrect = userAnswersArray.every((userAnsTrimmed, i) => {
                            const acceptedKeysForBlank = question.answerKey[i];
                            if (!acceptedKeysForBlank || acceptedKeysForBlank.length === 0) return false;
                            const userAnsLower = userAnsTrimmed.toLowerCase();
                            let wordBefore = '';
                            const questionContainerNode = document.querySelector(`.question-container[data-question-index="${index}"]`);
                            if (questionContainerNode) {
                                const inputElements = questionContainerNode.querySelectorAll('input.inline-blank');
                                if (inputElements[i] && inputElements[i].dataset.wordBefore) {
                                    wordBefore = inputElements[i].dataset.wordBefore;
                                }
                            }
                            return acceptedKeysForBlank.some(keyAns => {
                                const keyAnsLower = keyAns.toLowerCase();
                                const userEquivalentForms = Utils.getEquivalentForms(userAnsTrimmed);
                                const keyEquivalentForms = Utils.getEquivalentForms(keyAns);
                                if (userEquivalentForms.some(uf => keyEquivalentForms.includes(uf))) return true;
                                if (wordBefore) {
                                    const contractionPairs = Utils.getContractionPairs();
                                    const potentialUserContractedFull = wordBefore + userAnsLower;
                                    for (const pair of contractionPairs) {
                                        if (pair.contracted === potentialUserContractedFull) {
                                            if (pair.expanded.toLowerCase().startsWith(wordBefore + " ") || pair.expanded.toLowerCase().startsWith(wordBefore + "'")) {
                                                const expandedRemainder = pair.expanded.toLowerCase().substring(wordBefore.length).trim();
                                                if (Utils.getEquivalentForms(expandedRemainder).includes(keyAnsLower)) return true;
                                            }
                                        }
                                    }
                                    const potentialUserExpandedFull = wordBefore + " " + userAnsLower;
                                    for (const pair of contractionPairs) {
                                        if (pair.expanded === potentialUserExpandedFull) {
                                            if (Utils.getEquivalentForms(pair.contracted).includes(keyAnsLower)) return true;
                                        }
                                    }
                                }
                                return false;
                            });
                        });
                    } else {
                        question.isCorrect = false;
                    }
                    if (!allBlanksFilled && questionAnswered) question.isCorrect = false;
                }
            } else if (question.type === 'ai-judger') {
                // Correctness for AI Judger will be determined by the API response later.
                // For now, isCorrect remains null or is set based on whether it's answered.
                question.isCorrect = null; // Explicitly set to null, to be updated by AI
            } else { // Other unknown types
                question.isCorrect = false;
            }
            
            return { 
                questionIndex: index,
                userAnswer: question.userAnswer, // This could be string (MC) or array (Fill-in)
                correctAnswer: question.answerKey,
                isCorrect: question.isCorrect,
                answered: questionAnswered,
                type: question.type // Pass type for specific messaging in handleAnswerSubmit
            };
        });
        return results;
    };
    
    // Display the correct answers
    const showSolution = () => {
        if (!currentExerciseAnswers || currentExerciseAnswers.length === 0 || !solutionDisplay) return;
        
        let solutionHtml = `<h4>Answer Key & Your Answers:</h4>`;
        currentExerciseAnswers.forEach((question, index) => {
            solutionHtml += `<div class="solution-question-block">`;
            solutionHtml += `<p><strong>Question ${index + 1}:</strong></p>`; // Stimulus is rendered with blanks now in solution
            
            if (question.type === 'multiple-choice') {
                solutionHtml += `<p class="exercise-stimulus">${question.stimulus}</p>`;
                // question.answerKey for MC is [ ['A'] ] (or derived for Math MC)
                const correctOptKey = (question.answerKey[0] && question.answerKey[0][0]) ? question.answerKey[0][0] : 'N/A';
                
                if (question.scriptExecutionError && CURRENT_SUBJECT === 'math') {
                     solutionHtml += `<p>Correct Option: <em class="error">Error in script (${correctOptKey})</em></p>`;
                } else if (['OPTION_MISMATCH', 'NO_ANSWER_LOGIC'].includes(correctOptKey) && CURRENT_SUBJECT === 'math') {
                     solutionHtml += `<p>Correct Option: <em class="error">Could not determine correct option (${correctOptKey})</em></p>`;
                }
                else {
                    const correctOption = question.options.find(opt => correctOptKey && opt.id.toLowerCase() === correctOptKey.toLowerCase());
                    solutionHtml += `<p>Correct Option: <strong>${correctOptKey}</strong> (${correctOption ? correctOption.text : 'N/A'})</p>`;
                }
                const userAnswerOption = question.options.find(opt => question.userAnswer && typeof question.userAnswer === 'string' && opt.id.toLowerCase() === question.userAnswer.toLowerCase());
                solutionHtml += `<p>Your Answer: ${question.userAnswer ? `<strong>${question.userAnswer}</strong> (${userAnswerOption ? userAnswerOption.text : 'N/A'})` : '<em>Not answered</em>'} ${question.isCorrect ? '&#9989;' : (question.userAnswer ? '&#10060;' : '')}</p>`;
            } else if (question.type === 'fill-in-the-blank') {
                if (CURRENT_SUBJECT === 'math') {
                    // Math fill-in-the-blank: stimulus is the question, answerKey[0][0] is the correct answer string
                    solutionHtml += `<p class="exercise-stimulus">${question.stimulus}</p>`;
                    const correctAnswer = (question.answerKey && question.answerKey[0] && question.answerKey[0][0]) ? question.answerKey[0][0] : 'N/A';
                    if (question.scriptExecutionError) {
                         solutionHtml += `<p>Correct Answer: <em class="error">Error in script (${correctAnswer})</em></p>`;
                    } else if (correctAnswer === 'NO_ANSWER_DEFINED') {
                         solutionHtml += `<p>Correct Answer: <em class="error">Not defined by AI</em></p>`;
                    }
                    else {
                        solutionHtml += `<p>Correct Answer: <strong>${correctAnswer}</strong></p>`;
                    }
                    solutionHtml += `<p>Your Answer: <strong>${question.userAnswer || '<em>Not answered</em>'}</strong> ${question.isCorrect ? '&#9989;' : (question.userAnswer ? '&#10060;' : '')}</p>`;
                } else { // English fill-in-the-blank
                    const parts = question.stimulus.split('___');
                    let filledStimulusUser = '';
                    let filledStimulusCorrect = '';

                    parts.forEach((part, i) => {
                        filledStimulusUser += part;
                        filledStimulusCorrect += part;
                        if (i < question.answerKey.length) {
                            const userAnswerForBlank = (Array.isArray(question.userAnswer) && question.userAnswer[i]) ? question.userAnswer[i] : '';
                            const correctAnswersForBlank = question.answerKey[i];
                            const isThisBlankCorrect = correctAnswersForBlank.some(ca => userAnswerForBlank.toLowerCase() === ca.toLowerCase());
                            
                            filledStimulusUser += `<strong>${userAnswerForBlank || '(empty)'}</strong>${isThisBlankCorrect ? '&#9989;' : (userAnswerForBlank ? '&#10060;' : '')}`;
                            filledStimulusCorrect += `<em>${correctAnswersForBlank.join(' / ')}</em>`;
                        }
                    });
                    solutionHtml += `<p>Your Answer: ${filledStimulusUser}</p>`;
                    solutionHtml += `<p>Correct Answer(s): ${filledStimulusCorrect}</p>`;
                }
            } else if (question.type === 'ai-judger') {
                solutionHtml += `<p class="exercise-stimulus"><strong>Task:</strong> ${question.taskText}</p>`;
                solutionHtml += `<p><strong>Your Response:</strong><br>${Utils.customMarkdownParse(question.userAnswer) || '<em>Not answered</em>'}</p>`;
                if (question.judgment) {
                    let statusIcon = '';
                    if (question.judgment.status === 'correct') statusIcon = '&#9989;';
                    else if (question.judgment.status === 'incorrect') statusIcon = '&#10060;';
                    else if (question.judgment.status === 'partially-correct') statusIcon = '&#9998;'; // Pencil icon for partially correct

                    solutionHtml += `<p><strong>AI Judgment:</strong> <span class="judgment-status-${question.judgment.status}">${question.judgment.status.toUpperCase()}</span> ${statusIcon}</p>`;
                    if (question.judgment.status === 'error') {
                        solutionHtml += `<div class="ai-feedback error">${Utils.customMarkdownParse(question.judgment.feedback)}</div>`;
                    } else {
                        solutionHtml += `<div class="ai-feedback">${Utils.customMarkdownParse(question.judgment.feedback)}</div>`;
                    }
                } else {
                    solutionHtml += `<p><strong>AI Judgment:</strong> <em>Awaiting judgment...</em></p>`;
                }
            } else { // Other unknown types
                 solutionHtml += `<p class="exercise-stimulus">${question.stimulus}</p>`;
                 const correctAnswerDisplay = question.answerKey.map(akList => Array.isArray(akList) ? akList.join(' / ') : akList).join('; ');
                 solutionHtml += `<p>Correct Answer: <strong>${correctAnswerDisplay || 'N/A'}</strong></p>`;
                 const userAnswerDisplay = Array.isArray(question.userAnswer) ? question.userAnswer.join(', ') : question.userAnswer;
                 solutionHtml += `<p>Your Answer: ${userAnswerDisplay ? `<strong>${userAnswerDisplay}</strong>` : '<em>Not answered</em>'} ${question.isCorrect ? '&#9989;' : (userAnswerDisplay ? '&#10060;' : '')}</p>`;
            }

            // Add "Explain Why Incorrect" button for MC and Fill-in-the-blank if applicable
            if ((question.type === 'multiple-choice' || question.type === 'fill-in-the-blank') &&
                question.isCorrect === false && question.userAnswer !== undefined && 
                ( (Array.isArray(question.userAnswer) && question.userAnswer.some(ua => ua !=='')) || (typeof question.userAnswer === 'string' && question.userAnswer !== '') ) ) {
                solutionHtml += `<div class="explanation-section" id="explanation-q${index}"></div>`;
                solutionHtml += `<button type="button" class="explain-button" data-question-index="${index}"><i class="fas fa-comment-dots"></i> Explain Why Incorrect</button>`;
                solutionHtml += `
                <div class="follow-up-container" id="follow-up-q${index}" style="display: none;">
                    <textarea class="follow-up-textarea" id="follow-up-input-q${index}" placeholder="Ask a follow-up question about this explanation..." aria-label="Follow-up question"></textarea>
                    <button type="button" class="follow-up-button" data-question-index="${index}"><i class="fas fa-paper-plane"></i> Ask Follow-up</button>
                </div>`;
            }
            solutionHtml += `</div>`;
        });
        
        solutionDisplay.innerHTML = solutionHtml;
        solutionDisplay.style.display = 'block';

        // Add event listeners to newly created "Explain" and "Ask Follow-up" buttons
        solutionDisplay.querySelectorAll('.explain-button').forEach(button => {
            button.addEventListener('click', handleExplanationRequest);
        });
        solutionDisplay.querySelectorAll('.follow-up-button').forEach(button => {
            button.addEventListener('click', handleFollowUpQuestion);
        });
    };

    const handleExplanationRequest = async (event) => {
        const button = event.target.closest('.explain-button');
        const questionIndex = parseInt(button.dataset.questionIndex);
        const questionData = currentExerciseAnswers[questionIndex];

        if (!questionData) return;

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching Explanation...';

        const explanationContainer = document.getElementById(`explanation-q${questionIndex}`);
        let accumulatedExplanation = '';
        let firstChunkReceived = false;

        if (explanationContainer) {
            explanationContainer.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> <i>Loading explanation...</i></p>';
            explanationContainer.style.display = 'block';
        }

        const { defaultModel: savedDefaultModel } = Auth.getCredentials();
        const exerciseModelInput = document.getElementById('model');
        const modelForExplanation = (exerciseModelInput && exerciseModelInput.value.trim()) 
                                     ? exerciseModelInput.value.trim() 
                                     : savedDefaultModel || "gpt-4.1";

        let promptContext = `The user was asked the following English language question:
Question Type: ${questionData.type}
Stimulus: "${questionData.stimulus}"
`;

        if (questionData.type === 'multiple-choice') {
            const userOptText = questionData.options.find(opt => opt.id === questionData.userAnswer)?.text || questionData.userAnswer;
            const correctOptId = questionData.answerKey[0][0];
            const correctOptText = questionData.options.find(opt => opt.id === correctOptId)?.text || correctOptId;
            promptContext += `Options were:
${questionData.options.map(opt => `- ${opt.id}: ${opt.text}`).join('\n')}
User's Answer: "${userOptText}" (Option ${questionData.userAnswer})
Correct Answer: "${correctOptText}" (Option ${correctOptId})
`;
        } else if (questionData.type === 'fill-in-the-blank') {
            let blanksDetails = "The question involved the following blank(s):\n";
            if (CURRENT_SUBJECT === 'math') {
                blanksDetails = `User's Answer: "${questionData.userAnswer || "(empty)"}"\nCorrect Answer: "${questionData.answerKey[0][0]}"\n`;
                 if (questionData.scriptExecutionError) {
                    blanksDetails += `Note: There was an error executing the solution script: ${questionData.scriptExecutionError}\n`;
                }
            } else { // English
                const stimulusParts = questionData.stimulus.split('___');
                questionData.answerKey.forEach((correctKeysForBlank, blankIndex) => {
                    const userAnswerForBlank = questionData.userAnswer[blankIndex] || "(empty)";
                    blanksDetails += `For blank ${blankIndex + 1} (context: '${stimulusParts[blankIndex] || ''} ___ ${stimulusParts[blankIndex+1] || ''}'):
    - User's answer: "${userAnswerForBlank}"
    - Correct answer(s): "${correctKeysForBlank.join(' / ')}"
    `;
                });
            }
            promptContext += blanksDetails;
        }
        
        const tutorSubject = CURRENT_SUBJECT === 'math' ? 'Math' : 'English language';
        const explanationPrompt = `${promptContext}
You are a ${tutorSubject} tutor. Please explain concisely:
1. Why the user's answer(s) is/are incorrect for this question/blank(s).
2. Why the provided correct answer(s) is/are correct.
Keep the explanation clear, helpful, and tailored for an English language learner. Use Markdown for formatting if it helps clarity (e.g., lists, bolding).`;
        
        const onProgressCallback = (chunk) => {
            if (!firstChunkReceived && explanationContainer) {
                explanationContainer.innerHTML = ''; // Clear "Loading..."
                firstChunkReceived = true;
            }
            accumulatedExplanation += chunk;
            if (explanationContainer) {
                // Temporarily append raw text. Will be parsed by marked.js at the end.
                // To avoid re-parsing on each chunk, we'll update textContent and parse once.
                // For live markdown rendering, would need more complex logic.
                explanationContainer.textContent += chunk; 
            }
        };

        try {
            const fullExplanation = await Api.generateExplanation(explanationPrompt, modelForExplanation, onProgressCallback);
            
            if (fullExplanation && explanationContainer) {
                // Now that full explanation is received (it's also in accumulatedExplanation), parse it.
                explanationContainer.innerHTML = Utils.customMarkdownParse(fullExplanation);
                // Show the follow-up question section
                const followUpContainer = document.getElementById(`follow-up-q${questionIndex}`);
                if (followUpContainer) {
                    followUpContainer.style.display = 'block';
                }
            } else if (explanationContainer) {
                explanationContainer.innerHTML = '<p class="error">Failed to retrieve explanation or explanation was empty.</p>';
            }
        } catch (error) {
            if (explanationContainer) {
                explanationContainer.innerHTML = `<p class="error">Error fetching explanation: ${error.message}</p>`;
            }
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-comment-dots"></i> Explain Why Incorrect';
        }
    };

    const handleFollowUpQuestion = async (event) => {
        const button = event.target.closest('.follow-up-button');
        const questionIndex = parseInt(button.dataset.questionIndex);
        const questionData = currentExerciseAnswers[questionIndex];

        if (!questionData) return;

        const followUpInput = document.getElementById(`follow-up-input-q${questionIndex}`);
        const followUpText = followUpInput.value.trim();

        if (!followUpText) {
            alert("Please enter your follow-up question.");
            followUpInput.focus();
            return;
        }

        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Asking...';

        const explanationContainer = document.getElementById(`explanation-q${questionIndex}`);
        const initialExplanationText = explanationContainer.textContent; // Get text content of initial explanation

        // Create a new div for this follow-up's Q&A
        const followUpResponseContainer = document.createElement('div');
        followUpResponseContainer.className = 'follow-up-response';
        explanationContainer.appendChild(followUpResponseContainer);
        
        followUpResponseContainer.innerHTML = `<p><strong>Your follow-up:</strong> ${followUpText}</p><p><i class="fas fa-spinner fa-spin"></i> <i>Getting answer...</i></p>`;
        
        let accumulatedFollowUpResponse = '';
        let firstFollowUpChunkReceived = false;

        const { defaultModel: savedDefaultModel } = Auth.getCredentials();
        const exerciseModelInput = document.getElementById('model');
        const modelForFollowUp = (exerciseModelInput && exerciseModelInput.value.trim()) 
                                     ? exerciseModelInput.value.trim() 
                                     : savedDefaultModel || "gpt-4.1";

        let promptContext = `The user was asked the following English language question:
Question Type: ${questionData.type}
Stimulus: "${questionData.stimulus}"
`;
        if (questionData.type === 'multiple-choice') {
            const userOptText = questionData.options.find(opt => opt.id === questionData.userAnswer)?.text || questionData.userAnswer;
            const correctOptId = questionData.answerKey[0][0];
            const correctOptText = questionData.options.find(opt => opt.id === correctOptId)?.text || correctOptId;
            promptContext += `User's Answer: "${userOptText}" (Option ${questionData.userAnswer})\nCorrect Answer: "${correctOptText}" (Option ${correctOptId})\n`;
        } else if (questionData.type === 'fill-in-the-blank') {
            let blanksDetails = "User's answers for blanks:\n";
            if (CURRENT_SUBJECT === 'math') {
                 blanksDetails += `User answered "${questionData.userAnswer || "(empty)"}", Correct: "${questionData.answerKey[0][0]}"\n`;
            } else { // English
                questionData.answerKey.forEach((correctKeysForBlank, blankIndex) => {
                    const userAnswerForBlank = questionData.userAnswer[blankIndex] || "(empty)";
                    blanksDetails += `Blank ${blankIndex + 1}: User answered "${userAnswerForBlank}", Correct: "${correctKeysForBlank.join(' / ')}"\n`;
                });
            }
            promptContext += blanksDetails;
        }
        promptContext += `\nAn initial explanation was provided: "${initialExplanationText}"`;
        
        const tutorSubject = CURRENT_SUBJECT === 'math' ? 'Math' : 'English language';
        const followUpPrompt = `${promptContext}

The user has a follow-up question: "${followUpText}"

You are a ${tutorSubject} tutor. Please answer the user's follow-up question concisely and clearly, in the context of the original question and the initial explanation. Use Markdown for formatting.`;

        const onFollowUpProgressCallback = (chunk) => {
            if (!firstFollowUpChunkReceived) {
                // Clear "Getting answer..." from the specific followUpResponseContainer
                const currentAnswerP = followUpResponseContainer.querySelector('p:last-child');
                if(currentAnswerP && currentAnswerP.innerHTML.includes('Getting answer...')) {
                    currentAnswerP.innerHTML = ''; // Clear loading message
                }
                firstFollowUpChunkReceived = true;
            }
            accumulatedFollowUpResponse += chunk;
            // Append chunk to the last p, or create new if needed. For simplicity, just update textContent of the answer part.
            // This will show raw markdown during streaming.
            let answerParagraph = followUpResponseContainer.querySelector('.ai-follow-up-answer');
            if (!answerParagraph) {
                answerParagraph = document.createElement('p');
                answerParagraph.className = 'ai-follow-up-answer';
                followUpResponseContainer.appendChild(answerParagraph);
            }
            answerParagraph.textContent += chunk; // Live update with raw text
        };

        try {
            const fullFollowUpResponse = await Api.generateExplanation(followUpPrompt, modelForFollowUp, onFollowUpProgressCallback);
            let answerParagraph = followUpResponseContainer.querySelector('.ai-follow-up-answer');
            if (!answerParagraph) { // Should exist from onProgress, but as a fallback
                answerParagraph = document.createElement('p');
                answerParagraph.className = 'ai-follow-up-answer';
                // Clear loading message if it's still there (e.g., if no chunks were received before completion)
                const loadingMsgP = followUpResponseContainer.querySelector('p:last-child');
                 if(loadingMsgP && loadingMsgP.innerHTML.includes('Getting answer...')) {
                    loadingMsgP.innerHTML = '';
                }
                followUpResponseContainer.appendChild(answerParagraph);
            }

            if (fullFollowUpResponse) {
                answerParagraph.innerHTML = "<strong>AI's Answer:</strong> " + Utils.customMarkdownParse(fullFollowUpResponse);
            } else {
                answerParagraph.innerHTML = "<strong>AI's Answer:</strong> <span class='error'>Failed to retrieve follow-up answer or it was empty.</span>";
            }
        } catch (error) {
            let answerParagraph = followUpResponseContainer.querySelector('.ai-follow-up-answer');
            if (answerParagraph) {
                answerParagraph.innerHTML = `<strong>AI's Answer:</strong> <span class='error'>Error fetching follow-up: ${error.message}</span>`;
            } else {
                 followUpResponseContainer.innerHTML += `<p class='error'>Error fetching follow-up: ${error.message}</p>`;
            }
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-paper-plane"></i> Ask Follow-up';
            followUpInput.value = ''; // Clear the input
        }
    };
    
    // Handle answer submission
    const handleAnswerSubmit = async (event) => {
        event.preventDefault();
        
        if (!answerFeedback) return;

        const resultsFromCheckAnswer = checkAnswer(); // This now also collects AI Judger inputs
        if (resultsFromCheckAnswer.length === 0 || !currentExerciseAnswers) {
            answerFeedback.textContent = 'No exercise loaded or no answers to check.';
            answerFeedback.className = 'feedback-message feedback-incorrect';
            answerFeedback.style.display = 'block';
            return;
        }

        const exerciseOverallType = currentExerciseAnswers[0]?.type; // Assuming all questions/tasks in an exercise are of the same overall type

        // Check if all questions/tasks were attempted
        const allAttempted = resultsFromCheckAnswer.every(r => r.answered);

        if (!allAttempted) {
            if (exerciseOverallType === 'multiple-choice') {
                answerFeedback.textContent = 'Please select an option for all multiple-choice questions.';
            } else if (exerciseOverallType === 'fill-in-the-blank') {
                answerFeedback.textContent = 'Please provide an answer for all fill-in-the-blank questions.';
            } else if (exerciseOverallType === 'ai-judger') {
                answerFeedback.textContent = 'Please provide a response for all AI Judger tasks.';
            } else {
                answerFeedback.textContent = 'Please attempt all parts of the exercise.';
            }
            answerFeedback.className = 'feedback-message feedback-incorrect';
            answerFeedback.style.display = 'block';
            return;
        }

        // Difficulty auto-tuning performance tracking
        try {
            // Only track if difficulty select exists
            const difficultySelect = document.getElementById('difficulty');
            if (difficultySelect) {
                const correctCount = resultsFromCheckAnswer.filter(r => r.isCorrect).length;
                const totalQuestions = resultsFromCheckAnswer.length;
                const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;
                if (window.PerformanceTracker) {
                    PerformanceTracker.trackPerformance(
                        getCurrentSubjectPublic(),
                        difficultySelect.value,
                        accuracy
                    );
                }
            }
        } catch (e) {
            console.warn("Performance tracking error:", e);
        }

        // If AI Judger type (now applies to both Math and English for API-based judgment)
        if (exerciseOverallType === 'ai-judger') {
            // Math AI Judger now also uses the API, so local script execution is removed.
            // The logic becomes the same as the English AI Judger.
            answerFeedback.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Receiving AI judgment...</p>';
            const streamingJudgmentPre = document.createElement('pre');
            streamingJudgmentPre.id = `streaming-judgment-pre`;
            streamingJudgmentPre.style.whiteSpace = 'pre-wrap';
            streamingJudgmentPre.style.border = '1px dashed #ccc';
            streamingJudgmentPre.style.padding = '10px';
            streamingJudgmentPre.style.maxHeight = '200px';
            streamingJudgmentPre.style.overflowY = 'auto';
            streamingJudgmentPre.style.marginTop = '10px';
            streamingJudgmentPre.textContent = 'Streaming judgment XML data...\n';
            answerFeedback.appendChild(streamingJudgmentPre);
            
            answerFeedback.className = 'feedback-message'; // Neutral class while loading
            answerFeedback.style.display = 'block';
            if (solutionDisplay) solutionDisplay.style.display = 'none'; // Hide previous solution

            const modelInputEl = document.getElementById('model');
            const modelInputValue = modelInputEl ? modelInputEl.value.trim() : '';
            const { defaultModel: savedDefaultModel } = Auth.getCredentials();
            const modelForJudging = modelInputValue || savedDefaultModel || "gpt-4.1";

            const onJudgmentProgressCallback = (chunk) => {
                streamingJudgmentPre.textContent += chunk;
                streamingJudgmentPre.scrollTop = streamingJudgmentPre.scrollHeight; // Auto-scroll
            };

            const judgmentXmlString = await Api.judgeUserResponses(currentExerciseAnswers, modelForJudging, onJudgmentProgressCallback);

            // Clear the streaming pre from answerFeedback after completion
            if (answerFeedback.contains(streamingJudgmentPre)) {
                answerFeedback.removeChild(streamingJudgmentPre);
            }
            // Reset the main feedback message part (only for API-based judger)
            const mainFeedbackP = answerFeedback.querySelector('p'); // Might be null if math judger cleared it
            if (mainFeedbackP) { // Check if it exists
                 mainFeedbackP.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing AI judgment...';
            }


            if (judgmentXmlString) { // This block is for API-based judger
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(judgmentXmlString, "text/xml");
                const errorNode = xmlDoc.querySelector("parsererror");

                if (errorNode) {
                    console.error("Error parsing AI judgment XML:", errorNode.textContent);
                    answerFeedback.textContent = 'Error processing AI judgment. Invalid XML received.';
                    answerFeedback.className = 'feedback-message feedback-incorrect';
                    return;
                }

                const judgmentNodes = xmlDoc.querySelectorAll("judgments > judgment");
                let judgedCorrectCount = 0;
                judgmentNodes.forEach(jNode => {
                    const taskId = jNode.getAttribute("taskId");
                    const status = jNode.querySelector("status")?.textContent.toLowerCase();
                    const feedbackText = jNode.querySelector("feedback")?.textContent;

                    const taskToUpdate = currentExerciseAnswers.find(task => task.id === taskId);
                    if (taskToUpdate) {
                        taskToUpdate.judgment = { status, feedback: feedbackText };
                        taskToUpdate.isCorrect = (status === 'correct' || status === 'partially-correct'); // Consider partially-correct as a form of "correct" for scoring
                        if (taskToUpdate.isCorrect) judgedCorrectCount++;
                    }
                });
                
                if (mainFeedbackP) {
                    mainFeedbackP.textContent = `AI judgment complete. You got ${judgedCorrectCount} out of ${currentExerciseAnswers.length} tasks evaluated as correct or partially correct.`;
                } else { // Fallback if p was removed
                    answerFeedback.textContent = `AI judgment complete. You got ${judgedCorrectCount} out of ${currentExerciseAnswers.length} tasks evaluated as correct or partially correct.`;
                }
                answerFeedback.className = `feedback-message feedback-${judgedCorrectCount === currentExerciseAnswers.length ? 'correct' : 'incorrect'}`;
            } else {
                if (mainFeedbackP) mainFeedbackP.textContent = 'Failed to get AI judgment.';
                else if (mainFeedbackP) mainFeedbackP.textContent = 'Failed to get AI judgment.';
                else answerFeedback.textContent = 'Failed to get AI judgment.'; 
                answerFeedback.className = 'feedback-message feedback-incorrect';
            }
        } else { // For MC and Fill-in-the-blank (non-AI-judger types), correctness is already determined by checkAnswer
            const correctCount = resultsFromCheckAnswer.filter(r => r.isCorrect).length;
            const totalQuestions = resultsFromCheckAnswer.length;
            answerFeedback.textContent = `You got ${correctCount} out of ${totalQuestions} correct!`;
            answerFeedback.className = `feedback-message feedback-${correctCount === totalQuestions ? 'correct' : 'incorrect'}`;
        }
        
        answerFeedback.style.display = 'block';
        showSolution(); 
    };

    const printExercise = () => {
        // creating a print-specific stylesheet or opening a new window.
        Utils.printElement(exerciseOutput);
    };

    // Camera Functions (based on user example)
    async function openCamera() {
        console.log('openCamera called');
        if (!cameraModal || !cameraVideoFeed) {
            console.error('Camera modal or video feed element not found.');
            return;
        }
        
        console.log('cameraModal element:', cameraModal);
        console.log('cameraVideoFeed element:', cameraVideoFeed);

        capturedImageDataURL = null; // Clear previous capture
        if (imageFileInput) imageFileInput.value = ''; // Clear file input
        if (fileNameDisplay) fileNameDisplay.textContent = 'No file selected';

        console.log('Attempting to show camera modal...');
        cameraModal.style.display = 'block'; // Show modal
        console.log('Camera modal display style set to block. Is it visible?');

        try {
            console.log('Attempting to get user media (camera)...');
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('getUserMedia is not supported by this browser.');
                alert('Camera access (getUserMedia) is not supported by this browser.');
                closeCamera();
                return;
            }
            currentCameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
            console.log('User media obtained:', currentCameraStream);
            cameraVideoFeed.srcObject = currentCameraStream;
            
            console.log('Attempting to play video feed...');
            await cameraVideoFeed.play();
            console.log('Video feed should be playing.');

        } catch (err) {
            console.error("Error during camera setup:", err.name, err.message, err);
            alert(`Could not access the camera. Error: ${err.name} - ${err.message}. Please ensure permissions are granted and no other app is using the camera.`);
            closeCamera(); // Close modal if camera access or play fails
        }
    }

    function closeCamera() {
        if (currentCameraStream) {
            currentCameraStream.getTracks().forEach(track => track.stop());
        }
        currentCameraStream = null;
        if (cameraVideoFeed) cameraVideoFeed.srcObject = null;
        if (cameraModal) cameraModal.style.display = 'none'; // Hide modal
    }

    function captureImageFromCamera() {
        if (!cameraVideoFeed || !cameraCanvas || !fileNameDisplay) return;

        const videoWidth = cameraVideoFeed.videoWidth;
        const videoHeight = cameraVideoFeed.videoHeight;
        if (videoWidth === 0 || videoHeight === 0) {
            alert("Camera feed not available or has zero dimensions. Cannot capture.");
            return;
        }
        cameraCanvas.width = videoWidth;
        cameraCanvas.height = videoHeight;

        const context = cameraCanvas.getContext('2d');
        context.drawImage(cameraVideoFeed, 0, 0, videoWidth, videoHeight);

        const dataURL = cameraCanvas.toDataURL('image/webp');
        capturedImageDataURLs.push(dataURL);

        if (fileNameDisplay) {
            fileNameDisplay.textContent = capturedImageDataURLs.map((_,i)=>`camera_${i}.webp`).join(', ');
        }
        if (imageFileInput) imageFileInput.value = ''; // Clear file input selection

        closeCamera();
    }

    const init = () => {
        // Initialize DOM element variables
        exerciseForm = document.getElementById('exercise-form');
        exerciseOutput = document.getElementById('exercise-output');
        answerForm = document.getElementById('answer-form');
        userAnswerInput = document.getElementById('user-answer'); // Note: May not be used directly
        answerFeedback = document.getElementById('answer-feedback');
        solutionDisplay = document.getElementById('solution-display');
        showSolutionButton = document.getElementById('show-solution');
        copyExerciseButton = document.getElementById('copy-exercise');
        printExerciseButton = document.getElementById('print-exercise');
        historyList = document.getElementById('history-list');
        imageFileInput = document.getElementById('exercise-image');
        fileNameDisplay = document.getElementById('file-name-display');

        // Camera Modal Elements
        cameraModal = document.getElementById('camera-modal');
        cameraVideoFeed = document.getElementById('camera-video-feed');
        cameraCanvas = document.getElementById('camera-canvas');
        useCameraButton = document.getElementById('use-camera-button');
        captureCameraImageButton = document.getElementById('capture-camera-image-button');
        closeCameraModalButton = document.getElementById('close-camera-modal-button');

        // Difficulty auto-tuning: user override badge hide
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            difficultySelect.addEventListener('change', () => {
                const badge = document.getElementById('auto-tune-badge');
                if (badge) badge.style.display = 'none';
            });
        }

        if (exerciseForm) {
            exerciseForm.addEventListener('submit', handleFormSubmit);
        }
        
        // The global answerForm might still be useful for the submit/show solution buttons
        if (answerForm) { 
            answerForm.addEventListener('submit', handleAnswerSubmit);
        }
        
        if (showSolutionButton) {
            showSolutionButton.addEventListener('click', showSolution);
        }

        if (copyExerciseButton) {
            copyExerciseButton.addEventListener('click', () => {
                if (exerciseOutput) {
                    navigator.clipboard.writeText(exerciseOutput.innerText)
                        .then(() => alert('Exercise copied to clipboard!'))
                        .catch(err => console.error('Failed to copy text: ', err));
                }
            });
        }

        if (printExerciseButton) {
            printExerciseButton.addEventListener('click', printExercise);
        }

        // Camera related event listeners
        if (useCameraButton) {
            useCameraButton.addEventListener('click', openCamera);
        }
        if (captureCameraImageButton) {
            captureCameraImageButton.addEventListener('click', captureImageFromCamera);
        }
        if (closeCameraModalButton) {
            closeCameraModalButton.addEventListener('click', closeCamera);
        }

        // Handle file input changes
        if (imageFileInput && fileNameDisplay) {
            imageFileInput.addEventListener('change', () => {
                // whenever user picks files, forget previous camera shots
                capturedImageDataURLs = [];
                if (imageFileInput.files && imageFileInput.files.length > 0) {
                    fileNameDisplay.textContent = Array.from(imageFileInput.files).map(f=>f.name).join(', ');
                    closeCamera(); // Close camera modal if it was open
                } else {
                    fileNameDisplay.textContent = 'No file selected';
                }
            });
        }

        // Show/hide MC options count based on exercise type
        const exerciseTypeSelect = document.getElementById('exercise-type');
        const mcOptionsGroup = document.getElementById('mc-options-count-group');
        if (exerciseTypeSelect && mcOptionsGroup) {
            exerciseTypeSelect.addEventListener('change', (event) => {
                if (event.target.value === 'multiple-choice') {
                    mcOptionsGroup.style.display = 'block';
                } else {
                    mcOptionsGroup.style.display = 'none'; // Hides for fill-in and ai-judger
                }
            });
            // Initial check
            if (exerciseTypeSelect.value === 'multiple-choice') {
                mcOptionsGroup.style.display = 'block';
            } else {
                mcOptionsGroup.style.display = 'none';
            }
        }

        renderHistory(); // Load and display history on initial page load
    };
    
    return {
        init,
        displayExercise,
        checkAnswer,
        showSolution,
        getCurrentSubject: getCurrentSubjectPublic
    };
})();
