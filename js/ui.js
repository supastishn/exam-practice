const UI = (() => {
    const setupSection = document.getElementById('setup-section');
    const exerciseGenerationSection = document.getElementById('exercise-generation-section');
    const exerciseDisplaySection = document.getElementById('exercise-display-section');
    const answerSection = document.getElementById('answer-section');
    const themeToggleButton = document.getElementById('theme-toggle');
    const credentialsPromptSection = document.getElementById('credentials-prompt-section'); // New
    // Add other UI elements as needed

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if(themeToggleButton) {
                themeToggleButton.innerHTML = '<i class="fas fa-sun"></i>';
                themeToggleButton.setAttribute('aria-label', 'Switch to light mode');
            }
        } else {
            document.body.classList.remove('dark-mode');
            if(themeToggleButton) {
                themeToggleButton.innerHTML = '<i class="fas fa-moon"></i>';
                themeToggleButton.setAttribute('aria-label', 'Switch to dark mode');
            }
        }
        localStorage.setItem('theme', theme);
    };

    const toggleTheme = () => {
        const currentThemeIsDark = document.body.classList.contains('dark-mode');
        const newTheme = currentThemeIsDark ? 'light' : 'dark';
        applyTheme(newTheme);
    };
    
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        // If no theme is saved, check prefers-color-scheme
        const preferredTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        applyTheme(savedTheme || preferredTheme); // Apply saved or preferred, default to light if nothing

        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', toggleTheme);
        }
    };

    // showSetupForm is no longer needed as the form is on a separate page.
    // If settings.html needs to ensure its main section is visible, it can do so directly.

    const showCredentialsPrompt = () => {
        if(credentialsPromptSection) credentialsPromptSection.style.display = 'block';
    };

    const hideCredentialsPrompt = () => {
        if(credentialsPromptSection) credentialsPromptSection.style.display = 'none';
    };

    const showExerciseGeneration = () => {
        // if(setupSection) setupSection.style.display = 'none'; // setupSection is not on index.html
        hideCredentialsPrompt(); // Hide the prompt if showing exercise generation
        if(exerciseGenerationSection) exerciseGenerationSection.style.display = 'block';
        if(exerciseDisplaySection) exerciseDisplaySection.style.display = 'none'; // Usually hide display when showing generation form
    };
    
    const hideExerciseGeneration = () => { // New function
        if(exerciseGenerationSection) exerciseGenerationSection.style.display = 'none';
    };

    const showExerciseDisplay = () => {
        if(exerciseDisplaySection) exerciseDisplaySection.style.display = 'block';
    };
    
    const showAnswerSection = () => {
        if(answerSection) answerSection.style.display = 'block';
    };
    
    const hideAnswerSection = () => {
        if(answerSection) answerSection.style.display = 'none';
    };

    const init = () => {
        initTheme(); // Initialize theme system
        // Other initial UI setup
    };

    return {
        init,
        // showSetupForm, // Removed
        showCredentialsPrompt,
        hideCredentialsPrompt,
        showExerciseGeneration,
        hideExerciseGeneration, // Added
        showExerciseDisplay,
        showAnswerSection,
        hideAnswerSection
    };
})();
