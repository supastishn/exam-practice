const Auth = (() => {
    const ENCRYPTION_KEY = 'your-secret-encryption-key'; // IMPORTANT: In a real app, this key should be more complex and managed securely.
    const API_KEY_STORAGE_KEY = 'openai_api_key';
    const BASE_URL_STORAGE_KEY = 'openai_base_url';
    const DEFAULT_MODEL_STORAGE_KEY = 'openai_default_model';

    const credentialsForm = document.getElementById('credentials-form');
    const apiKeyInput = document.getElementById('api-key');
    const baseUrlInput = document.getElementById('base-url');
    const defaultModelInput = document.getElementById('default-model');
    const clearCredentialsButton = document.getElementById('clear-credentials'); // Specific to settings.html
    const credentialsStatus = document.getElementById('credentials-status'); // Specific to settings.html
    
    // Elements on index.html
    const exerciseGenerationSection = document.getElementById('exercise-generation-section');
    // const setupSection = document.getElementById('setup-section'); // This is now settings.html

    const encrypt = (text) => {
        if (!text) return null;
        return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    };

    const decrypt = (ciphertext) => {
        if (!ciphertext) return null;
        const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    };

    // Function to update the placeholder for the model input in the exercise generation section
    const updateExerciseModelPlaceholder = () => {
        const exerciseModelInput = document.getElementById('model');
        if (exerciseModelInput) {
            const { defaultModel } = loadCredentials(); // Get current default model
            if (defaultModel) {
                exerciseModelInput.placeholder = `Default: ${defaultModel} (leave empty to use)`;
            } else {
                exerciseModelInput.placeholder = `gpt-4.1 (default system fallback)`;
            }
        }
    };

    const saveCredentials = (apiKey, baseUrl, defaultModel) => {
        localStorage.setItem(API_KEY_STORAGE_KEY, encrypt(apiKey));
        if (baseUrl) {
            localStorage.setItem(BASE_URL_STORAGE_KEY, encrypt(baseUrl));
        } else {
            localStorage.removeItem(BASE_URL_STORAGE_KEY);
        }
        if (defaultModel) {
            localStorage.setItem(DEFAULT_MODEL_STORAGE_KEY, encrypt(defaultModel));
        } else {
            localStorage.removeItem(DEFAULT_MODEL_STORAGE_KEY);
        }
        updateCredentialStatus(true); // This will update status on settings.html if present
        updateExerciseModelPlaceholder(); // Update placeholder on index.html

        // If on settings page, show a message and provide link back
        if (document.getElementById('credentials-form')) { // Are we on settings.html?
            if (credentialsStatus) { // credentialsStatus is specific to settings.html
                credentialsStatus.innerHTML = '<i class="fas fa-check-circle"></i> Credentials saved successfully! Return to the <a href="index.html">Portal</a> to choose an exercise type.';
                credentialsStatus.style.backgroundColor = 'rgba(40, 167, 69, 0.1)'; // Success color
            }
        } else if (document.getElementById('exercise-form')) { // On english.html or math.html
            UI.showExerciseGeneration(); // This hides the prompt and shows generation section
        }
        // No specific UI change for other pages like the portal index.html
    };

    const loadCredentials = () => {
        const encryptedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        const encryptedBaseUrl = localStorage.getItem(BASE_URL_STORAGE_KEY);
        const encryptedDefaultModel = localStorage.getItem(DEFAULT_MODEL_STORAGE_KEY);

        const apiKey = decrypt(encryptedApiKey);
        const baseUrl = decrypt(encryptedBaseUrl);
        const defaultModel = decrypt(encryptedDefaultModel);
        
        return { apiKey, baseUrl, defaultModel };
    };

    const clearCredentials = () => {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
        localStorage.removeItem(BASE_URL_STORAGE_KEY);
        localStorage.removeItem(DEFAULT_MODEL_STORAGE_KEY);
        if (apiKeyInput) apiKeyInput.value = ''; // These are on settings.html
        if (baseUrlInput) baseUrlInput.value = '';
        if (defaultModelInput) defaultModelInput.value = '';
        updateCredentialStatus(false); // Update status on settings.html
        // UI.showSetupForm(); // Not needed as we are on settings.html
        updateExerciseModelPlaceholder(); // Update placeholder on index.html
    };

    const updateCredentialStatus = (hasCredentials) => {
        // This function primarily updates the #credentials-status element on settings.html
        if (credentialsStatus) { // Check if the element exists (i.e., we are on settings.html)
            if (hasCredentials) {
                const creds = loadCredentials();
                if (apiKeyInput) apiKeyInput.value = creds.apiKey || '';
                if (baseUrlInput) baseUrlInput.value = creds.baseUrl || '';
                if (defaultModelInput) defaultModelInput.value = creds.defaultModel || '';
                
                credentialsStatus.innerHTML = '<i class="fas fa-check-circle"></i> Credentials are saved. You can edit them here or return to the <a href="index.html">Portal</a>.';
                credentialsStatus.style.backgroundColor = ''; // Reset background
            } else {
                credentialsStatus.innerHTML = '<i class="fas fa-info-circle"></i> Credentials not set or cleared. Please enter your API key.';
                credentialsStatus.style.backgroundColor = ''; // Reset background
            }
        }
    };
    
    // showApiSettings is removed as the "API Settings" button is now a direct link.

    const init = () => {
        // Logic for settings.html
        if (document.getElementById('credentials-form')) { // Check if we are on settings.html
            if (credentialsForm) { // Redundant check, but safe
                credentialsForm.addEventListener('submit', (event) => {
                    event.preventDefault();
                    const apiKey = apiKeyInput.value.trim();
                    const baseUrl = baseUrlInput.value.trim();
                    const defaultModel = defaultModelInput ? defaultModelInput.value.trim() : '';
                    if (apiKey) {
                        saveCredentials(apiKey, baseUrl, defaultModel);
                    } else {
                        alert('API Key is required.');
                    }
                });
            }

            if (clearCredentialsButton) {
                clearCredentialsButton.addEventListener('click', clearCredentials);
            }

            const testApiButton = document.getElementById('test-api-button');
            if (testApiButton) {
                testApiButton.addEventListener('click', async () => {
                    const apiKey = apiKeyInput.value.trim();
                    const baseUrl = baseUrlInput.value.trim();
                    const defaultModelToTest = defaultModelInput ? defaultModelInput.value.trim() : undefined;
                    
                    if (!apiKey) {
                        alert('API Key is required for testing.');
                        if (apiKeyInput) apiKeyInput.focus();
                        return;
                    }
                    
                    if (credentialsStatus) credentialsStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing API connection...';
                    
                    testApiButton.disabled = true;
                    testApiButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
                    
                    const testResult = await Api.testApiConnection(apiKey, baseUrl, defaultModelToTest);
                    
                    testApiButton.disabled = false;
                    testApiButton.innerHTML = '<i class="fas fa-vial"></i> Test API';
                    
                    if (credentialsStatus) {
                        if (testResult.success) {
                            credentialsStatus.innerHTML = `<i class="fas fa-check-circle"></i> ${testResult.message} Response: "${testResult.response}"`;
                            credentialsStatus.style.backgroundColor = 'rgba(40, 167, 69, 0.1)';
                        } else {
                            credentialsStatus.innerHTML = `<i class="fas fa-times-circle"></i> API test failed: ${testResult.message}`;
                            credentialsStatus.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                        }
                    }
                });
            }
            // Load existing credentials into the form on settings.html
            const creds = loadCredentials();
            if (apiKeyInput) apiKeyInput.value = creds.apiKey || '';
            if (baseUrlInput) baseUrlInput.value = creds.baseUrl || '';
            if (defaultModelInput) defaultModelInput.value = creds.defaultModel || '';
            updateCredentialStatus(!!creds.apiKey); // Update status text based on loaded key

        } else if (document.getElementById('exercise-form')) { // Logic for english.html
            const { apiKey } = loadCredentials();
            if (apiKey) {
                UI.showExerciseGeneration(); // This should also hide the credentials prompt
            } else {
                UI.showCredentialsPrompt();
                UI.hideExerciseGeneration(); // Explicitly hide if no key
            }
            updateExerciseModelPlaceholder(); // Set initial placeholder on page load
        }
        // No specific Auth UI logic for index.html (portal page) or other pages

        // The 'edit-api-settings' button is now a link, so no event listener needed here for it.
    };

    return {
        init,
        getCredentials: loadCredentials,
        // clearCredentials is now mostly internal to settings page logic via its button
        // showApiSettings is removed
    };
})();
