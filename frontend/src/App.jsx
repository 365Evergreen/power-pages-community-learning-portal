import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Header from './components/Header'
import Home from './pages/Home'
import About from './pages/About'
import EntityPage from './pages/EntityPage'
import SignUp from './pages/SignUp'
import './styles.css'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/entities/:folder" element={<EntityPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
