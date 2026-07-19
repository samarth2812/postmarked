import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioStore } from '../../store/audioStore'
import controlsIcon from '../../../../docs/figma/music/controls.svg'
import playAlbumIcon from '../../../../docs/figma/music/play-album.svg'
import './AudioController.css'

export function AudioController() {
  const { isEnabled, volume, togglePlayPause, setVolume } = useAudioStore()
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const isExpanded = isHovered || isFocused

  return (
    <motion.div
      className="global-audio-controller"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{
        width: isExpanded ? 168 : 48,
      }}
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 22,
      }}
    >
      <motion.div
        className="volume-slider-wrapper"
        animate={{
          width: isExpanded ? 104 : 0,
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
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
          className="audio-volume-slider"
          aria-label="Volume Control"
        />
      </motion.div>

      <motion.button
        className="audio-control-btn"
        onClick={togglePlayPause}
        whileHover={{
          scale: 1.1,
          boxShadow: '0 0 15px rgba(255, 255, 255, 0.45)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        aria-label={isEnabled ? "Pause Music" : "Play Music"}
      >
        <AnimatePresence mode="wait">
          {isEnabled ? (
            <motion.img
              key="pause"
              src={playAlbumIcon}
              initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              alt="Pause"
              draggable="false"
            />
          ) : (
            <motion.img
              key="play"
              src={controlsIcon}
              initial={{ opacity: 0, scale: 0.6, rotate: 45 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.6, rotate: -45 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              alt="Play"
              draggable="false"
            />
          )}
        </AnimatePresence>
      </motion.button>
    </motion.div>
  )
}
