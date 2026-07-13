import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { ParticleMap } from './ParticleMap'
import './HomePage.css'

export function HomePage() {
  const [isAssembled, setIsAssembled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight
      if (totalScroll <= 0) return
      const progress = window.scrollY / totalScroll
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="home-page">
      {/* Top Left: Logo */}
      <div className="home-logo">
        <img src="/assets/main-logo.svg" alt="Postmarked" />
      </div>

      {/* Right Side: Custom vertical text scrollbar */}
      <div className="right-nav-scrollbar">
        <div className="scrollbar-text">Collected over time.</div>
        <div className="scrollbar-track">
          <div
            className="scrollbar-handle"
            style={{ top: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Center: R3F Canvas Container */}
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 10], fov: 60, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={['#000000']} />
          <ParticleMap
            showPolaroids={isAssembled}
            onAssemblyComplete={() => setIsAssembled(true)}
          />
        </Canvas>
      </div>

      {/* Spacer to make the page scrollable */}
      <div className="scroll-spacer" />
    </main>
  )
}
