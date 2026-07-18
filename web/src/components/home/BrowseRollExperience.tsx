import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CameraSvg } from './CameraSvg'
import './BrowseRollExperience.css'

interface LocationEntry {
  id: string;
  name: string;
  state: string;
  bgType: 'bg-theme-black' | 'bg-theme-white';
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

  useEffect(() => {
    // 1. Lock scrolling on body
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Lock Lenis scroll
    window.dispatchEvent(new CustomEvent('lightbox-toggle', { detail: { open: true } }))

    // 2. Blur the underlying page content
    const homePage = document.querySelector('.home-page-container')
    homePage?.classList.add('blurred-under-overlay')

    // 3. Step transitions
    // Focus overlay finishes fading in after 500ms
    const overlayTimer = setTimeout(() => {
      setStep('camera-entrance')
    }, 500)

    return () => {
      document.body.style.overflow = originalOverflow
      window.dispatchEvent(new CustomEvent('lightbox-toggle', { detail: { open: false } }))
      homePage?.classList.remove('blurred-under-overlay')
      clearTimeout(overlayTimer)
    }
  }, [])

  useEffect(() => {
    if (step === 'camera-entrance') {
      // Camera slide up takes ~700ms
      const cameraTimer = setTimeout(() => {
        setStep('idle')
      }, 700)
      return () => clearTimeout(cameraTimer)
    }

    if (step === 'idle') {
      // Pause briefly for 700ms in idle state
      const idleTimer = setTimeout(() => {
        setStep('waiting-shutter')
      }, 700)
      return () => clearTimeout(idleTimer)
    }
  }, [step])

  const handleShutterClick = () => {
    if (step !== 'waiting-shutter') return

    setStep('shutter-clicked')
    // Trigger shutter sound hook
    onShutterClick?.()

    // Trigger motor start sound hook after 200ms
    const motorTimer = setTimeout(() => {
      setMotorStarted(true)
      onMotorStart?.()
    }, 200)

    // Trigger paper ejection after 400ms (200ms after motor start)
    const ejectTimer = setTimeout(() => {
      setStep('ejecting')
      onPaperEject?.()
      onPaperSlide?.()
    }, 400)

    return () => {
      clearTimeout(motorTimer)
      clearTimeout(ejectTimer)
    }
  }

  useEffect(() => {
    if (step === 'ejecting') {
      // Polaroid ejection takes 2.0s
      const ejectionTimer = setTimeout(() => {
        setStep('ejected')
      }, 2000)
      return () => clearTimeout(ejectionTimer)
    }
  }, [step])

  // Camera slide up transition spring settings
  const cameraEntranceTransition = {
    type: 'spring',
    stiffness: 110,
    damping: 17,
    mass: 1.15
  }

  // Polaroid ejection sliding animation settings (mechanical movement)
  const polaroidEjectionTransition = {
    duration: 2.0,
    ease: [0.16, 1, 0.3, 1] // smooth easeOut settle
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
        onClick={step === 'waiting-shutter' || step === 'ejected' ? onClose : undefined}
      />

      {/* Main Interactive Stage */}
      <div className="experience-stage">
        {/* Camera and Polaroid Container */}
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
        >
          <div className="camera-relative-box">
            {/* Polaroid Ejection Slot Container */}
            <div className="polaroid-ejection-container">
              <motion.div
                className="polaroid-card"
                initial={{ y: '-100%', opacity: 0 }}
                animate={
                  step === 'ejecting' || step === 'ejected'
                    ? {
                        y: '-5%',
                        opacity: 1,
                        rotate: [0, -0.4, 0.4, -0.2, 0.2, 0],
                        scaleX: [1, 0.997, 1.003, 1],
                        transition: {
                          y: polaroidEjectionTransition,
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
            </div>

            {/* Opaque Instax Camera SVG */}
            <motion.div
              className="camera-body-wrapper"
              initial={{ y: '100vh' }}
              animate={step !== 'focus-mode' ? { y: '0vh' } : { y: '100vh' }}
              transition={cameraEntranceTransition}
            >
              <CameraSvg
                className="instax-camera-svg"
                onShutterClick={handleShutterClick}
              />

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
                Press the shutter to reveal the first memory
              </motion.div>
            )}

            {step === 'ejected' && (
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
