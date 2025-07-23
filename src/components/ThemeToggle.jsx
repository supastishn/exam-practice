import React, { useState, useEffect } from 'react'

const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const pref = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setIsDark(pref === 'dark')
    document.body.classList.toggle('dark-mode', pref === 'dark')
  }, [])

  const toggle = () => {
    const next = isDark ? 'light' : 'dark'
    document.body.classList.toggle('dark-mode', next === 'dark')
    localStorage.setItem('theme', next)
    setIsDark(next === 'dark')
  }

  return (
    <button onClick={toggle} className="theme-button" aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <i className={isDark ? 'fas fa-sun' : 'fas fa-moon'}></i>
    </button>
  )
}

export default ThemeToggle
