import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioStore } from '../../store/audioStore'
import pauseIcon from '../../../../docs/figma/music/pause.svg'
import resumeIcon from '../../../../docs/figma/music/Resume.svg'
import './AudioController.css'

export function AudioController() {
  const { isEnabled, volume, togglePlayPause, setVolume } = useAudioStore()
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const isExpanded = isHovered || isFocused

  return (
    <motion.div
      className="global-audio-controller-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0.8, y: 0 }}
      whileHover={{
        y: -2.5,
        opacity: 1,
        filter: 'drop-shadow(0 4px 16px rgba(255, 255, 255, 0.08))',
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      <div className="cta-container">
        <AnimatePresence mode="wait">
          {isEnabled ? (
            <motion.div
              key="pause-cta"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
              style={{ position: 'relative' }}
            >
              <button
                className="audio-journey-btn"
                onClick={togglePlayPause}
                aria-label="Pause the Journey"
              >
                <img
                  src={pauseIcon}
                  alt="Pause the Journey"
                  className="audio-cta-svg"
                  style={{ width: 207 }}
                  draggable="false"
                />
                {/* 4 Equalizer Bars */}
                <div className={`equalizer-container ${isEnabled ? 'playing' : ''}`}>
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                  <div className="equalizer-bar" />
                </div>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="resume-cta"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: 'easeInOut' }}
            >
              <button
                className="audio-journey-btn"
                onClick={togglePlayPause}
                aria-label="Resume the Journey"
              >
                <img
                  src={resumeIcon}
                  alt="Resume the Journey"
                  className="audio-cta-svg"
                  style={{ width: 222 }}
                  draggable="false"
                />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Minimal Volume Slider expanding to the right */}
      <motion.div
        className="volume-slider-container-new"
        animate={{
          width: isExpanded ? 112 : 0,
          opacity: isExpanded ? 1 : 0,
          marginLeft: isExpanded ? 12 : 0,
          paddingLeft: isExpanded ? 16 : 0,
          paddingRight: isExpanded ? 16 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 220,
          damping: 22,
        }}
      >
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="audio-volume-slider-new"
          aria-label="Volume Control"
        />
      </motion.div>
    </motion.div>
  )
}
