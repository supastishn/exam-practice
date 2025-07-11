const PerformanceTracker = (() => {
  const PREFERENCE_STORAGE_KEY = 'difficultyPrefs';
  
  // Track performance for each subject (English/Math/Memorization)
  const trackPerformance = (subjectId, difficulty, accuracy) => {
    const history = JSON.parse(localStorage.getItem(PREFERENCE_STORAGE_KEY)) || {};
    
    if (!history[subjectId]) history[subjectId] = {
      beginner: { attempts: 0, successes: 0 },
      intermediate: { attempts: 0, successes: 0 },
      advanced: { attempts: 0, successes: 0 },
      currentLevel: 'beginner'
    };
    
    history[subjectId][difficulty].attempts += 1;
    history[subjectId][difficulty].successes += accuracy >= 0.7 ? 1 : 0;
    history[subjectId].currentLevel = difficulty;
    
    localStorage.setItem(PREFERENCE_STORAGE_KEY, JSON.stringify(history));
  };
  
  // Calculate suggested difficulty
  const getSuggestedDifficulty = (subjectId) => {
    const history = JSON.parse(localStorage.getItem(PREFERENCE_STORAGE_KEY)) || {};
    const subjectData = history[subjectId] || {};
    
    const levels = ['beginner','intermediate','advanced'];
    const currentLevel = subjectData.currentLevel || 'beginner';
    const idx = levels.indexOf(currentLevel);
    const stats = subjectData[currentLevel] || { attempts: 0, successes: 0 };
    const successRate = stats.attempts ? stats.successes / stats.attempts : 0;
    
    if (successRate > 0.8) return idx === 2 ? 'advanced' : levels[idx + 1];
    if (successRate < 0.5) return idx === 0 ? 'beginner' : levels[idx - 1];
    return currentLevel;
  };
  
  return { trackPerformance, getSuggestedDifficulty };
})();
