import React from 'react'
import { Link } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'

const NavBar = () => (
  <header>
    <Link to="/" className="nav-logo" style={{color: 'inherit', textDecoration: 'none'}}><h1><i className="fas fa-language"></i> Language Exercise Tools</h1></Link>
    <ThemeToggle />
  </header>
)

export default NavBar
