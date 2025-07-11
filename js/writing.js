
const Writing = (() => {
    
    // New note generator fields
    let noteTopicInput, noteWordCountInput, noteGradeLevelInput, generateTopicButton;

    let topicGenerationForm, writingStyleInput, writingKeywordsInput, writingGradeLevelInput, writingModelInput,
        generatedTopicBox, generatedTopicText,
        userWritingArea,
        timerDurationInput, 
        startTimerButton, pauseTimerButton, resetTimerButton, timerDisplay,
        submitWritingButton,
        feedbackOutput, diffOutput, diffPre, copyFeedbackButton,
        revisedTextOutput,
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
        event.preventDefault && event.preventDefault();
        const modelInputEl = writingModelInput; 
        const modelInputValue = modelInputEl.value.trim();
        const { defaultModel: savedDefaultModel } = Auth.getCredentials(); 
        const model = modelInputValue || savedDefaultModel || "gpt-4.1";

        const generateButton = generateTopicButton;
        if (generateButton) {
            generateButton.disabled = true;
            generateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        }

        if(generatedTopicBox) generatedTopicBox.style.display = 'none';
        if(generatedTopicText) generatedTopicText.textContent = '';
        if(feedbackOutput) feedbackOutput.innerHTML = '';
        if(diffOutput) diffOutput.style.display = 'none';
        if(diffPre) diffPre.innerHTML = '';
        if(userWritingArea) userWritingArea.value = ''; 

        // Use a generic prompt for AI topic generation
        const prompt = constructTopicPrompt("", "", "");

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
                if (noteTopicInput) noteTopicInput.value = topic.trim();
                if (generatedTopicText) generatedTopicText.textContent = topic.trim();
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
            if (generateButton) {
                generateButton.disabled = false;
                generateButton.innerHTML = '<i class="fas fa-magic"></i> Let AI generate a topic!';
            }
        }
    };
    
    const constructFeedbackPrompt = (topic, userText, gradeLevel, wordCount) => {
        let context = `
The user was given the following topic:
<topic>
${topic}
</topic>`;
        if (wordCount) {
            context += `\nThe user was asked to write approximately ${wordCount} words.`;
        }
        if (gradeLevel) {
            context += `\nThe user wrote this at an approximate grade level: "${gradeLevel}".`;
        }
        context += `

<user_text>
${userText}
</user_text>

You are an AI writing tutor. Please grade the user's text:
- Assess coherence, grammar, style.
- Check if it meets the topic and approximate length.
- Provide a score out of 10 and brief justification.
`;
        return context;
    };


    const handleFeedbackSubmission = async () => {
        const topic      = noteTopicInput.value.trim();
        const wordCount  = parseInt(noteWordCountInput.value, 10) || 0;
        const gradeLevel = noteGradeLevelInput.value.trim();
        const userText   = userWritingArea.value.trim();
        if (!topic || !userText) {
            alert("Please set a title and write something before grading.");
            return;
        }
        pauseTimer();

        // Show feedback section and spinner
        document.getElementById('feedback-display-section').style.display = 'block';
        feedbackOutput.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Grading your writing...</p>';
        if(revisedTextOutput) revisedTextOutput.innerHTML = '';
        if(diffPre) diffPre.innerHTML = '';


        // Scroll to feedback section
        document.getElementById('feedback-display-section').scrollIntoView({ behavior: 'smooth' });

        // Construct prompt and call API
        const prompt = constructFeedbackPrompt(topic, userText, gradeLevel, wordCount);
        const modelInputValue = writingModelInput.value.trim();
        const { defaultModel: savedDefaultModel } = Auth.getCredentials(); 
        const model = modelInputValue || savedDefaultModel || "gpt-4.1";

        try {
            let accumulatedFeedback = '';
            const onProgressCallback = (chunk) => {
                accumulatedFeedback += chunk;
                // Since feedback is complex XML, we can't render progress easily.
                // We'll just show a generic message.
                // feedbackOutput.innerHTML = `<p><i class="fas fa-spinner fa-spin"></i> Receiving feedback stream...</p>`;
            };

            const fullResponse = await Api.generateWritingFeedback(prompt, model, onProgressCallback);

            // Parse XML response
            let feedbackHtml = '';
            let improvedText = '';
            let highlightsHtml = '';
            let revisedTextForHistory = '';

            if (fullResponse) {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(`<root>${fullResponse}</root>`, "text/xml");
                const analysisNode = xmlDoc.querySelector("writingAnalysis");

                if (analysisNode) {
                    // 1. Summary
                    const summaryNode = analysisNode.querySelector("summary");
                    if (summaryNode) {
                        const score = summaryNode.querySelector("score")?.textContent || "N/A";
                        const justification = summaryNode.querySelector("justification")?.textContent || "No justification provided.";
                        feedbackHtml += `<div class="feedback-analysis-section"><h4><i class="fas fa-chart-bar"></i> Summary</h4><p><strong>Score:</strong> ${score}</p><p>${Utils.customMarkdownParse(justification)}</p></div>`;
                    }

                    // Helper function to build sections
                    const buildSection = (title, iconClass, items) => {
                        if (!items || items.length === 0) return '';
                        let sectionHtml = `<div class="feedback-analysis-section"><h4><i class="${iconClass}"></i> ${title}</h4><ul>`;
                        items.forEach(item => {
                            sectionHtml += `<li>${Utils.customMarkdownParse(item.textContent)}</li>`;
                        });
                        sectionHtml += `</ul></div>`;
                        return sectionHtml;
                    };

                    // 2. Grammar, Style, Vocabulary
                    feedbackHtml += buildSection('Grammar', 'fas fa-spell-check', analysisNode.querySelectorAll("grammar > issue"));
                    feedbackHtml += buildSection('Style', 'fas fa-palette', analysisNode.querySelectorAll("style > issue"));
                    feedbackHtml += buildSection('Vocabulary', 'fas fa-book-open', analysisNode.querySelectorAll("vocabulary > suggestion"));

                    // 5. Improved Text for "Full Revision" tab
                    improvedText = analysisNode.querySelector("improvedText")?.textContent || "No revised text provided.";
                    revisedTextForHistory = improvedText;

                    // 6. Highlight Changes for "Line-by-Line" tab
                    const highlightNode = analysisNode.querySelector("highlightChanges");
                    if (highlightNode) {
                        const changeElements = highlightNode.querySelectorAll("change");
                        changeElements.forEach(change => {
                            const original = change.querySelector("original")?.textContent || "";
                            let revised = "";
                            const revisedNode = change.querySelector("revised");
                            if (revisedNode) {
                                let tempDiv = document.createElement("div");
                                Array.from(revisedNode.childNodes).forEach(n => tempDiv.appendChild(n.cloneNode(true)));
                                revised = tempDiv.innerHTML;
                            }
                            highlightsHtml += `<div class="highlight-block"><div class="original">${Utils.escapeHtml(original)}</div><div class="revised">${revised}</div></div>`;
                        });
                    }
                } else {
                    // Fallback for non-XML or old format response
                    feedbackHtml = `<div class="ai-feedback">${Utils.customMarkdownParse(fullResponse)}</div>`;
                    improvedText = 'Could not parse revised text from response.';
                }
            }

            // Display feedback
            feedbackOutput.innerHTML = feedbackHtml || "<p>No analytical feedback was provided.</p>";
            if (revisedTextOutput) {
                revisedTextOutput.innerHTML = Utils.customMarkdownParse(improvedText);
            }
            diffPre.innerHTML = highlightsHtml || "<p>No line-by-line suggestions were provided.</p>";

            // Activate the first tab by default
            const firstTabButton = document.querySelector('.tab-button');
            if(firstTabButton) firstTabButton.click();

            // Save to history
            saveToHistory(
                topic,
                userText,
                fullResponse, // Save the raw XML response
                revisedTextForHistory,
                highlightsHtml, // The generated HTML for highlights
                secondsElapsed,
                gradeLevel,
                timerDurationInput.value
            );
        } catch (error) {
            console.error("Error generating feedback:", error);
            feedbackOutput.innerHTML = `<p>Error generating feedback: ${error.message}</p>`;
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
                if(diffPre) diffPre.innerHTML = '';
                if(revisedTextOutput) revisedTextOutput.innerHTML = '';

                let feedbackHtml = '';
                let improvedText = '';
                let highlightsHtml = '';

                if (item.feedbackXml) {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(`<root>${item.feedbackXml}</root>`, "text/xml");
                    const analysisNode = xmlDoc.querySelector("writingAnalysis");

                    if (analysisNode) {
                        const summaryNode = analysisNode.querySelector("summary");
                        if (summaryNode) {
                            const score = summaryNode.querySelector("score")?.textContent || "N/A";
                            const justification = summaryNode.querySelector("justification")?.textContent || "No justification provided.";
                            feedbackHtml += `<div class="feedback-analysis-section"><h4><i class="fas fa-chart-bar"></i> Summary</h4><p><strong>Score:</strong> ${score}</p><p>${Utils.customMarkdownParse(justification)}</p></div>`;
                        }
                        const buildSection = (title, iconClass, items) => {
                            if (!items || items.length === 0) return '';
                            let sectionHtml = `<div class="feedback-analysis-section"><h4><i class="${iconClass}"></i> ${title}</h4><ul>`;
                            items.forEach(item => { sectionHtml += `<li>${Utils.customMarkdownParse(item.textContent)}</li>`; });
                            sectionHtml += `</ul></div>`;
                            return sectionHtml;
                        };
                        feedbackHtml += buildSection('Grammar', 'fas fa-spell-check', analysisNode.querySelectorAll("grammar > issue"));
                        feedbackHtml += buildSection('Style', 'fas fa-palette', analysisNode.querySelectorAll("style > issue"));
                        feedbackHtml += buildSection('Vocabulary', 'fas fa-book-open', analysisNode.querySelectorAll("vocabulary > suggestion"));
                        
                        improvedText = analysisNode.querySelector("improvedText")?.textContent || item.revisedText || "No revised text found in history.";
                        
                        // For history, aiGeneratedDiff *is* the highlightsHtml.
                        highlightsHtml = item.aiGeneratedDiff || '<p>No highlighting suggestions found in this history item.</p>';

                    } else {
                        // Fallback for old history items
                        feedbackHtml = `<div class="ai-feedback">${Utils.customMarkdownParse(item.feedbackXml)}</div>`;
                        improvedText = item.revisedText || 'No revised text found in this old history item.';
                        highlightsHtml = item.aiGeneratedDiff || '<p>No highlighting suggestions found in this old history item.</p>';
                    }
                }
                
                if (feedbackOutput) feedbackOutput.innerHTML = feedbackHtml || "<p>No feedback content found in this history item.</p>";
                if (revisedTextOutput) revisedTextOutput.innerHTML = Utils.customMarkdownParse(improvedText);
                if (diffPre) diffPre.innerHTML = highlightsHtml;
                
                document.getElementById('writing-setup-section').style.display = 'block';
                document.getElementById('writing-practice-section').style.display = 'block';
                document.getElementById('feedback-display-section').style.display = 'block';
                
                // Set the first tab to be active
                document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                const assessmentButton = document.querySelector('.tab-button[data-tab="assessment"]');
                const assessmentTab = document.getElementById('assessment-tab');
                if (assessmentButton) assessmentButton.classList.add('active');
                if (assessmentTab) assessmentTab.classList.add('active');

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
        // New note generator fields
        noteTopicInput        = document.getElementById('note-topic');
        noteWordCountInput    = document.getElementById('note-word-count');
        noteGradeLevelInput   = document.getElementById('note-grade-level');
        generateTopicButton   = document.getElementById('generate-topic-button');

        topicGenerationForm   = document.getElementById('topic-generation-form');
        writingStyleInput     = document.getElementById('writing-style');
        writingKeywordsInput  = document.getElementById('writing-keywords');
        writingGradeLevelInput= document.getElementById('writing-grade-level');
        writingModelInput     = document.getElementById('writing-model'); 
        
        generatedTopicBox     = document.getElementById('generated-topic-box');
        generatedTopicText    = document.getElementById('generated-topic-text');
        
        userWritingArea       = document.getElementById('user-writing-area');
        timerDurationInput    = document.getElementById('timer-duration-input');
        
        startTimerButton      = document.getElementById('start-timer-button');
        pauseTimerButton      = document.getElementById('pause-timer-button');
        resetTimerButton      = document.getElementById('reset-timer-button');
        timerDisplay          = document.getElementById('timer-display');
        
        submitWritingButton   = document.getElementById('submit-writing-button');
        feedbackOutput        = document.getElementById('feedback-output');
        diffOutput            = document.getElementById('diff-output');
        diffPre               = document.getElementById('diff-pre');
        revisedTextOutput     = document.getElementById('revised-text-output');
        copyFeedbackButton    = document.getElementById('copy-feedback-button');
        
        historyList           = document.getElementById('writing-history-list');

        // Only allow manual topic form submit for grading, not for topic generation
        if (topicGenerationForm) {
            topicGenerationForm.addEventListener('submit', e => {
                e.preventDefault();
                const title = noteTopicInput.value.trim();
                if (!title) {
                    alert('Please enter a title.');
                    return;
                }
                // hide title form, show writing space
                document.getElementById('writing-setup-section').style.display = 'none';
                document.getElementById('writing-practice-section').style.display = 'block';
                userWritingArea && userWritingArea.focus();
            });
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
                if (diffPre && diffPre.innerText.trim()) {
                    textToCopy += "Suggested Changes (Diff):\n" + diffPre.innerText.trim() + "\n";
                }
                if (textToCopy.length <= "AI Feedback:\n\n".length) { 
                   textToCopy = feedbackOutput.innerText; 
                }
                Utils.copyToClipboard(textToCopy.trim(), "Feedback copied to clipboard!");
            });
        }

        // Tab switching for feedback section
        if (document.getElementById('feedback-display-section')) {
            document.querySelectorAll('.tab-button').forEach(button => {
                button.addEventListener('click', () => {
                    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                    
                    button.classList.add('active');
                    document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
                });
            });
        }

        const { apiKey } = Auth.getCredentials();
        if (apiKey) {
            document.getElementById('writing-setup-section').style.display = 'block';
            document.getElementById('writing-practice-section').style.display = 'none';
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
            document.getElementById('writing-practice-section').style.display = 'none';
            document.getElementById('writing-setup-section').style.display = 'none';
        }
        document.getElementById('feedback-display-section').style.display = 'none';

        updateTimerDisplay();
        renderHistory();
    };

    return {
        init
    };
})();
