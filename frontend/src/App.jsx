import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import EntityPage from './pages/EntityPage'

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ padding: 12 }}>
        <Link to="/">Home</Link> | <Link to="/about">About</Link> |
        <Link to="/entities/ppdev_Communityworkshop">Workshops</Link> |
        <Link to="/entities/ppdev_Communitylearner">Learners</Link> |
        <Link to="/entities/ppdev_Communitytrainer">Trainers</Link> |
        <Link to="/entities/ppdev_Communitytrainingenrolment">Enrolments</Link> |
        <Link to="/entities/ppdev_Communitymemberfeedback">Feedback</Link> |
        <Link to="/entities/ppdev_Sparoute">SpaRoutes</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/entities/:folder" element={<EntityPage />} />
      </Routes>
    </BrowserRouter>
  )
}
