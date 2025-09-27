import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import English from './pages/English'
import Math from './pages/Math'
import Memorization from './pages/Memorization'
import Writing from './pages/Writing'
import ReadingComprehension from './pages/ReadingComprehension'
import Debate from './pages/Debate'
import Settings from './pages/Settings'
import FallacyDetector from './pages/FallacyDetector'
import HistoricalWhatIf from './pages/HistoricalWhatIf'
import Conversation from './pages/Conversation'
import ArgumentBuilder from './pages/ArgumentBuilder'
import QuestionTutor from './pages/QuestionTutor'
// Removed non-essential tools for exam practice
import MathProofAssistant from './pages/MathProofAssistant'
// Removed non-essential tools for exam practice

const App = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="english" element={<English />} />
      <Route path="math" element={<Math />} />
      <Route path="memorization" element={<Memorization />} />
      <Route path="writing" element={<Writing />} />
      <Route path="reading-comprehension" element={<ReadingComprehension />} />
      <Route path="debate" element={<Debate />} />
      <Route path="fallacy-detector" element={<FallacyDetector />} />
      {/** removed Ethical Dilemma tool */}
      <Route path="historical-what-if" element={<HistoricalWhatIf />} />
      <Route path="conversation" element={<Conversation />} />
      <Route path="argument-builder" element={<ArgumentBuilder />} />
      <Route path="question-tutor" element={<QuestionTutor />} />
      {/** removed Legal Summarizer, Hypothesis Generator, Scientific Paper Summarizer */}
      <Route path="math-proof-assistant" element={<MathProofAssistant />} />
      {/** removed Regex Builder and Decision Matrix */}
      <Route path="settings" element={<Settings />} />
    </Route>
  </Routes>
)

export default App
