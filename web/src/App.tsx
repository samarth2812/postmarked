import { useState } from 'react'
import { LandingSequence } from './components/landing/LandingSequence'
import { HomePage } from './components/home/HomePage'
import './App.css'

function App() {
  const [showHome, setShowHome] = useState(false)

  return showHome ? (
    <HomePage />
  ) : (
    <LandingSequence onLandingComplete={() => setShowHome(true)} />
  )
}

export default App
