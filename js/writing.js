// js/writing.js - Writing Collaboration Tool

const Writing = (() => {
    // DOM Elements
    let writingSetupForm, writingPromptInput, gradeLevelSelect, timeLimitInput, modelInput;
    let writingLanguageSelect, wordCountTargetInput;
    let writingSessionSection, writingPromptDisplay, timerDisplay, timeRemaining;
    let writingArea, wordCount, wordCountTargetDisplay, finishEarlyButton;
    let feedbackSection, originalWritingDiv, aiFeedbackDiv, improvedWritingDiv;
    let finalWordCount, writingTimeTaken;
    let newSessionButton, saveFeedbackButton, printFeedbackButton;
    let tabButtons, tabPanes;
    let historyList;

    // Variables
    const HISTORY_STORAGE_KEY = 'writingHistory';
    let timer;
    let startTime;
    let totalTimeInSeconds;
    let originalText;
    let isTimerRunning = false;
    let wordCountTarget = 0;

    // Initialize the module
    const init = () => {
        // Setup form elements
        writingSetupForm = document.getElementById('writing-setup-form');
        writingPromptInput = document.getElementById('writing-prompt');
        gradeLevelSelect = document.getElementById('grade-level');
        timeLimitInput = document.getElementById('time-limit');
        modelInput = document.getElementById('model');
        writingLanguageSelect = document.getElementById('writing-language');
        wordCountTargetInput = document.getElementById('word-count-target');

        // Writing session elements
        writingSessionSection = document.getElementById('writing-session-section');
        writingPromptDisplay = document.getElementById('writing-prompt-display');
        timerDisplay = document.getElementById('timer-display');
        timeRemaining = document.getElementById('time-remaining');
        writingArea = document.getElementById('writing-area');
        wordCount = document.getElementById('word-count');
        wordCountTargetDisplay = document.getElementById('word-count-target-display');
        finishEarlyButton = document.getElementById('finish-early-button');

        // Feedback elements
        feedbackSection = document.getElementById('feedback-section');
        originalWritingDiv = document.getElementById('original-writing');
        aiFeedbackDiv = document.getElementById('ai-feedback');
        improvedWritingDiv = document.getElementById('improved-writing');
        finalWordCount = document.getElementById('final-word-count');
        writingTimeTaken = document.getElementById('writing-time-taken');
        newSessionButton = document.getElementById('new-session-button');
        saveFeedbackButton = document.getElementById('save-feedback-button');
        printFeedbackButton = document.getElementById('print-feedback-button');
        
        // Tab navigation
        tabButtons = document.querySelectorAll('.tab-button');
        tabPanes = document.querySelectorAll('.tab-pane');

        // History list
        historyList = document.getElementById('history-list');

        // Event listeners
        if (writingSetupForm) {
            writingSetupForm.addEventListener('submit', handleSetupSubmit);
        }

        if (writingArea) {
            writingArea.addEventListener('input', updateWordCount);
        }

        if (finishEarlyButton) {
            finishEarlyButton.addEventListener('click', endWritingSession);
        }

        // Tab navigation
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                switchTab(tabId);
            });
        });

        if (newSessionButton) {
            newSessionButton.addEventListener('click', resetApp);
        }

        if (saveFeedbackButton) {
            saveFeedbackButton.addEventListener('click', saveFeedback);
        }

        if (printFeedbackButton) {
            printFeedbackButton.addEventListener('click', printFeedback);
        }

        // Initialize history
        loadHistory();
        renderHistory();
        
        // Check for API credentials
        checkApiCredentials();
        
        // Update model placeholder if applicable
        updateModelPlaceholder();
    };

    // Check if API credentials are set
    const checkApiCredentials = () => {
        const credentials = Auth.loadCredentials();
        const credentialsPromptSection = document.getElementById('credentials-prompt-section');
        const writingSetupSection = document.getElementById('writing-setup-section');
        
        if (!credentials.apiKey) {
            if (credentialsPromptSection) credentialsPromptSection.style.display = 'block';
            if (writingSetupSection) writingSetupSection.style.display = 'none';
        } else {
            if (credentialsPromptSection) credentialsPromptSection.style.display = 'none';
            if (writingSetupSection) writingSetupSection.style.display = 'block';
        }
    };

    // Update the model input placeholder with default model if available
    const updateModelPlaceholder = () => {
        if (!modelInput) return;
        
        const { defaultModel } = Auth.loadCredentials();
        if (defaultModel) {
            modelInput.placeholder = `Default: ${defaultModel} (leave empty to use)`;
        } else {
            modelInput.placeholder = `gpt-4.1 (default system fallback)`;
        }
    };

    // Handle form submission to start writing session
    const handleSetupSubmit = async (event) => {
        event.preventDefault();
        
        // Get form values
        const userPrompt = writingPromptInput.value.trim();
        const gradeLevel = gradeLevelSelect.value;
        const timeLimit = parseInt(timeLimitInput.value, 10);
        const model = modelInput.value.trim() || null; // Use default if empty
        const writingLanguage = writingLanguageSelect.value;
        wordCountTarget = parseInt(wordCountTargetInput.value, 10) || 0;

        // Validate time limit
        if (isNaN(timeLimit) || timeLimit < 5 || timeLimit > 120) {
            alert('Please enter a valid time limit between 5 and 120 minutes.');
            return;
        }
        
        // Validate word count target if provided
        if (wordCountTarget !== 0 && (isNaN(wordCountTarget) || wordCountTarget < 50 || wordCountTarget > 5000)) {
            alert('Word count target should be between 50 and 5000 words.');
            return;
        }

        // Show loading state
        document.body.classList.add('loading');
        
        try {
            // If user didn't provide a prompt, generate one
            let finalPrompt = userPrompt;
            
            if (!userPrompt) {
                finalPrompt = await generateWritingPrompt(gradeLevel, model, writingLanguage);
            }
            
            // Start writing session
            startWritingSession(finalPrompt, timeLimit, wordCountTarget);
            
        } catch (error) {
            console.error('Error setting up writing session:', error);
            alert('Failed to set up writing session. Please try again.');
        } finally {
            document.body.classList.remove('loading');
        }
    };

    // Generate a writing prompt using the API
    const generateWritingPrompt = async (gradeLevel, model, language = 'English') => {
        const credentials = Auth.loadCredentials();
        
        if (!credentials.apiKey) {
            throw new Error('API credentials not found');
        }

        const gradeLevelText = getGradeLevelText(gradeLevel);
        
        const prompt = `Generate an engaging and educational writing prompt appropriate for ${gradeLevelText} students. The prompt should be in ${language}, clear, concise, and encourage creative or critical thinking. Make it a single paragraph (2-3 sentences).`;
        
        const requestBody = {
            prompt: prompt,
            model: model || credentials.defaultModel || 'gpt-4.1'
        };
        
        try {
            const response = await Api.makeRequest(requestBody);
            if (response && response.content) {
                return response.content.trim();
            } else {
                throw new Error('Invalid response from API');
            }
        } catch (error) {
            console.error('Error generating prompt:', error);
            throw error;
        }
    };

    // Convert grade level value to display text
    const getGradeLevelText = (gradeLevel) => {
        const gradeLevelMap = {
            'elementary': 'Elementary School (Grades 3-5)',
            'middle': 'Middle School (Grades 6-8)',
            'high': 'High School (Grades 9-12)',
            'college': 'College Level',
            'professional': 'Professional'
        };
        
        return gradeLevelMap[gradeLevel] || 'Middle School';
    };

    // Start the writing session with a prompt and timer
    const startWritingSession = (prompt, timeLimit, wordTarget = 0) => {
        // Hide setup section, show writing section
        document.getElementById('writing-setup-section').style.display = 'none';
        writingSessionSection.style.display = 'block';
        
        // Set the prompt
        writingPromptDisplay.textContent = prompt;
        
        // Set up the timer
        totalTimeInSeconds = timeLimit * 60;
        updateTimerDisplay(totalTimeInSeconds);
        
        // Set up word count target if provided
        if (wordTarget > 0 && wordCountTargetDisplay) {
            wordCountTargetDisplay.textContent = `Target: ${wordTarget} words`;
            wordCountTargetDisplay.style.display = 'block';
        } else if (wordCountTargetDisplay) {
            wordCountTargetDisplay.style.display = 'none';
        }
        
        // Start the timer
        startTime = new Date();
        isTimerRunning = true;
        timer = setInterval(() => {
            const elapsedSeconds = Math.floor((new Date() - startTime) / 1000);
            const remainingSeconds = totalTimeInSeconds - elapsedSeconds;
            
            if (remainingSeconds <= 0) {
                endWritingSession();
            } else {
                updateTimerDisplay(remainingSeconds);
                
                // Add warning class when less than 1 minute remains
                if (remainingSeconds <= 60 && !timeRemaining.classList.contains('timer-warning')) {
                    timeRemaining.classList.add('timer-warning');
                }
            }
        }, 1000);
        
        // Focus on the writing area
        writingArea.focus();
    };

    // Update the timer display
    const updateTimerDisplay = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timeRemaining.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    // Update word count as user types
    const updateWordCount = () => {
        const text = writingArea.value;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        wordCount.textContent = `${words} words`;
        
        // Update word count target status if target is set
        if (wordCountTarget > 0 && wordCountTargetDisplay) {
            const percentage = Math.floor((words / wordCountTarget) * 100);
            wordCountTargetDisplay.textContent = `Target: ${words}/${wordCountTarget} words (${percentage}%)`;
            
            // Remove any existing classes
            wordCountTargetDisplay.classList.remove('word-count-warning', 'word-count-success');
            
            // Add appropriate class based on progress
            if (words >= wordCountTarget) {
                wordCountTargetDisplay.classList.add('word-count-success');
            } else if (words < wordCountTarget * 0.5) {
                wordCountTargetDisplay.classList.add('word-count-warning');
            }
        }
    };

    // End the writing session and process feedback
    const endWritingSession = async () => {
        // Stop the timer
        clearInterval(timer);
        isTimerRunning = false;
        
        // Get the written text and other data
        originalText = writingArea.value.trim();
        const words = originalText ? originalText.split(/\s+/).length : 0;
        
        // Calculate time taken
        const endTime = new Date();
        const timeElapsed = Math.floor((endTime - startTime) / 1000); // in seconds
        const minutesTaken = Math.floor(timeElapsed / 60);
        const secondsTaken = timeElapsed % 60;
        
        // Show loading state
        document.body.classList.add('loading');
        
        try {
            // Get form values for API request
            const gradeLevel = gradeLevelSelect.value;
            const prompt = writingPromptDisplay.textContent;
            const model = modelInput.value.trim() || null; // Use default if empty
            const language = writingLanguageSelect.value;
            
            // Get feedback from AI
            const feedback = await getFeedback(originalText, prompt, gradeLevel, model, language);
            
            // Hide writing section, show feedback section
            writingSessionSection.style.display = 'none';
            feedbackSection.style.display = 'block';
            
            // Display original text with markdown formatting
            originalWritingDiv.innerHTML = marked.parse(originalText);
            
            // Update stats
            finalWordCount.textContent = `${words} words`;
            writingTimeTaken.textContent = `Time: ${minutesTaken}m ${secondsTaken}s`;
            
            // Display AI feedback and improved version
            if (feedback) {
                aiFeedbackDiv.innerHTML = marked.parse(feedback.feedback || 'No feedback provided.');
                improvedWritingDiv.innerHTML = marked.parse(feedback.improvedVersion || originalText);
                
                // Save to history
                saveToHistory(prompt, originalText, feedback, words, `${minutesTaken}m ${secondsTaken}s`);
            } else {
                aiFeedbackDiv.innerHTML = '<p>Failed to get AI feedback. Please try again.</p>';
                improvedWritingDiv.innerHTML = marked.parse(originalText);
            }
            
        } catch (error) {
            console.error('Error getting feedback:', error);
            alert('Failed to get feedback. Please try again.');
            
            // Still show the original writing even if feedback failed
            writingSessionSection.style.display = 'none';
            feedbackSection.style.display = 'block';
            originalWritingDiv.innerHTML = marked.parse(originalText);
            finalWordCount.textContent = `${words} words`;
            writingTimeTaken.textContent = `Time: ${minutesTaken}m ${secondsTaken}s`;
            
            aiFeedbackDiv.innerHTML = '<p>Failed to get AI feedback. Please try again.</p>';
            improvedWritingDiv.innerHTML = marked.parse(originalText);
        } finally {
            document.body.classList.remove('loading');
        }
    };

    // Get AI feedback on the written text
    const getFeedback = async (text, prompt, gradeLevel, model, language = 'English') => {
        if (!text || text.length < 10) {
            return {
                feedback: 'The text is too short to provide meaningful feedback.',
                improvedVersion: text
            };
        }
        
        const credentials = Auth.loadCredentials();
        
        if (!credentials.apiKey) {
            throw new Error('API credentials not found');
        }

        const gradeLevelText = getGradeLevelText(gradeLevel);
        const teacherType = language === 'English' ? 'English' : `${language} language`;
        
        const feedbackPrompt = `I wrote a response in ${language} to the following prompt: "${prompt}"\n\nMy writing:\n${text}\n\nPlease provide detailed feedback on my writing as if you were a ${teacherType} teacher for ${gradeLevelText} students. Evaluate:
1. Structure and organization
2. Grammar and mechanics
3. Content and ideas
4. Clarity and coherence
5. Style and vocabulary

Then, provide an improved version of my writing that addresses the issues you identified. Format your response in two sections:

===FEEDBACK===
[Your detailed feedback here in ${language}]

===IMPROVED VERSION===
[An improved version of my writing in ${language}]`;
        
        const requestBody = {
            prompt: feedbackPrompt,
            model: model || credentials.defaultModel || 'gpt-4.1'
        };
        
        try {
            const response = await Api.makeRequest(requestBody);
            if (response && response.content) {
                // Parse the response to extract feedback and improved version
                return parseAIResponse(response.content);
            } else {
                throw new Error('Invalid response from API');
            }
        } catch (error) {
            console.error('Error getting feedback:', error);
            throw error;
        }
    };

    // Parse the AI response to extract feedback and improved version
    const parseAIResponse = (content) => {
        const feedbackMatch = content.match(/===FEEDBACK===([\s\S]*?)(?:===IMPROVED VERSION===|$)/);
        const improvedMatch = content.match(/===IMPROVED VERSION===([\s\S]*)/);
        
        const feedback = feedbackMatch ? feedbackMatch[1].trim() : '';
        const improvedVersion = improvedMatch ? improvedMatch[1].trim() : '';
        
        return { feedback, improvedVersion };
    };

    // Switch between tabs in the feedback section
    const switchTab = (tabId) => {
        // Update active button
        tabButtons.forEach(button => {
            if (button.getAttribute('data-tab') === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update active tab content
        tabPanes.forEach(pane => {
            if (pane.id === `${tabId}-tab`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    };

    // Reset the app to start a new writing session
    const resetApp = () => {
        // Clear the writing area
        if (writingArea) writingArea.value = '';
        
        // Reset the form if needed
        if (writingSetupForm) writingSetupForm.reset();
        
        // Hide feedback section, show setup section
        feedbackSection.style.display = 'none';
        document.getElementById('writing-setup-section').style.display = 'block';
        
        // Remove warning class from timer
        if (timeRemaining) timeRemaining.classList.remove('timer-warning');
    };

    // Save the feedback to history
    const saveToHistory = (prompt, originalText, feedback, wordCount, timeTaken) => {
        const historyItems = loadHistory();
        // Save language and word count target for this session
        const language = writingLanguageSelect ? writingLanguageSelect.value : 'English';
        const newItem = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            prompt,
            originalText,
            feedback: feedback.feedback,
            improvedVersion: feedback.improvedVersion,
            wordCount,
            timeTaken,
            language,
            wordCountTarget
        };
        historyItems.unshift(newItem);
        // Limit history to 10 items
        if (historyItems.length > 10) {
            historyItems.pop();
        }
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyItems));
        renderHistory();
    };

    // Load writing history from local storage
    const loadHistory = () => {
        try {
            const historyJSON = localStorage.getItem(HISTORY_STORAGE_KEY);
            return historyJSON ? JSON.parse(historyJSON) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    };

    // Render history items
    const renderHistory = () => {
        if (!historyList) return;
        
        const historyItems = loadHistory();
        
        if (historyItems.length === 0) {
            historyList.innerHTML = '<li class="empty-history">No writing sessions saved yet.</li>';
            return;
        }
        
        historyList.innerHTML = '';
        
        historyItems.forEach(item => {
            const historyItemEl = document.createElement('li');
            historyItemEl.className = 'history-item';
            historyItemEl.innerHTML = `
                <div class="history-item-header">
                    <h3 class="history-prompt">${truncateText(item.prompt, 70)}</h3>
                    <span class="history-date">${item.date}</span>
                </div>
                <div class="history-item-stats">
                    <span><i class="fas fa-font"></i> ${item.wordCount} words</span>
                    <span><i class="fas fa-clock"></i> ${item.timeTaken}</span>
                    <span><i class="fas fa-language"></i> ${item.language || 'English'}</span>
                    ${item.wordCountTarget ? `<span><i class='fas fa-bullseye'></i> Target: ${item.wordCountTarget}</span>` : ''}
                </div>
                <div class="history-item-controls">
                    <button class="history-view-btn" data-id="${item.id}">View</button>
                    <button class="history-delete-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            historyList.appendChild(historyItemEl);
            
            // Add event listeners for view and delete buttons
            historyItemEl.querySelector('.history-view-btn').addEventListener('click', () => viewHistoryItem(item.id));
            historyItemEl.querySelector('.history-delete-btn').addEventListener('click', () => deleteHistoryItem(item.id));
        });
    };

    // Truncate text for display
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    // View a history item
    const viewHistoryItem = (id) => {
        const historyItems = loadHistory();
        const item = historyItems.find(item => item.id === id);
        
        if (!item) return;
        
        // Hide writing setup section, show feedback section
        document.getElementById('writing-setup-section').style.display = 'none';
        feedbackSection.style.display = 'block';
        
        // Set the content
        writingPromptDisplay.textContent = item.prompt;
        originalWritingDiv.innerHTML = marked.parse(item.originalText || '');
        aiFeedbackDiv.innerHTML = marked.parse(item.feedback || '');
        improvedWritingDiv.innerHTML = marked.parse(item.improvedVersion || '');
        
        // Update stats
        finalWordCount.textContent = `${item.wordCount} words`;
        writingTimeTaken.textContent = `Time: ${item.timeTaken}`;
        
        // Scroll to feedback section
        feedbackSection.scrollIntoView({ behavior: 'smooth' });
    };

    // Delete a history item
    const deleteHistoryItem = (id) => {
        if (!confirm('Are you sure you want to delete this writing session?')) return;
        
        const historyItems = loadHistory();
        const updatedItems = historyItems.filter(item => item.id !== id);
        
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedItems));
        
        // Refresh the history display
        renderHistory();
    };

    // Save feedback (export to text file)
    const saveFeedback = () => {
        const prompt = writingPromptDisplay.textContent;
        const original = originalWritingDiv.innerText;
        const feedback = aiFeedbackDiv.innerText;
        const improved = improvedWritingDiv.innerText;
        
        const content = `# Writing Session
        
## Prompt
${prompt}

## Original Writing
${original}

## Feedback
${feedback}

## Improved Version
${improved}
`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `writing_feedback_${new Date().toISOString().slice(0, 10)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Print all feedback content
    const printFeedback = () => {
        const prompt = writingPromptDisplay.textContent;
        const original = originalWritingDiv.innerHTML;
        const feedback = aiFeedbackDiv.innerHTML;
        const improved = improvedWritingDiv.innerHTML;
        
        // Create print window
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Writing Feedback</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
                    h1 { color: #333; }
                    h2 { color: #555; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
                    .meta { color: #777; font-size: 0.9em; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <h1>Writing Feedback</h1>
                <div class="meta">
                    <div>Date: ${new Date().toLocaleDateString()}</div>
                    <div>Words: ${finalWordCount.textContent}</div>
                    <div>Time: ${writingTimeTaken.textContent}</div>
                </div>
                
                <h2>Prompt</h2>
                <div>${prompt}</div>
                
                <h2>Original Writing</h2>
                <div>${original}</div>
                
                <h2>Feedback</h2>
                <div>${feedback}</div>
                
                <h2>Improved Version</h2>
                <div>${improved}</div>
            </body>
            </html>
        `);
        
        // Print and close
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    return {
        init,
        updateModelPlaceholder
    };
})();
