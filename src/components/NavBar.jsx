import React from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const NavBar = () => (
  <nav className="navbar">
    <Link to="/" className="nav-logo">Home</Link>
    <ThemeToggle />
  </nav>
)

export default NavBar
