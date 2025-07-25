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
import ResumeAssistant from './pages/ResumeAssistant'
import TranslationPractice from './pages/TranslationPractice'
import EthicalDilemma from './pages/EthicalDilemma'
import HistoricalWhatIf from './pages/HistoricalWhatIf'
import Conversation from './pages/Conversation'
import ArgumentBuilder from './pages/ArgumentBuilder'
import ToneAdjuster from './pages/ToneAdjuster'
import NegotiationPractice from './pages/NegotiationPractice'
import QuestionTutor from './pages/QuestionTutor'
import FlashcardConverter from './pages/FlashcardConverter'
import SatireGenerator from './pages/SatireGenerator'
import LegalSummarizer from './pages/LegalSummarizer'
import HypothesisGenerator from './pages/HypothesisGenerator'
import ScientificPaperSummarizer from './pages/ScientificPaperSummarizer'
import MathProofAssistant from './pages/MathProofAssistant'
import BugReportFormatter from './pages/BugReportFormatter'
import RegexBuilder from './pages/RegexBuilder'
import AlgorithmExplainer from './pages/AlgorithmExplainer'
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
      <Route path="resume-assistant" element={<ResumeAssistant />} />
      <Route path="translation-practice" element={<TranslationPractice />} />
      <Route path="ethical-dilemma" element={<EthicalDilemma />} />
      <Route path="historical-what-if" element={<HistoricalWhatIf />} />
      <Route path="conversation" element={<Conversation />} />
      <Route path="argument-builder" element={<ArgumentBuilder />} />
      <Route path="tone-adjuster" element={<ToneAdjuster />} />
      <Route path="negotiation-practice" element={<NegotiationPractice />} />
      <Route path="question-tutor" element={<QuestionTutor />} />
      <Route path="flashcard-converter" element={<FlashcardConverter />} />
      <Route path="satire-generator" element={<SatireGenerator />} />
      <Route path="legal-summarizer" element={<LegalSummarizer />} />
      <Route path="hypothesis-generator" element={<HypothesisGenerator />} />
      <Route path="scientific-paper-summarizer" element={<ScientificPaperSummarizer />} />
      <Route path="math-proof-assistant" element={<MathProofAssistant />} />
      <Route path="bug-report-formatter" element={<BugReportFormatter />} />
      <Route path="regex-builder" element={<RegexBuilder />} />
      <Route path="algorithm-explainer" element={<AlgorithmExplainer />} />
      <Route path="decision-matrix" element={<DecisionMatrix />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  </Routes>
)

export default App
