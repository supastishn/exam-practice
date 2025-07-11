const Debate = (() => {
    // DOM Elements
    let setupForm, arenaSection, analysisSection, topicInput, stanceSelect, modelInput,
        displayTopic, displayUserStance, displayAiStance, transcriptDiv,
        turnIndicator, inputForm, argumentInput, submitArgButton, endDebateButton,
        analysisOutput;

    // State
    const state = {
        topic: '',
        userStance: '',
        aiStance: '',
        transcript: [],
        currentTurn: 'user',
        isActive: false,
        model: 'gpt-4.1'
    };

    const addMessageToTranscript = (speaker, text) => {
        state.transcript.push({ speaker, text });

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('transcript-message', speaker === 'user' ? 'user-message' : 'ai-message');

        const speakerName = document.createElement('span');
        speakerName.className = 'message-speaker';
        speakerName.textContent = speaker === 'user' ? 'You' : 'AI';
        
        const messageContent = document.createElement('div');
        messageContent.innerHTML = Utils.customMarkdownParse(text);

        messageDiv.appendChild(speakerName);
        messageDiv.appendChild(messageContent);
        transcriptDiv.appendChild(messageDiv);
        transcriptDiv.scrollTop = transcriptDiv.scrollHeight;
    };

    const updateTurnUI = (isUserTurn) => {
        if (isUserTurn) {
            turnIndicator.textContent = "Your turn to speak.";
            argumentInput.disabled = false;
            submitArgButton.disabled = false;
            argumentInput.focus();
        } else {
            turnIndicator.textContent = "AI is thinking...";
            argumentInput.disabled = true;
            submitArgButton.disabled = true;
        }
    };

    const getAiArgument = async () => {
        updateTurnUI(false);
        try {
            const aiResponseContainer = document.createElement('div');
            aiResponseContainer.classList.add('transcript-message', 'ai-message');
            const speakerName = document.createElement('span');
            speakerName.className = 'message-speaker';
            speakerName.textContent = 'AI';
            const messageContent = document.createElement('div');
            messageContent.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            aiResponseContainer.appendChild(speakerName);
            aiResponseContainer.appendChild(messageContent);
            transcriptDiv.appendChild(aiResponseContainer);
            transcriptDiv.scrollTop = transcriptDiv.scrollHeight;

            let accumulatedResponse = '';
            const onProgress = (chunk) => {
                accumulatedResponse += chunk;
                messageContent.innerHTML = Utils.customMarkdownParse(accumulatedResponse);
            };

            const fullResponse = await Api.generateDebateArgument(state.topic, state.transcript, state.aiStance, state.model, onProgress);
            
            // Remove the temporary "thinking" message and add the final one
            transcriptDiv.removeChild(aiResponseContainer);
            addMessageToTranscript('ai', fullResponse);
            
            state.currentTurn = 'user';
            updateTurnUI(true);

        } catch (error) {
            addMessageToTranscript('system', `An error occurred: ${error.message}`);
            updateTurnUI(true); // Give turn back to user on error
        }
    };

    const handleArgumentSubmit = (event) => {
        event.preventDefault();
        const userArgument = argumentInput.value.trim();
        if (!userArgument) return;

        addMessageToTranscript('user', userArgument);
        argumentInput.value = '';
        state.currentTurn = 'ai';
        getAiArgument();
    };

    const handleEndDebate = async () => {
        if (!confirm("Are you sure you want to end the debate?")) return;

        state.isActive = false;
        argumentInput.disabled = true;
        submitArgButton.disabled = true;
        endDebateButton.disabled = true;
        turnIndicator.textContent = "Debate ended. Analyzing transcript...";

        analysisSection.style.display = 'block';
        analysisOutput.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Analyzing debate...</p>';
        analysisSection.scrollIntoView({ behavior: 'smooth' });

        try {
            let accumulatedAnalysis = '';
            const onProgress = (chunk) => {
                accumulatedAnalysis += chunk;
                analysisOutput.innerHTML = Utils.customMarkdownParse(accumulatedAnalysis);
            };

            await Api.analyzeDebate(state.topic, state.transcript, state.model, onProgress);
            
        } catch (error) {
            analysisOutput.innerHTML = `<p class="error">Could not analyze debate: ${error.message}</p>`;
        }
    };

    const handleSetupSubmit = (event) => {
        event.preventDefault();
        
        state.topic = topicInput.value.trim();
        if (!state.topic) {
            alert("Please enter a debate topic.");
            return;
        }

        let userStanceValue = stanceSelect.value;
        if (userStanceValue === 'random') {
            userStanceValue = Math.random() < 0.5 ? 'for' : 'against';
        }
        state.userStance = userStanceValue;
        state.aiStance = state.userStance === 'for' ? 'against' : 'for';
        
        const { defaultModel: savedDefaultModel } = Auth.getCredentials();
        state.model = modelInput.value.trim() || savedDefaultModel || "gpt-4.1";

        // Reset transcript
        state.transcript = [];
        transcriptDiv.innerHTML = '';

        // Update UI
        displayTopic.textContent = state.topic;
        displayUserStance.textContent = state.userStance.charAt(0).toUpperCase() + state.userStance.slice(1);
        displayAiStance.textContent = state.aiStance.charAt(0).toUpperCase() + state.aiStance.slice(1);
        
        document.getElementById('debate-setup-section').style.display = 'none';
        arenaSection.style.display = 'block';
        analysisSection.style.display = 'none';
        endDebateButton.disabled = false;

        state.isActive = true;
        state.currentTurn = 'user'; // User always starts
        addMessageToTranscript('system', `The debate will now begin on the topic: "${state.topic}". The user is arguing ${state.userStance.toUpperCase()}, and the AI is arguing ${state.aiStance.toUpperCase()}. The user will make the opening statement.`);
        updateTurnUI(true);
    };

    const init = () => {
        // DOM element assignments
        setupForm = document.getElementById('debate-setup-form');
        arenaSection = document.getElementById('debate-arena-section');
        analysisSection = document.getElementById('debate-analysis-section');
        topicInput = document.getElementById('debate-topic');
        stanceSelect = document.getElementById('user-stance');
        modelInput = document.getElementById('debate-model');
        displayTopic = document.getElementById('display-topic');
        displayUserStance = document.getElementById('display-user-stance');
        displayAiStance = document.getElementById('display-ai-stance');
        transcriptDiv = document.getElementById('debate-transcript');
        turnIndicator = document.getElementById('turn-indicator');
        inputForm = document.getElementById('debate-input-form');
        argumentInput = document.getElementById('user-argument-input');
        submitArgButton = document.getElementById('submit-argument-button');
        endDebateButton = document.getElementById('end-debate-button');
        analysisOutput = document.getElementById('debate-analysis-output');

        const { apiKey } = Auth.getCredentials();
        if (apiKey) {
            document.getElementById('credentials-prompt-section').style.display = 'none';
            setupForm.style.display = 'block';
        } else {
            document.getElementById('credentials-prompt-section').style.display = 'block';
            setupForm.style.display = 'none';
        }

        setupForm.addEventListener('submit', handleSetupSubmit);
        inputForm.addEventListener('submit', handleArgumentSubmit);
        endDebateButton.addEventListener('click', handleEndDebate);

        const { defaultModel: savedDefaultModel } = Auth.getCredentials();
        if (modelInput) {
            modelInput.placeholder = `Default: ${savedDefaultModel || 'gpt-4.1'}`;
        }
    };

    return { init };
})();
