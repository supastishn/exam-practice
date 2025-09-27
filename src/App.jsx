import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import English from './pages/English'
import Math from './pages/Math'
import Memorization from './pages/Memorization'
import Writing from './pages/Writing'
import Debate from './pages/Debate'
import Settings from './pages/Settings'
import FallacyDetector from './pages/FallacyDetector'
import EthicalDilemma from './pages/EthicalDilemma'
import HistoricalWhatIf from './pages/HistoricalWhatIf'
import Conversation from './pages/Conversation'
import ArgumentBuilder from './pages/ArgumentBuilder'
import QuestionTutor from './pages/QuestionTutor'
import LegalSummarizer from './pages/LegalSummarizer'
import HypothesisGenerator from './pages/HypothesisGenerator'
import ScientificPaperSummarizer from './pages/ScientificPaperSummarizer'
import MathProofAssistant from './pages/MathProofAssistant'
import RegexBuilder from './pages/RegexBuilder'
import DecisionMatrix from './pages/DecisionMatrix'

const App = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<Home />} />
      <Route path="english" element={<English />} />
      <Route path="math" element={<Math />} />
      <Route path="memorization" element={<Memorization />} />
      <Route path="writing" element={<Writing />} />
      <Route path="debate" element={<Debate />} />
      <Route path="fallacy-detector" element={<FallacyDetector />} />
      <Route path="ethical-dilemma" element={<EthicalDilemma />} />
      <Route path="historical-what-if" element={<HistoricalWhatIf />} />
      <Route path="conversation" element={<Conversation />} />
      <Route path="argument-builder" element={<ArgumentBuilder />} />
      <Route path="question-tutor" element={<QuestionTutor />} />
      <Route path="legal-summarizer" element={<LegalSummarizer />} />
      <Route path="hypothesis-generator" element={<HypothesisGenerator />} />
      <Route path="scientific-paper-summarizer" element={<ScientificPaperSummarizer />} />
      <Route path="math-proof-assistant" element={<MathProofAssistant />} />
      <Route path="regex-builder" element={<RegexBuilder />} />
      <Route path="decision-matrix" element={<DecisionMatrix />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  </Routes>
)

export default App
