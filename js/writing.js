

const Writing = (() => {
    
    let topicGenerationForm, writingStyleInput, writingKeywordsInput, writingGradeLevelInput, writingModelInput,
        generatedTopicBox, generatedTopicText,
        userWritingArea,
        timerDurationInput, 
        startTimerButton, pauseTimerButton, resetTimerButton, timerDisplay,
        submitWritingButton,
        feedbackOutput, diffOutput, diffPre, copyFeedbackButton,
        historyList;

    
    let currentTopicDetails = null; 
    let timerInterval = null;
    let secondsElapsed = 0; 
    let initialCountdownSeconds = 0; 
    let isCountdown = false; 
    let timerRunning = false;
    const HISTORY_STORAGE_KEY = 'writingPracticeHistory';

    const formatTime = (totalSeconds) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const updateTimerDisplay = () => {
        if (timerDisplay) timerDisplay.textContent = formatTime(secondsElapsed);
    };

    const startTimer = () => {
        if (timerRunning) return;

        const durationMinutes = timerDurationInput ? parseInt(timerDurationInput.value, 10) : 0;

        if (durationMinutes > 0) {
            isCountdown = true;
            initialCountdownSeconds = durationMinutes * 60;
            secondsElapsed = initialCountdownSeconds;
            if (timerDurationInput) timerDurationInput.disabled = true;
        } else {
            isCountdown = false;
            initialCountdownSeconds = 0; 
            secondsElapsed = 0;
            if (timerDurationInput) timerDurationInput.disabled = false; 
        }
        
        timerRunning = true;
        if (startTimerButton) startTimerButton.style.display = 'none';
        if (pauseTimerButton) pauseTimerButton.style.display = 'inline-block';
        if (userWritingArea) userWritingArea.disabled = false; 

        timerInterval = setInterval(() => {
            if (isCountdown) {
                secondsElapsed--;
                if (secondsElapsed < 0) secondsElapsed = 0; 
                if (secondsElapsed === 0) {
                    pauseTimer(); 
                    alert("Time's up!");
                    if (userWritingArea) userWritingArea.disabled = true;
                    if (timerDurationInput) timerDurationInput.disabled = false;
                }
            } else { 
                secondsElapsed++;
            }
            updateTimerDisplay();
        }, 1000);
        updateTimerDisplay(); 
    };

    const pauseTimer = () => {
        if (!timerRunning) return;
        timerRunning = false;
        clearInterval(timerInterval);
        if (startTimerButton) startTimerButton.style.display = 'inline-block';
        if (pauseTimerButton) pauseTimerButton.style.display = 'none';
        
    };

    const resetTimer = () => {
        pauseTimer(); 
        
        
        
        if (isCountdown && initialCountdownSeconds > 0) {
            secondsElapsed = initialCountdownSeconds;
        } else {
            secondsElapsed = 0;
        }
        
        
        

        if (userWritingArea) userWritingArea.disabled = false;
        if (timerDurationInput) timerDurationInput.disabled = false;
        updateTimerDisplay();
    };

    const constructTopicPrompt = (style, keywords, gradeLevel) => {
        let prompt = `Generate a concise and engaging writing topic or prompt.`;
        if (style) {
            prompt += ` The desired style or genre is: "${style}".`;
        }
        if (keywords) {
            prompt += ` It should incorporate the following keywords or themes: "${keywords}".`;
        }
        if (gradeLevel) {
            prompt += ` Tailor the topic complexity, vocabulary, and themes for this approximate grade level: "${gradeLevel}".`;
        }
        prompt += ` The topic should be suitable for a creative writing exercise. Provide only the topic itself, no extra explanations or niceties.`;
        return prompt;
    };

    const handleTopicGeneration = async (event) => {
        event.preventDefault();
        const style = writingStyleInput.value.trim();
        const keywords = writingKeywordsInput.value.trim();
        const gradeLevel = writingGradeLevelInput.value.trim();
        const modelInputEl = writingModelInput; 
        const modelInputValue = modelInputEl.value.trim();
        const { defaultModel: savedDefaultModel } = Auth.getCredentials(); 
        const model = modelInputValue || savedDefaultModel || "gpt-4.1";

        const generateButton = topicGenerationForm.querySelector('button[type="submit"]');
        generateButton.disabled = true;
        generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        if(generatedTopicBox) generatedTopicBox.style.display = 'none';
        if(generatedTopicText) generatedTopicText.textContent = '';
        if(feedbackOutput) feedbackOutput.innerHTML = '';
        if(diffOutput) diffOutput.style.display = 'none';
        if(diffPre) diffPre.innerHTML = '';
        if(userWritingArea) userWritingArea.value = ''; 

        const prompt = constructTopicPrompt(style, keywords, gradeLevel);

        try {
            
            if (generatedTopicBox) {
                 generatedTopicBox.style.display = 'block'; 
                 generatedTopicText.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Generating topic...</p>';
            }
            
            let accumulatedTopic = '';
            const onProgressCallback = (chunk) => {
                accumulatedTopic += chunk;
                if (generatedTopicText) {
                    generatedTopicText.textContent = accumulatedTopic; 
                }
            };

            const topic = await Api.generateWritingTopic(prompt, model, onProgressCallback); 
            
            if (topic) {
                currentTopicDetails = { text: topic.trim(), gradeLevel: gradeLevel };
                if (generatedTopicText) generatedTopicText.textContent = currentTopicDetails.text;
                if (generatedTopicBox) generatedTopicBox.style.display = 'block';
                document.getElementById('writing-practice-section').style.display = 'block';
                if (userWritingArea) {
                    userWritingArea.disabled = false; 
                    userWritingArea.focus();
                }
                resetTimer(); 
            } else {
                if (generatedTopicText) generatedTopicText.textContent = 'Failed to generate topic.';
                if (generatedTopicBox) generatedTopicBox.style.display = 'block';
            }
        } catch (error) {
            console.error("Error generating writing topic:", error);
            if (generatedTopicText) generatedTopicText.textContent = `Error: ${error.message}`;
            if (generatedTopicBox) generatedTopicBox.style.display = 'block';
        } finally {
            generateButton.disabled = false;
            generateButton.innerHTML = '<i class="fas fa-magic"></i> Generate Topic';
        }
    };
    
    const constructFeedbackPrompt = (topic, userText, gradeLevel) => {
        let context = `
The user was given the following writing topic:
<topic>
${topic}
</topic>

The user wrote the following text:`;
        if (gradeLevel) {
            context += `\nThe user was writing for this approximate grade level: "${gradeLevel}". Please tailor your feedback (e.g., complexity of suggestions, vocabulary used in feedback) to be appropriate for this level.`;
        }
        return `${context}
<user_text>
${userText}
</user_text>

You are an AI writing assistant. Please provide feedback on the user's text.
Your feedback should be constructive and aim to help the user improve their writing.
Structure your feedback in XML format with a root tag <writingFeedback>.
Inside <writingFeedback>, include:
1.  A <generalFeedback> tag: Overall comments on coherence, engagement, style, and adherence to the topic. Use Markdown for formatting.
2.  A <specificSuggestions> tag: Bullet points or specific examples of areas for improvement (e.g., grammar, vocabulary, sentence structure). Use Markdown.
3.  An optional <revisedText> tag: If you think significant revisions would be beneficial, provide a revised version of the user's text. This can be a partial or full revision. Output this as plain text (or CDATA if needed for XML safety).
4.  An optional <diffView> tag: If <revisedText> is provided, also provide a textual diff view comparing the original <user_text> and your <revisedText>.
    Use a line-by-line comparison format. Prefix added lines with "+ ", removed lines with "- ", and unchanged lines with "  " (two spaces).
    Example of <diffView> content:
    <diffView><![CDATA[
- The quick brown fox jumpd over the lazy dog.
+ The quick brown fox jumped over the lazy dog.
  This is another sentence that remains the same.
+ This is a new sentence added by the AI.
    ]]></diffView>

Example:
<writingFeedback>
  <generalFeedback>
    Your response to the topic is creative and shows good imagination. The narrative flows fairly well.
    You could strengthen the descriptive language to make the scenes more vivid.
  </generalFeedback>
  <specificSuggestions>
    -   Consider using stronger verbs in the second paragraph.
    -   There's a minor subject-verb agreement issue in the sentence: "The cats plays." It should be "The cats play."
    -   Try to vary your sentence structure more; many sentences start with "Then...".
  </specificSuggestions>
  <revisedText><![CDATA[The old oak tree stood sentinel at the edge of the whispering woods. Its branches, gnarled and ancient, reached towards the bruised twilight sky... (etc.)]]></revisedText>
  <diffView><![CDATA[
- The user's original text line 1 that was changed.
+ The AI's revised version of line 1.
  A line that was kept the same.
+ A new line added by the AI.
  ]]></diffView>
</writingFeedback>

Ensure all text content within XML tags is properly escaped if necessary, or use CDATA sections for larger text blocks like <revisedText> and <diffView>.
Focus on providing helpful, actionable feedback.
`;
    };


    const handleFeedbackSubmission = async () => {
        const userText = userWritingArea.value.trim();
        if (!currentTopicDetails || !currentTopicDetails.text || !userText) {
            alert("Please generate a topic and write something before requesting feedback.");
            return;
        }
        pauseTimer(); 

        submitWritingButton.disabled = true;
        submitWritingButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting Feedback...';

        if(feedbackOutput) feedbackOutput.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Analyzing your writing and generating feedback...</p>';
        if(diffOutput) diffOutput.style.display = 'none';
        if(diffPre) diffPre.innerHTML = '';
        document.getElementById('feedback-display-section').style.display = 'block';
        
        const { defaultModel: savedDefaultModel, apiKey } = Auth.getCredentials();
        const modelInputEl = writingModelInput; 
        const modelInputValue = modelInputEl ? modelInputEl.value.trim() : '';
        const model = modelInputValue || savedDefaultModel || "gpt-4.1";

        const prompt = constructFeedbackPrompt(currentTopicDetails.text, userText, currentTopicDetails.gradeLevel);

        try {
            let accumulatedFeedbackXml = '';
            const streamingFeedbackPre = document.createElement('pre');
            streamingFeedbackPre.id = `streaming-feedback-xml-pre`;
            streamingFeedbackPre.style.whiteSpace = 'pre-wrap';
            streamingFeedbackPre.style.border = '1px dashed #ccc';
            streamingFeedbackPre.style.padding = '10px';
            streamingFeedbackPre.style.maxHeight = '200px';
            streamingFeedbackPre.style.overflowY = 'auto';
            streamingFeedbackPre.style.marginTop = '10px';
            streamingFeedbackPre.textContent = 'Streaming feedback XML data...\n';
            if (feedbackOutput) {
                feedbackOutput.innerHTML = ''; 
                feedbackOutput.appendChild(streamingFeedbackPre);
            }

            const onProgressCallback = (chunk) => {
                accumulatedFeedbackXml += chunk;
                streamingFeedbackPre.textContent += chunk;
                streamingFeedbackPre.scrollTop = streamingFeedbackPre.scrollHeight;
            };
            
            const feedbackXml = await Api.generateWritingFeedback(prompt, model, onProgressCallback); 

            if (feedbackOutput && feedbackOutput.contains(streamingFeedbackPre)) {
                feedbackOutput.removeChild(streamingFeedbackPre); 
            }

            if (feedbackXml) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(feedbackXml, "text/xml");
                const errorNode = xmlDoc.querySelector("parsererror");

                if (errorNode) {
                    console.error("Error parsing feedback XML:", errorNode.textContent);
                    feedbackOutput.innerHTML = `<p class="error">Error processing AI feedback. Invalid XML received.</p><pre>${feedbackXml.replace(/</g, "&lt;")}</pre>`;
                } else {
                    const generalFeedback = xmlDoc.querySelector("generalFeedback")?.textContent;
                    const specificSuggestions = xmlDoc.querySelector("specificSuggestions")?.textContent;
                    const revisedTextNode = xmlDoc.querySelector("revisedText");
                    const revisedText = revisedTextNode ? revisedTextNode.textContent : null; 
                    const diffViewNode = xmlDoc.querySelector("diffView");
                    const aiGeneratedDiff = diffViewNode ? diffViewNode.textContent : null;

                    let htmlFeedback = "";
                    if (generalFeedback) {
                        htmlFeedback += `<h4>General Feedback:</h4><div>${Utils.customMarkdownParse(generalFeedback)}</div>`;
                    }
                    if (specificSuggestions) {
                        htmlFeedback += `<h4>Specific Suggestions:</h4><div>${Utils.customMarkdownParse(specificSuggestions)}</div>`;
                    }
                    if (!htmlFeedback && !aiGeneratedDiff) { 
                        htmlFeedback = "<p>No structured feedback or diff view received. Displaying raw XML:</p><pre>" + feedbackXml.replace(/</g, "&lt;") + "</pre>";
                    } else if (!htmlFeedback && aiGeneratedDiff) { 
                         htmlFeedback = "<p>No specific textual feedback received, but a diff view is available.</p>";
                    }
                    feedbackOutput.innerHTML = htmlFeedback;

                    if (aiGeneratedDiff && diffPre && diffOutput) {
                        let diffHtml = '';
                        aiGeneratedDiff.split('\n').forEach(line => {
                            const trimmedLine = line.trimEnd(); 
                            if (trimmedLine.startsWith('+ ')) {
                                diffHtml += `<span class="diff-inserted">${trimmedLine.substring(2)}</span>\n`;
                            } else if (trimmedLine.startsWith('- ')) {
                                diffHtml += `<span class="diff-deleted">${trimmedLine.substring(2)}</span>\n`;
                            } else if (trimmedLine.startsWith('  ')) { 
                                diffHtml += `<span class="diff-unchanged">${trimmedLine.substring(2)}</span>\n`;
                            } else if (trimmedLine.trim() !== '') { 
                                diffHtml += `${trimmedLine}\n`;
                            } else {
                                diffHtml += '\n'; 
                            }
                        });
                        diffPre.innerHTML = diffHtml;
                        diffOutput.style.display = 'block';
                    } else if (revisedText && diffPre && diffOutput) {
                        
                        diffPre.innerHTML = `<span class="diff-inserted">${Utils.escapeHtml(revisedText)}</span>`;
                        diffOutput.style.display = 'block';
                         diffOutput.querySelector('h3').textContent = "AI Suggested Revision (no diff view provided)";
                    }
                    
                    
                    
                    const durationToSave = isCountdown ? initialCountdownSeconds - secondsElapsed : secondsElapsed;
                    const setTimerDurationMinutes = isCountdown ? initialCountdownSeconds / 60 : null;
                    saveToHistory(currentTopicDetails.text, userText, feedbackXml, revisedText, aiGeneratedDiff, durationToSave, currentTopicDetails.gradeLevel, setTimerDurationMinutes);
                }
            } else {
                feedbackOutput.innerHTML = '<p class="error">Failed to get feedback from AI.</p>';
            }
        } catch (error) {
            console.error("Error getting writing feedback:", error);
            feedbackOutput.innerHTML = `<p class="error">Error: ${error.message}</p>`;
        } finally {
            submitWritingButton.disabled = false;
            submitWritingButton.innerHTML = '<i class="fas fa-paper-plane"></i> Get Feedback';
        }
    };
    
    const saveToHistory = (topic, userWriting, feedbackXml, revisedText, aiGeneratedDiff, actualDuration, gradeLevel, setTimerMinutes) => {
        const history = loadHistory();
        const newEntry = {
            id: new Date().getTime(),
            date: new Date().toISOString(),
            topic: topic,
            userWriting: userWriting,
            feedbackXml: feedbackXml, 
            revisedText: revisedText, 
            aiGeneratedDiff: aiGeneratedDiff, 
            duration: actualDuration, 
            gradeLevel: gradeLevel, 
            setTimerMinutes: setTimerMinutes, 
            model: (writingModelInput ? writingModelInput.value.trim() : null) || Auth.getCredentials().defaultModel || "gpt-4.1"
        };
        history.unshift(newEntry);
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 20))); 
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
            historyList.innerHTML = '<li>No writing practice sessions in history yet.</li>';
            return;
        }

        history.forEach(item => {
            const li = document.createElement('li');
            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'history-details';

            const topicSpan = document.createElement('span');
            topicSpan.className = 'history-prompt'; 
            let topicText = `Topic: "${item.topic.substring(0,50)}${item.topic.length > 50 ? "..." : ""}"`;
            if (item.gradeLevel) {
                topicText += ` (Grade: ${item.gradeLevel})`;
            }
            topicText += ` (Model: ${item.model || 'N/A'})`;
            topicSpan.textContent = topicText;
            
            const metaSpan = document.createElement('span');
            metaSpan.className = 'history-meta';
            let durationText = `On: ${Utils.formatDate(item.date)} - Duration: ${formatTime(item.duration || 0)}`;
            if (item.setTimerMinutes) {
                durationText += ` (Timer Set: ${item.setTimerMinutes}m)`;
            }
            metaSpan.textContent = durationText;

            detailsDiv.appendChild(topicSpan);
            detailsDiv.appendChild(metaSpan);

            const buttonDiv = document.createElement('div');
            buttonDiv.className = 'history-buttons';

            const viewButton = document.createElement('button');
            viewButton.textContent = 'View';
            viewButton.className = 'view-history-btn';
            viewButton.addEventListener('click', () => {
                currentTopicDetails = { text: item.topic, gradeLevel: item.gradeLevel };
                if(generatedTopicText) generatedTopicText.textContent = currentTopicDetails.text;
                if(writingGradeLevelInput) writingGradeLevelInput.value = currentTopicDetails.gradeLevel || '';
                if(generatedTopicBox) generatedTopicBox.style.display = 'block';
                if(userWritingArea) {
                    userWritingArea.value = item.userWriting;
                    userWritingArea.disabled = false;
                }
                if(timerDurationInput) timerDurationInput.value = item.setTimerMinutes || '';
                
                
                if(feedbackOutput) feedbackOutput.innerHTML = ''; 
                if(diffOutput) diffOutput.style.display = 'none';
                if(diffPre) diffPre.innerHTML = '';

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(item.feedbackXml, "text/xml");
                const generalFeedback = xmlDoc.querySelector("generalFeedback")?.textContent;
                const specificSuggestions = xmlDoc.querySelector("specificSuggestions")?.textContent;
                
                let htmlFeedback = "";
                if (generalFeedback) htmlFeedback += `<h4>General Feedback:</h4><div>${Utils.customMarkdownParse(generalFeedback)}</div>`;
                if (specificSuggestions) htmlFeedback += `<h4>Specific Suggestions:</h4><div>${Utils.customMarkdownParse(specificSuggestions)}</div>`;
                if (feedbackOutput) feedbackOutput.innerHTML = htmlFeedback || "<p>No feedback content found in this history item.</p>";

                if (item.aiGeneratedDiff && diffPre && diffOutput) {
                    let diffHtml = '';
                    item.aiGeneratedDiff.split('\n').forEach(line => {
                        const trimmedLine = line.trimEnd();
                        if (trimmedLine.startsWith('+ ')) {
                            diffHtml += `<span class="diff-inserted">${trimmedLine.substring(2)}</span>\n`;
                        } else if (trimmedLine.startsWith('- ')) {
                            diffHtml += `<span class="diff-deleted">${trimmedLine.substring(2)}</span>\n`;
                        } else if (trimmedLine.startsWith('  ')) {
                            diffHtml += `<span class="diff-unchanged">${trimmedLine.substring(2)}</span>\n`;
                        } else if (trimmedLine.trim() !== '') {
                            diffHtml += `${trimmedLine}\n`;
                        } else {
                            diffHtml += '\n';
                        }
                    });
                    diffPre.innerHTML = diffHtml;
                    diffOutput.style.display = 'block';
                    if (diffOutput.querySelector('h3')) {
                         diffOutput.querySelector('h3').textContent = "Suggested Changes (Diff View)";
                    }
                } else if (item.revisedText && diffPre && diffOutput) {
                    
                     diffPre.innerHTML = `<span class="diff-inserted">${Utils.escapeHtml(item.revisedText)}</span>`;
                     diffOutput.style.display = 'block';
                     if (diffOutput.querySelector('h3')) {
                        diffOutput.querySelector('h3').textContent = "AI Suggested Revision (no diff view provided)";
                     }
                }
                
                document.getElementById('writing-setup-section').style.display = 'block';
                document.getElementById('writing-practice-section').style.display = 'block';
                document.getElementById('feedback-display-section').style.display = 'block';
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                
                pauseTimer(); 
                if (item.setTimerMinutes && parseInt(item.setTimerMinutes, 10) > 0) {
                    isCountdown = true;
                    initialCountdownSeconds = parseInt(item.setTimerMinutes, 10) * 60;
                    
                    
                    secondsElapsed = initialCountdownSeconds; 
                } else {
                    isCountdown = false;
                    initialCountdownSeconds = 0;
                    secondsElapsed = item.duration || 0; 
                }
                if (timerDurationInput) timerDurationInput.disabled = false;
                if (userWritingArea) userWritingArea.disabled = false; 
                updateTimerDisplay();


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

    const deleteFromHistory = (itemId) => {
        if (confirm("Are you sure you want to delete this writing session from history?")) {
            let history = loadHistory();
            history = history.filter(item => item.id !== itemId);
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
            renderHistory();
        }
    };


    const init = () => {
        topicGenerationForm = document.getElementById('topic-generation-form');
        writingStyleInput = document.getElementById('writing-style');
        writingKeywordsInput = document.getElementById('writing-keywords');
        writingGradeLevelInput = document.getElementById('writing-grade-level');
        writingModelInput = document.getElementById('writing-model'); 
        
        generatedTopicBox = document.getElementById('generated-topic-box');
        generatedTopicText = document.getElementById('generated-topic-text');
        
        userWritingArea = document.getElementById('user-writing-area');
        timerDurationInput = document.getElementById('timer-duration-input');
        
        startTimerButton = document.getElementById('start-timer-button');
        pauseTimerButton = document.getElementById('pause-timer-button');
        resetTimerButton = document.getElementById('reset-timer-button');
        timerDisplay = document.getElementById('timer-display');
        
        submitWritingButton = document.getElementById('submit-writing-button');
        feedbackOutput = document.getElementById('feedback-output');
        diffOutput = document.getElementById('diff-output');
        diffPre = document.getElementById('diff-pre');
        copyFeedbackButton = document.getElementById('copy-feedback-button');
        
        historyList = document.getElementById('writing-history-list');

        
        if (topicGenerationForm) {
            topicGenerationForm.addEventListener('submit', handleTopicGeneration);
        }
        if (startTimerButton) startTimerButton.addEventListener('click', startTimer);
        if (pauseTimerButton) pauseTimerButton.addEventListener('click', pauseTimer);
        if (resetTimerButton) resetTimerButton.addEventListener('click', resetTimer);
        if (submitWritingButton) submitWritingButton.addEventListener('click', handleFeedbackSubmission);

        if (copyFeedbackButton && feedbackOutput) {
            copyFeedbackButton.addEventListener('click', () => {
                
                let textToCopy = "AI Feedback:\n\n";
                
                
                const generalFeedbackText = feedbackOutput.querySelector("div:nth-of-type(1)")?.innerText || "";
                const specificSuggestionsText = feedbackOutput.querySelector("div:nth-of-type(2)")?.innerText || "";
                
                if (generalFeedbackText.trim()) {
                    textToCopy += "General Feedback:\n" + generalFeedbackText.trim() + "\n\n";
                }
                if (specificSuggestionsText.trim()) {
                    textToCopy += "Specific Suggestions:\n" + specificSuggestionsText.trim() + "\n\n";
                }

                if (diffPre && diffOutput && diffOutput.style.display !== 'none' && diffPre.innerText.trim()) {
                    textToCopy += "Suggested Changes (Diff):\n" + diffPre.innerText.trim() + "\n";
                }
                
                if (textToCopy.length <= "AI Feedback:\n\n".length) { 
                   textToCopy = feedbackOutput.innerText; 
                }

                Utils.copyToClipboard(textToCopy.trim(), "Feedback copied to clipboard!");
            });
        }

        
        
        
        const { apiKey } = Auth.getCredentials();
        if (apiKey) {
            document.getElementById('writing-setup-section').style.display = 'block';
            
            const { defaultModel: savedDefaultModel } = Auth.getCredentials();
             if (writingModelInput) {
                if (savedDefaultModel) {
                    writingModelInput.placeholder = `Default: ${savedDefaultModel} (leave empty to use)`;
                } else {
                    writingModelInput.placeholder = `gpt-4.1 (default system fallback)`;
                }
            }
        } else {
            document.getElementById('credentials-prompt-section').style.display = 'block';
            document.getElementById('writing-setup-section').style.display = 'none';
        }
        document.getElementById('writing-practice-section').style.display = 'none';
        document.getElementById('feedback-display-section').style.display = 'none';

        updateTimerDisplay();
        renderHistory();
    };

    return {
        init
    };
})();
