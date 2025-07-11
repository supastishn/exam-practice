document.addEventListener('DOMContentLoaded', () => {
    Auth.init(); // Auth.init now has logic to detect page
    UI.init();   // UI.init is generic (theme)

    // Load performance tracker if available
    if (typeof PerformanceTracker === "undefined") {
        // Try to load js/performance.js dynamically if not already loaded
        const script = document.createElement('script');
        script.src = 'js/performance.js';
        script.onload = () => { /* Loaded */ };
        document.head.appendChild(script);
    }

    // Conditionally initialize modules based on the page
    const pathname = window.location.pathname;

    if (pathname.includes('english.html') || pathname.includes('math.html')) {
        // These pages use 'exercise-form' and 'exercise-output' for Exercises.js
        if (document.getElementById('exercise-form') || document.getElementById('exercise-output')) {
            Exercises.init();
        }
    } else if (pathname.includes('memorization.html')) {
        // This page uses 'exercise-form' and 'exercise-output' for Memorization.js
        if (document.getElementById('exercise-form') || document.getElementById('exercise-output')) {
            Memorization.init();
        }
    } else if (pathname.includes('writing.html')) {
        // This page uses 'topic-generation-form' for Writing.js, will be updated for note manager
        if (document.getElementById('topic-generation-form') || document.getElementById('note-manager-section')) { 
            Writing.init();
        }
    }
    // Other initializations for API etc. can go here
});
