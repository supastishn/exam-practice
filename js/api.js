// js/api.js - OpenAI API interaction

const Api = (() => {
    // Function to make requests to OpenAI API
    // Will use credentials from Auth.getCredentials()

    // Helper to make API requests
    const makeApiRequest = async (apiKey, baseUrl, endpoint, data, onChunk) => {
        const url = `${baseUrl || 'https://api.openai.com/v1'}/${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText, error: {} }));
                throw {
                    status: response.status,
                    statusText: response.statusText,
                    message: errorData.error?.message || errorData.message || 'Unknown API error',
                    error: errorData.error
                };
            }

            if (data.stream && onChunk) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let accumulatedResponse = '';
                let buffer = '';

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    
                    buffer += decoder.decode(value, { stream: true });
                    
                    let eolIndex;
                    while ((eolIndex = buffer.indexOf('\n\n')) !== -1) {
                        const eventString = buffer.substring(0, eolIndex);
                        buffer = buffer.substring(eolIndex + 2);

                        if (eventString.startsWith('data: ')) {
                            const jsonDataString = eventString.substring('data: '.length);
                            if (jsonDataString.trim() === '[DONE]') {
                                // Stream finished
                            } else {
                                try {
                                    const parsedJson = JSON.parse(jsonDataString);
                                    if (parsedJson.choices && parsedJson.choices[0].delta && parsedJson.choices[0].delta.content) {
                                        const contentChunk = parsedJson.choices[0].delta.content;
                                        accumulatedResponse += contentChunk;
                                        onChunk(contentChunk);
                                    }
                                } catch (e) {
                                    console.error('Error parsing streamed JSON chunk:', e, jsonDataString);
                                }
                            }
                        }
                    }
                }
                // Process any remaining buffer content (though for SSE, it should end with \n\n)
                if (buffer.startsWith('data: ')) {
                     const jsonDataString = buffer.substring('data: '.length);
                     if (jsonDataString.trim() !== '[DONE]') {
                         try {
                            const parsedJson = JSON.parse(jsonDataString);
                            if (parsedJson.choices && parsedJson.choices[0].delta && parsedJson.choices[0].delta.content) {
                                const contentChunk = parsedJson.choices[0].delta.content;
                                accumulatedResponse += contentChunk;
                                onChunk(contentChunk);
                            }
                         } catch(e) { /* ignore parse error on potential partial final chunk */ }
                     }
                }
                return accumulatedResponse;
            } else {
                return await response.json();
            }
        } catch (error) {
            // Re-throw fetch errors or our custom error object
            throw error;
        }
    };

    // Test API connection with a simple request (chat/completions endpoint) - remains non-streaming
    const testApiConnection = async (apiKey, baseUrl, modelName) => {
        if (!apiKey) {
            return { success: false, message: 'API Key is required' };
        }
        
        const modelToUse = modelName || "gpt-4.1"; // Use provided modelName or fallback
        console.log('Testing API connection with model:', modelToUse);

        try {
            const data = {
                model: modelToUse,
                messages: [
                    {role: "user", content: "Say hello world"}
                ],
                max_tokens: 50,
                temperature: 0.7,
                top_p: 1.0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0
            };
            
            const result = await makeApiRequest(apiKey, baseUrl, 'chat/completions', data);

            if (result && result.choices && result.choices.length > 0 && result.choices[0].message) {
                return {
                    success: true,
                    message: 'Connection successful!',
                    response: result.choices[0].message.content.trim()
                };
            } else {
                return {
                    success: false,
                    message: 'Unexpected API response format'
                };
            }
        } catch (error) {
            console.error('API Test Error:', error);
            // Create a user-friendly error message
            const errorMessage = error.message || 'An unknown error occurred during API test.';
            const statusInfo = error.status ? ` (Status: ${error.status})` : '';
            
            return {
                success: false,
                message: `Error${statusInfo}: ${errorMessage}`
            };
        }
    };

    // Function to call OpenAI API (chat/completions endpoint)
    // promptInput can be a string (for text-only) or an object for multimodal.
    // e.g., { textPrompt: "Describe this image", base64Image: "data:image/jpeg;base64,..." }
    const generateExercise = async (promptInput, modelName = "gpt-4.1", onProgress) => {
        const { apiKey, baseUrl, defaultTemperature } = Auth.getCredentials();
        if (!apiKey) {
            alert('API Key not set. Please go to the Settings page to set it.');
            return null;
        }
        
        const temp = parseFloat(defaultTemperature);
        const temperature = (!isNaN(temp) && temp >= 0 && temp <= 1) ? temp : 0.7;

        console.log('Generating exercise with model:', modelName);

        let messagesPayload;

        if (typeof promptInput === 'string') {
            messagesPayload = [{ role: "user", content: promptInput }];
        } else if (typeof promptInput === 'object' && promptInput.textPrompt) {
            if (Array.isArray(promptInput.base64Images)) {
                messagesPayload = [{
                    role: "user",
                    content: [
                        { type: "text", text: promptInput.textPrompt },
                        ...promptInput.base64Images.map(b64 => ({
                            type: "image_url",
                            image_url: { url: b64 }
                        }))
                    ]
                }];
                // Ensure a vision-capable model is being used (caller should ideally set this,
                // but we can log a warning or have a fallback if a known non-vision model is passed).
                if (!modelName.includes('vision') && modelName !== 'gpt-4o' && modelName !== 'gpt-4-turbo') {
                    console.warn(`Image(s) provided with potentially non-vision model: ${modelName}. Results may vary. Consider using gpt-4o or a vision-specific model.`);
                }
            } else if (promptInput.base64Image) {
                messagesPayload = [{
                    role: "user",
                    content: [
                        { type: "text", text: promptInput.textPrompt },
                        {
                            type: "image_url",
                            image_url: {
                                "url": promptInput.base64Image
                            }
                        }
                    ]
                }];
                if (!modelName.includes('vision') && modelName !== 'gpt-4o' && modelName !== 'gpt-4-turbo') {
                    console.warn(`Image provided with potentially non-vision model: ${modelName}. Results may vary. Consider using gpt-4o or a vision-specific model.`);
                }
            } else {
                messagesPayload = [{ role: "user", content: promptInput.textPrompt }];
            }
        } else {
            console.error("Invalid promptInput format for generateExercise:", promptInput);
            alert("Internal error: Invalid prompt format.");
            return null;
        }

        try {
            const data = {
                model: modelName,
                messages: messagesPayload,
                max_tokens: 2048, // Consider adjusting max_tokens for vision models, as they might have different limits or costs.
                temperature,
                top_p: 1.0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                stream: true // Enable streaming
            };
            
            // makeApiRequest will call onProgress for each chunk and return the full response
            const fullResponse = await makeApiRequest(apiKey, baseUrl, 'chat/completions', data, onProgress);
            
            if (fullResponse) {
                return fullResponse.trim();
            } else {
                // Error handling for empty or unexpected fullResponse might be needed if makeApiRequest doesn't throw
                console.error('API returned empty or invalid full response after streaming.');
                alert('Failed to get a complete exercise from API response after streaming.');
                return null;
            }
        } catch (error) {
            console.error('Error generating exercise (streaming):', error);
            let errorMessage = `Error generating exercise: ${error.message}`;
            
            // Handle specific error cases
            if (error.status) {
                errorMessage = `API Error (${error.status}): ${error.message}`;
                
                // Specific handling for common errors
                if (error.status === 422) {
                    console.error('API 422 Error (Unprocessable Entity):', error.error);
                    errorMessage = `The API rejected the request (Error 422): ${error.message}.`;
                    if (error.message.includes('model')) {
                        errorMessage += '\n\nPossible cause: Invalid model name. Try "gpt-4.1" or check available models.';
                    } else if (error.message.includes('token')) {
                        errorMessage += '\n\nPossible cause: Request exceeds maximum token limit. Try a shorter prompt.';
                    }
                }
            }
            
            alert(errorMessage);
            return null;
        }
    };

    // Function to call OpenAI API for explanations
    const generateExplanation = async (promptString, modelName = "gpt-4.1", onProgress) => {
        const { apiKey, baseUrl, defaultTemperature } = Auth.getCredentials();
        if (!apiKey) {
            alert('API Key not set. Please set it in the setup section.');
            UI.showSetupForm();
            return null;
        }

        const temp = parseFloat(defaultTemperature);
        const temperature = (!isNaN(temp) && temp >= 0 && temp <= 1) ? temp : 0.5;

        console.log('Generating explanation with model:', modelName);

        try {
            const data = {
                model: modelName,
                messages: [
                    {role: "user", content: promptString}
                ],
                max_tokens: 500, 
                temperature,
                top_p: 1.0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                stream: true // Enable streaming
            };
            
            const fullResponse = await makeApiRequest(apiKey, baseUrl, 'chat/completions', data, onProgress);

            if (fullResponse) {
                return fullResponse.trim();
            } else {
                console.error('API returned empty or invalid full response for explanation after streaming.');
                alert('Failed to get a complete explanation from API response after streaming.');
                return null;
            }
        } catch (error) {
            console.error('Error generating explanation (streaming):', error);
            let errorMessage = `Error generating explanation: ${error.message}`;
            if (error.status) {
                errorMessage = `API Error (${error.status}) generating explanation: ${error.message}`;
            }
            alert(errorMessage);
            return null;
        }
    };

    // Function to get AI judgment for user responses
    const judgeUserResponses = async (tasksWithAnswers, modelName = "gpt-4.1", onProgress, judgingContext = "general") => {
        const { apiKey, baseUrl, defaultTemperature } = Auth.getCredentials();
        if (!apiKey) {
            alert('API Key not set. Please set it in the setup section.');
            UI.showSetupForm();
            return null;
        }

        const temp = parseFloat(defaultTemperature);
        const temperature = (!isNaN(temp) && temp >= 0 && temp <= 1) ? temp : 0.3;

        console.log('Requesting AI judgment with model:', modelName);

        let taskInputsXml = "";
        tasksWithAnswers.forEach(item => {
            taskInputsXml += `  <userInput taskId="${item.id}">\n`;
            taskInputsXml += `    <taskText><![CDATA[${item.taskText}]]></taskText>\n`; // taskText comes from questionData.taskText
            taskInputsXml += `    <userAnswer><![CDATA[${item.userAnswer}]]></userAnswer>\n`;
            taskInputsXml += `  </userInput>\n`;
        });

        let systemPromptPersona = "";
        let systemPromptGoal = "";

        if (judgingContext === "memorization_quiz") {
            systemPromptPersona = `You are an expert quiz evaluator. The user is being quizzed on material they are trying to memorize.
You will be given the original question/task from the quiz and the user's answer to it.`;
            systemPromptGoal = `Your goal is to judge if the user's answer is correct and complete based *only* on the provided question/task.
The question implicitly refers to the memorized material. Assume the question is well-posed and directly answerable from common knowledge related to typical memorization content if not a direct quote.
For example, if the question is "What is the capital of France?" and the user answers "Paris", it's correct. If they answer "Berlin", it's incorrect.
If the question is "Describe photosynthesis" and the user gives a reasonable summary, it's correct.
Focus on factual accuracy and completeness as implied by the question.`;
        } else { // Default "general" context (for English/Math exercises)
            systemPromptPersona = `You are an expert AI tutor. You will be given a series of tasks and the user's responses to those tasks.
The tasks could be related to English language or Mathematics.`;
            systemPromptGoal = `Your goal is to judge each user response based on the task.
For each task, determine if the user's response is correct, appropriate for the task, and a good answer overall.
For English, consider grammar, semantics, and relevance.
For Math, consider correctness of explanation, steps, or final answer if the task asks for it.`;
        }

        const promptString = `
${systemPromptPersona}
${systemPromptGoal}

Provide your judgment in XML format. The root tag should be <judgments>.
Inside <judgments>, for each userInput you received, provide a <judgment taskId="original_task_id"> tag.
Each <judgment> tag must contain:
1. A <status> tag: "correct", "incorrect", or "partially-correct".
2. A <feedback> tag: A concise explanation for your judgment. If incorrect or partially-correct, explain what was wrong and suggest improvements. If correct, you can provide brief positive feedback.

Example of your expected output format:
<judgments>
  <judgment taskId="1">
    <status>correct</status>
    <feedback>Excellent use of vocabulary and sentence structure!</feedback>
  </judgment>
  <judgment taskId="2">
    <status>incorrect</status>
    <feedback>The word 'ephemeral' means lasting for a very short time. Your sentence did not quite capture this meaning. Try: "The beauty of the cherry blossoms is ephemeral."</feedback>
  </judgment>
  <judgment taskId="3">
    <status>partially-correct</status>
    <feedback>Your description is good, but there's a small grammatical error: 'He go to school' should be 'He goes to school'.</feedback>
  </judgment>
  ...
</judgments>

Here are the tasks and user answers:
<userInputs>
${taskInputsXml}
</userInputs>

Please provide your judgments in the XML format described above.
`;

        try {
            const data = {
                model: modelName,
                messages: [
                    {role: "user", content: promptString}
                ],
                max_tokens: 2048, // Adjust as needed for multiple judgments
                temperature,
                top_p: 1.0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                stream: true // Streaming for judgment response
            };
            
            const fullResponse = await makeApiRequest(apiKey, baseUrl, 'chat/completions', data, onProgress);
            
            if (fullResponse) {
                return fullResponse.trim();
            } else {
                console.error('API returned empty or invalid full response for judgment after streaming.');
                alert('Failed to get a complete judgment from API response after streaming.');
                return null;
            }
        } catch (error) {
            console.error('Error getting AI judgment (streaming):', error);
            let errorMessage = `Error getting AI judgment: ${error.message}`;
            if (error.status) {
                errorMessage = `API Error (${error.status}) getting AI judgment: ${error.message}`;
            }
            alert(errorMessage);
            return null;
        }
    };

    // Function to call OpenAI API for writing topics
    const generateWritingTopic = async (promptString, modelName = "gpt-4.1", onProgress) => {
        const { apiKey, baseUrl, defaultTemperature } = Auth.getCredentials();
        if (!apiKey) {
            alert('API Key not set. Please go to the Settings page to set it.');
            return null;
        }

        const temp = parseFloat(defaultTemperature);
        const temperature = (!isNaN(temp) && temp >= 0 && temp <= 1) ? temp : 0.7;

        console.log('Generating writing topic with model:', modelName);

        try {
            const data = {
                model: modelName,
                messages: [
                    {role: "user", content: promptString}
                ],
                max_tokens: 200, // Topics are usually short
                temperature,
                top_p: 1.0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                stream: true 
            };
            
            const fullResponse = await makeApiRequest(apiKey, baseUrl, 'chat/completions', data, onProgress);

            if (fullResponse) {
                return fullResponse.trim();
            } else {
                console.error('API returned empty or invalid full response for writing topic after streaming.');
                alert('Failed to get a complete writing topic from API response after streaming.');
                return null;
            }
        } catch (error) {
            console.error('Error generating writing topic (streaming):', error);
            let errorMessage = `Error generating writing topic: ${error.message}`;
            if (error.status) {
                errorMessage = `API Error (${error.status}) generating writing topic: ${error.message}`;
            }
            alert(errorMessage);
            return null;
        }
    };

    // Function to call OpenAI API for writing feedback
    const generateWritingFeedback = async (promptString, modelName = "gpt-4.1", onProgress) => {
        const { apiKey, baseUrl } = Auth.getCredentials();
        if (!apiKey) {
            alert('API Key not set. Please go to the Settings page to set it.');
            return null;
        }

        // Always use temperature 0 for grading
        const temperature = 0;

        console.log('Generating writing feedback with model:', modelName);

        try {
            const data = {
                model: modelName,
                messages: [
                    {
                        role: "system",
                        content: "ALWAYS strictly return XML format: <feedback>(analytical feedback)</feedback>\n" +
                                 "<improved>(full revised text)</improved>\n" +
                                 "<highlight>(text showing changes. For each change, use:\n" +
                                 "   <change>\n" +
                                 "     <original>(exactly 1 sentence from original)</original>\n" +
                                 "     <revised>(modified version using <del>deleted text</del> and <ins>added text</ins>)</revised>\n" +
                                 "   </change>\n" +
                                 ")</highlight>\n" +
                                 "NO other text outside XML tags. Generate highlights using <del> and <ins> tags ONLY."
                    },
                    {
                        role: "user",
                        content: `${promptString}`
                    }
                ],
                max_tokens: 2048,
                temperature: 0,
                top_p: 1.0,
                frequency_penalty: 0.0,
                presence_penalty: 0.0,
                stream: true
            };
            
            const fullResponse = await makeApiRequest(apiKey, baseUrl, 'chat/completions', data, onProgress);

            if (fullResponse) {
                return fullResponse.trim();
            } else {
                console.error('API returned empty or invalid full response for writing feedback after streaming.');
                alert('Failed to get complete writing feedback from API response after streaming.');
                return null;
            }
        } catch (error) {
            console.error('Error generating writing feedback (streaming):', error);
            let errorMessage = `Error generating writing feedback: ${error.message}`;
            if (error.status) {
                errorMessage = `API Error (${error.status}) generating writing feedback: ${error.message}`;
            }
            alert(errorMessage);
            return null;
        }
    };

    // Function to call OpenAI API for debate arguments
    const generateDebateArgument = async (topic, transcript, aiStance, modelName = "gpt-4.1", onProgress) => {
        const { apiKey, baseUrl, defaultTemperature } = Auth.getCredentials();
        if (!apiKey) {
            alert('API Key not set. Please go to the Settings page.');
            return null;
        }
        const temp = parseFloat(defaultTemperature);
        const temperature = (!isNaN(temp) && temp >= 0 && temp <= 1) ? temp : 0.8; // Higher temp for more creative debate

        const transcriptString = transcript.map(msg => `${msg.speaker.toUpperCase()}: ${msg.text}`).join('\n\n');

        const systemPrompt = `You are a skilled and assertive debater. The debate topic is: "${topic}".
Your assigned stance is: FOR the motion.
Your opponent is the "USER". You must counter their arguments, introduce your own points, and stay consistently in your role.
Keep your responses concise, focused, and impactful. Address the user's last point directly before making your own. Do not begin with phrases like "As an AI..." or "In my opinion...". State your arguments as facts from your perspective.`;

        const finalPrompt = `This is the debate transcript so far:
<transcript>
${transcriptString}
</transcript>

Based on the user's last argument, deliver your next rebuttal or point. Remember your stance is: ${aiStance.toUpperCase()}.`;

        try {
            const data = {
                model: modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: finalPrompt }
                ],
                max_tokens: 500,
                temperature,
                stream: true
            };
            const fullResponse = await makeApiRequest(apiKey, baseUrl, 'chat/completions', data, onProgress);
            return fullResponse ? fullResponse.trim() : null;
        } catch (error) {
            console.error('Error generating debate argument:', error);
            alert(`API Error: ${error.message}`);
            return null;
        }
    };

    // Function to call OpenAI API for debate analysis
    const analyzeDebate = async (topic, transcript, modelName = "gpt-4.1", onProgress) => {
        const { apiKey, baseUrl } = Auth.getCredentials();
        if (!apiKey) {
            alert('API Key not set. Please go to the Settings page.');
            return null;
        }

        const transcriptString = transcript.map(msg => `${msg.speaker.toUpperCase()}: ${msg.text}`).join('\n\n');

        const promptString = `You are an impartial and expert debate judge.
The debate topic was: "${topic}".
Here is the full transcript:
<transcript>
${transcriptString}
</transcript>

Your task is to provide a final analysis of the debate. Please structure your response using Markdown with the following sections:
1.  **Debate Summary:** Briefly summarize the main arguments presented by both the USER and the AI.
2.  **Critique and Feedback:** For both the USER and the AI, provide constructive feedback. Point out logical fallacies, strong points, weak points, and areas for improvement.
3.  **Conclusion:** Based *only* on the arguments presented in the transcript, declare a winner and provide a clear justification for your decision.`;

        try {
            const data = {
                model: modelName,
                messages: [{ role: "user", content: promptString }],
                max_tokens: 1500,
                temperature: 0.4, // Lower temp for analytical tasks
                stream: true
            };
            const fullResponse = await makeApiRequest(apiKey, baseUrl, 'chat/completions', data, onProgress);
            return fullResponse ? fullResponse.trim() : null;
        } catch (error) {
            console.error('Error analyzing debate:', error);
            alert(`API Error: ${error.message}`);
            return null;
        }
    };

    return {
        generateExercise,
        testApiConnection,
        generateExplanation,
        judgeUserResponses,
        generateWritingTopic,
        generateWritingFeedback,
        generateDebateArgument,
        analyzeDebate
    };
})();
