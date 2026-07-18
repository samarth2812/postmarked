import { useState, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { ParticleMap } from './ParticleMap'
import { ArchiveTimeline } from './ArchiveTimeline'
import Lenis from 'lenis'
import './HomePage.css'

export function HomePage() {
  const [isAssembled, setIsAssembled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // Unblock scrolling on the document body
    document.body.style.overflow = 'auto'

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
      autoRaf: true,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
    })
    lenisRef.current = lenis

    const handleScroll = () => {
      const scrollY = window.scrollY
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight
      if (totalScroll <= 0) return
      const progress = scrollY / totalScroll
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      lenis.destroy()
      // Restore the default body overflow to hidden
      document.body.style.overflow = 'hidden'
    }
  }, [])

  useEffect(() => {
    const handleLightboxToggle = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.open) {
        lenisRef.current?.stop()
        document.body.style.overflow = 'hidden'
      } else {
        lenisRef.current?.start()
        document.body.style.overflow = 'auto'
      }
    }

    window.addEventListener('lightbox-toggle', handleLightboxToggle)
    return () => {
      window.removeEventListener('lightbox-toggle', handleLightboxToggle)
    }
  }, [])

  const handleBackToMap = () => {
    lenisRef.current?.scrollTo(0, { duration: 1.2 })
  }

  // Show "Back to the Map" after scrolling 10% down the first screen
  const showBackToMap = scrollProgress > 0.1

  return (
    <div className="home-page-container">
      {/* Top Fixed Header */}
      <header className="fixed-archive-header">
        <div className="archive-header-logo">
          <img src="/assets/main-logo.svg" alt="Postmarked" />
        </div>
        <div className={`back-to-map-wrapper ${showBackToMap ? 'visible' : ''}`}>
          <button className="back-to-map-btn" onClick={handleBackToMap}>
            Back to the Map
          </button>
        </div>
      </header>

      {/* Hero Section (the Map experience) */}
      <section className="home-hero-section">
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
      </section>

      {/* Archive Timeline Section */}
      <ArchiveTimeline />
    </div>
  )
}

