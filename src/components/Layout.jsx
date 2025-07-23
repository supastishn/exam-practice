import React from 'react'
import NavBar from './NavBar'
import Footer from './Footer'
import { Link, Outlet } from 'react-router-dom'

const Layout = () => (
  <>
  <>
        <NavBar />
      <Link to="/">Home</Link>
    </nav>
        <Outlet />
      <Footer />
  </>
)
)

export default Layout
