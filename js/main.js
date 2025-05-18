document.addEventListener('DOMContentLoaded', () => {
    Auth.init(); // Auth.init now has logic to detect page
    UI.init();   // UI.init is generic (theme)

    // Conditionally initialize modules based on the page
    const pathname = window.location.pathname;
    if (document.getElementById('exercise-form') || document.getElementById('exercise-output')) {
        if (pathname.includes('english.html') || pathname.includes('math.html')) {
            Exercises.init(); 
        } else if (pathname.includes('memorization.html')) {
            Memorization.init();
        }
    }
    // Other initializations for API etc. can go here
});
