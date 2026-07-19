import { useState } from 'react'
import { LandingSequence } from './components/landing/LandingSequence'
import { HomePage } from './components/home/HomePage'
import { AudioController } from './components/audio/AudioController'
import './App.css'

function App() {
  const [showHome, setShowHome] = useState(false)

  return (
    <>
      {showHome ? (
        <HomePage />
      ) : (
        <LandingSequence onLandingComplete={() => setShowHome(true)} />
      )}
      <AudioController />
    </>
  )
}

export default App

