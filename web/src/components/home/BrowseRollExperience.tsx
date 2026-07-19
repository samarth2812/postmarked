import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { CameraSvg } from './CameraSvg'
import { useAudioStore } from '../../store/audioStore'
import cameraClickUrl from '../../../../docs/figma/music/camera_click.mp3'
import './BrowseRollExperience.css'

interface PolaroidCard {
  caption: string;
  imageUrl?: string;
  description?: string;
}

interface LocationEntry {
  id: string;
  name: string;
  state: string;
  bgType: 'bg-theme-black' | 'bg-theme-white';
  polaroids: PolaroidCard[];
}

interface BrowseRollExperienceProps {
  location: LocationEntry;
  onClose: () => void;
  onShutterClick?: () => void;
  onMotorStart?: () => void;
  onPaperEject?: () => void;
  onPaperSlide?: () => void;
}

type InteractionStep =
  | 'focus-mode'      // overlay fading in
  | 'camera-entrance' // camera sliding up
  | 'idle'            // camera settling down
  | 'waiting-shutter' // hint text showing, waiting for click
  | 'shutter-clicked' // flash, shake, motor sound prep
  | 'ejecting'        // paper sliding upward
  | 'ejected';        // card resting, reveal instruction showing

export function BrowseRollExperience({
  location,
  onClose,
  onShutterClick,
  onMotorStart,
  onPaperEject,
  onPaperSlide
}: BrowseRollExperienceProps) {
  const [step, setStep] = useState<InteractionStep>('focus-mode')
  const [motorStarted, setMotorStarted] = useState(false)
  const [showHeroCard, setShowHeroCard] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isDeveloped, setIsDeveloped] = useState(false)
  const [navigationVisible, setNavigationVisible] = useState(false)
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null)
  const [revealProgress, setRevealProgress] = useState(0)

  const dragY = useMotionValue(0)
  const timersRef = useRef<number[]>([])
  const clickAudioRef = useRef<HTMLAudioElement | null>(null)

  // Preload camera click audio on mount
  useEffect(() => {
    const audio = new Audio(cameraClickUrl)
    audio.preload = 'auto'
    clickAudioRef.current = audio

    return () => {
      audio.pause()
    }
  }, [])

  const addTimer = (timerId: number) => {
    timersRef.current.push(timerId)
  }

  // Scroll lock and background blur on mount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    window.dispatchEvent(new CustomEvent('lightbox-toggle', { detail: { open: true } }))

    const homePage = document.querySelector('.home-page-container')
    homePage?.classList.add('blurred-under-overlay')

    const overlayTimer = window.setTimeout(() => {
      setStep('camera-entrance')
    }, 500)
    addTimer(overlayTimer)

    return () => {
      document.body.style.overflow = originalOverflow
      window.dispatchEvent(new CustomEvent('lightbox-toggle', { detail: { open: false } }))
      homePage?.classList.remove('blurred-under-overlay')
      timersRef.current.forEach(clearTimeout)
    }
  }, [])

  // Camera entrance transitions
  useEffect(() => {
    if (step === 'camera-entrance') {
      const cameraTimer = window.setTimeout(() => {
        setStep('idle')
      }, 700)
      addTimer(cameraTimer)
      return () => clearTimeout(cameraTimer)
    }

    if (step === 'idle') {
      const idleTimer = window.setTimeout(() => {
        setStep('waiting-shutter')
      }, 700)
      addTimer(idleTimer)
      return () => clearTimeout(idleTimer)
    }
  }, [step])

  // Shutter button press sequence
  const handleShutterClick = () => {
    // Play shutter sound on every click of the red button
    const audio = clickAudioRef.current
    const isAudioEnabled = useAudioStore.getState().isEnabled
    const globalVolume = useAudioStore.getState().volume
    if (audio && isAudioEnabled) {
      audio.volume = globalVolume
      audio.currentTime = 0
      audio.play().catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('Camera click play failed:', err)
        }
      })
    }

    if (step !== 'waiting-shutter') return

    setStep('shutter-clicked')
    onShutterClick?.()

    const motorTimer = window.setTimeout(() => {
      setMotorStarted(true)
      onMotorStart?.()
    }, 200)
    addTimer(motorTimer)

    const ejectTimer = window.setTimeout(() => {
      setStep('ejecting')
      onPaperEject?.()
      onPaperSlide?.()
    }, 400)
    addTimer(ejectTimer)
  }

  // Monitor ejection end and transition to hero mode
  useEffect(() => {
    if (step === 'ejecting') {
      const ejectionTimer = window.setTimeout(() => {
        setStep('ejected')
        setShowHeroCard(true)
      }, 2200)
      addTimer(ejectionTimer)
      return () => clearTimeout(ejectionTimer)
    }
  }, [step])

  // Map drag distance to reveal progress of chemical development
  useEffect(() => {
    const unsubscribe = dragY.on('change', (latest) => {
      // dragConstraint is 0 to -160, so divide by -160
      const progress = Math.min(100, Math.max(0, (latest / -160) * 100))
      setRevealProgress(progress)

      if (progress >= 95) {
        setIsDeveloped((prev) => {
          if (!prev) {
            // Pause 1s for appreciation before showing navigation controls
            const navTimer = window.setTimeout(() => {
              setNavigationVisible(true)
            }, 1000)
            addTimer(navTimer)
            return true
          }
          return prev
        })
      }
    })
    return () => unsubscribe()
  }, [dragY])

  // Reset helper when transitioning between memories
  const resetForNextPhoto = () => {
    setStep('camera-entrance')
    setShowHeroCard(false)
    setMotorStarted(false)
    setRevealProgress(0)
    setIsDeveloped(false)
    setNavigationVisible(false)
    setExitDirection(null)
    dragY.set(0)
  }

  // Navigate to Next Memory
  const handleNext = () => {
    if (exitDirection || !location.polaroids.length) return
    setExitDirection('left')
    const transitionTimer = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % location.polaroids.length)
      resetForNextPhoto()
    }, 600)
    addTimer(transitionTimer)
  }

  // Navigate to Previous Memory
  const handlePrev = () => {
    if (exitDirection || !location.polaroids.length) return
    setExitDirection('right')
    const transitionTimer = window.setTimeout(() => {
      setActiveIndex((prev) => (prev - 1 + location.polaroids.length) % location.polaroids.length)
      resetForNextPhoto()
    }, 600)
    addTimer(transitionTimer)
  }

  // Fallback photo object
  const activePhoto = location.polaroids && location.polaroids[activeIndex]
    ? location.polaroids[activeIndex]
    : { imageUrl: '', caption: '', description: '' }

  // Spring settings for slide up entrance
  const cameraEntranceTransition = {
    type: 'spring',
    stiffness: 110,
    damping: 17,
    mass: 1.15
  }

  return createPortal(
    <div className="browse-experience-root">
      {/* Frosted Glass Overlay */}
      <motion.div
        className="glass-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        onClick={step === 'waiting-shutter' || isDeveloped ? onClose : undefined}
      />

      {/* Main Interactive Stage */}
      <div className="experience-stage">
        {/* Camera Stage (rendered absolute and layered, slides down on focus change) */}
        <motion.div
          className="camera-vibration-wrapper"
          animate={
            step === 'shutter-clicked'
              ? {
                  x: [0, -3, 3, -2, 2, -1, 1, 0],
                  y: [0, 2, -2, 1, -1, 1, -1, 0],
                  transition: { duration: 0.22, ease: 'linear' }
                }
              : {}
          }
          style={{
            pointerEvents: showHeroCard ? 'none' : 'auto'
          }}
        >
          <div className="camera-relative-box">
            {/* Polaroid Ejection Slot Container */}
            <div className="polaroid-ejection-container">
              {!showHeroCard && (
                <motion.div
                  layoutId="active-polaroid-card"
                  className="experience-polaroid-card"
                  initial={{ y: '-100%', opacity: 0 }}
                  animate={
                    step === 'ejecting' || step === 'ejected'
                      ? {
                          y: ["-97%", "-92%", "-92%", "-4%", "-5%"],
                          opacity: 1,
                          rotate: [0, -0.4, 0.4, -0.2, 0.2, 0],
                          scaleX: [1, 0.997, 1.003, 1],
                          transition: {
                            y: {
                              duration: 2.2,
                              times: [0, 0.1, 0.22, 0.94, 1.0],
                              ease: ["easeOut", "linear", [0.25, 0.46, 0.45, 0.94], "easeOut"]
                            },
                            rotate: { duration: 1.8, ease: 'easeInOut' },
                            scaleX: { duration: 1.8, ease: 'easeInOut' }
                          }
                        }
                      : motorStarted
                      ? {
                          y: '-97%',
                          opacity: 1,
                          transition: { duration: 0.1 }
                        }
                      : { y: '-100%', opacity: 0 }
                  }
                >
                  <div className="polaroid-image-area" />
                </motion.div>
              )}
            </div>

            {/* Opaque Instax Camera SVG */}
            <motion.div
              className="camera-body-wrapper"
              initial={{ y: '100vh' }}
              animate={step !== 'focus-mode' && !showHeroCard ? { y: '0vh' } : { y: '100vh' }}
              transition={cameraEntranceTransition}
            >
              <CameraSvg
                className="instax-camera-svg"
                onShutterClick={handleShutterClick}
              />

              {/* Shutter Click Hint Sticker */}
              {step === 'waiting-shutter' && (
                <div className="shutter-click-me-hint">
                  <span className="hint-text">CLICK ME!</span>
                  <svg className="hint-arrow" width="60" height="45" viewBox="0 0 60 45" fill="none" stroke="currentColor">
                    <path d="M10,5 Q30,8 48,32" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M36,32 L48,32 L48,20" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}

              {/* Breathing shadow beneath the camera */}
              <motion.div
                className="camera-shadow"
                animate={{
                  scale: [0.97, 1.03, 0.97],
                  opacity: [0.35, 0.5, 0.35]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              />

              {/* Lens bloom flash overlay */}
              <motion.div
                className="lens-bloom-overlay"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={
                  step === 'shutter-clicked'
                    ? {
                        opacity: [0, 0.95, 0],
                        scale: [0.7, 1.9, 2.4],
                        transition: { duration: 0.24, ease: 'easeOut' }
                      }
                    : { opacity: 0 }
                }
              />

              {/* Flash window burst overlay */}
              <motion.div
                className="flash-burst-overlay"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={
                  step === 'shutter-clicked'
                    ? {
                        opacity: [0, 1, 0],
                        scale: [0.5, 2.4, 3.2],
                        transition: { duration: 0.2, ease: 'easeOut' }
                      }
                    : { opacity: 0 }
                }
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Hero Polaroid Stage (fades layout in and zooms, displays in front) */}
        {showHeroCard && (
          <div className="hero-polaroid-stage">
            <motion.div
              layoutId="active-polaroid-card"
              className="experience-polaroid-card hero-card"
              animate={
                exitDirection === 'left'
                  ? { x: '-120vw', rotate: -15, transition: { duration: 0.6, ease: 'easeIn' } }
                  : exitDirection === 'right'
                  ? { x: '120vw', rotate: 15, transition: { duration: 0.6, ease: 'easeIn' } }
                  : { x: 0, rotate: 0 }
              }
              transition={{
                type: 'spring',
                stiffness: 90,
                damping: 16,
                mass: 1.05
              }}
            >
              <div className="polaroid-image-area">
                {/* Color Image Layer */}
                {activePhoto.imageUrl && (
                  <img
                    src={activePhoto.imageUrl}
                    alt={activePhoto.caption}
                    className="polaroid-img-colored"
                    style={{ opacity: isDeveloped ? 1 : revealProgress / 100 }}
                  />
                )}

                {/* Dark chemical developer mask overlay */}
                {!isDeveloped && (
                  <motion.div
                    className="polaroid-developer-mask"
                    style={{
                      height: `${100 - revealProgress}%`
                    }}
                  />
                )}

                {/* Draggable reveal handler */}
                {!isDeveloped && (
                  <motion.div
                    className="polaroid-drag-handle"
                    drag="y"
                    dragConstraints={{ top: -160, bottom: 0 }}
                    dragElastic={0.05}
                    dragMomentum={false}
                    style={{ y: dragY }}
                  >
                    <div className="drag-indicator-arrow">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15"></polyline>
                      </svg>
                      <span>Drag Up</span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Pure CSS format label & caption area matching the timeline */}
              <div className="polaroid-label-area-hero">
                <div className="polaroid-format-label-hero">Postmarked Archive Film</div>
                <div className="polaroid-caption-strip-hero">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isDeveloped ? 1 : revealProgress / 100 }}
                    transition={{ duration: 0.5 }}
                  >
                    {activePhoto.caption}
                  </motion.span>
                </div>
              </div>
            </motion.div>

            {/* Sub-text description of the memory visible below card when developed */}
            <AnimatePresence>
              {isDeveloped && activePhoto.description && (
                <motion.div
                  className="polaroid-description-box"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 0.85, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {/* {activePhoto.description} */}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Elegant Navigation Controls */}
        <AnimatePresence>
          {navigationVisible && (
            <motion.div
              className="experience-navigation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <button className="nav-btn prev" onClick={handlePrev} aria-label="Previous memory">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Previous</span>
              </button>

              <div className="nav-counter">
                {activeIndex + 1} / {location.polaroids.length}
              </div>

              <button className="nav-btn next" onClick={handleNext} aria-label="Next memory">
                <span>Next</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text Instruction Overlay */}
        <div className="instruction-wrapper">
          <AnimatePresence mode="wait">
            {step === 'waiting-shutter' && (
              <motion.div
                key="shutter-hint"
                className="experience-instruction"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                Press the red shutter to reveal the memories
              </motion.div>
            )}

            {step === 'ejected' && !isDeveloped && (
              <motion.div
                key="develop-hint"
                className="experience-instruction"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                Drag gently to develop
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Close Button (top-right of screen) */}
        <button
          className="experience-close-btn"
          onClick={onClose}
          aria-label="Close interaction"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  )
}
