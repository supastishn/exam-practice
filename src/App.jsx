import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import English from './pages/English'
import Math from './pages/Math'
import Memorization from './pages/Memorization'
import Writing from './pages/Writing'
import Debate from './pages/Debate'
import Settings from './pages/Settings'

const App = () => (
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="english" element={<English />} />
    <Route path="math" element={<Math />} />
    <Route path="memorization" element={<Memorization />} />
    <Route path="writing" element={<Writing />} />
    <Route path="debate" element={<Debate />} />
    <Route path="settings" element={<Settings />} />
  </Routes>
)

export default App
