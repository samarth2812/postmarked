import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudioStore } from '../../store/audioStore'
import { gsap } from 'gsap'
import './HomepageAudioController.css'

// Import audio assets
import goldenHourUrl from '../../../../docs/figma/music/goldern_hour.mp3'
import timeTravelUrl from '../../../../docs/figma/music/time-travel.mp3'
import cityLightsUrl from '../../../../docs/figma/music/city_lights.mp3'
import dayDreamUrl from '../../../../docs/figma/music/day_dream.mp3'

// Track metadata
const TRACKS = [
  { id: 'golden_hour', name: 'Golden Hour', url: goldenHourUrl },
  { id: 'time_travel', name: 'Time Travel', url: timeTravelUrl },
  { id: 'city_lights', name: 'City Lights', url: cityLightsUrl },
  { id: 'day_dream', name: 'Day Dream', url: dayDreamUrl },
]

// Singleton audio instances for preloading and playing
const audioInstances: Record<string, HTMLAudioElement> = {}
TRACKS.forEach((track) => {
  const audio = new Audio(track.url)
  audio.preload = 'auto'
  audio.loop = true
  audio.volume = 0
  audio.load() // Preload
  audioInstances[track.id] = audio
})

// Volume scale tracking for GSAP tweens
const volumeScales: Record<string, { value: number }> = {
  golden_hour: { value: 0 },
  time_travel: { value: 0 },
  city_lights: { value: 0 },
  day_dream: { value: 0 },
}

interface HomepageAudioControllerProps {
  isAssembled: boolean
}

export function HomepageAudioController({ isAssembled }: HomepageAudioControllerProps) {
  const { isEnabled, volume, togglePlayPause, setVolume, isBrowseRollActive } = useAudioStore()
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasAutoplayed = useRef(false)

  const isExpanded = isHovered || isFocused

  // Play a track and fade it in
  const playTrack = (trackId: string, duration = 1.2) => {
    const audio = audioInstances[trackId]
    if (!audio) return

    // Pause all other tracks and reset their volume scale
    Object.keys(audioInstances).forEach((id) => {
      if (id !== trackId) {
        const otherAudio = audioInstances[id]
        otherAudio.pause()
        gsap.killTweensOf(volumeScales[id])
        volumeScales[id].value = 0
        otherAudio.volume = 0
      }
    })

    // Start playing
    audio.play().catch((err) => {
      console.warn('Playback blocked by browser autoplay policy, waiting for user interaction:', err)
    })

    // Fade in volume scale
    gsap.killTweensOf(volumeScales[trackId])
    gsap.to(volumeScales[trackId], {
      value: 1,
      duration: duration,
      ease: 'power1.out',
      onUpdate: () => {
        audio.volume = volumeScales[trackId].value * useAudioStore.getState().volume
      },
    })
  }

  // Fade out a track and pause it
  const pauseTrack = (trackId: string, duration = 0.5) => {
    const audio = audioInstances[trackId]
    if (!audio) return

    gsap.killTweensOf(volumeScales[trackId])
    gsap.to(volumeScales[trackId], {
      value: 0,
      duration: duration,
      ease: 'power1.in',
      onUpdate: () => {
        audio.volume = volumeScales[trackId].value * useAudioStore.getState().volume
      },
      onComplete: () => {
        audio.pause()
      },
    })
  }

  // Fade out current track helper
  const fadeTrackOutHelper = (trackId: string, duration: number) => {
    return new Promise<void>((resolve) => {
      const audio = audioInstances[trackId]
      if (!audio || audio.paused) {
        resolve()
        return
      }

      gsap.killTweensOf(volumeScales[trackId])
      gsap.to(volumeScales[trackId], {
        value: 0,
        duration: duration,
        ease: 'power1.inOut',
        onUpdate: () => {
          audio.volume = volumeScales[trackId].value * useAudioStore.getState().volume
        },
        onComplete: () => {
          audio.pause()
          resolve()
        },
      })
    })
  }

  // Switch tracks with crossfading
  const switchTrack = async (newIndex: number) => {
    const oldTrackId = TRACKS[currentTrackIndex].id
    const newTrackId = TRACKS[newIndex].id

    setCurrentTrackIndex(newIndex)
    setIsPlaylistOpen(false)

    if (isEnabled && !isBrowseRollActive) {
      // Fade out old track completely, then fade in new track
      await fadeTrackOutHelper(oldTrackId, 0.6)
      playTrack(newTrackId, 1.0)
    } else {
      // If paused, just swap without playing
      const oldAudio = audioInstances[oldTrackId]
      if (oldAudio) {
        oldAudio.pause()
        oldAudio.currentTime = 0
      }
      gsap.killTweensOf(volumeScales[oldTrackId])
      volumeScales[oldTrackId].value = 0

      gsap.killTweensOf(volumeScales[newTrackId])
      volumeScales[newTrackId].value = 0
    }
  }

  // Synchronize play/pause state when isEnabled, isBrowseRollActive, or isAssembled changes
  useEffect(() => {
    if (!isAssembled) return

    const currentTrackId = TRACKS[currentTrackIndex].id
    if (isEnabled && !isBrowseRollActive) {
      const audio = audioInstances[currentTrackId]
      if (audio && audio.paused) {
        playTrack(currentTrackId, hasAutoplayed.current ? 1.0 : 1.5)
        hasAutoplayed.current = true
      }
    } else {
      const audio = audioInstances[currentTrackId]
      if (audio && !audio.paused) {
        pauseTrack(currentTrackId, isBrowseRollActive ? 0.4 : 0.5)
      }
    }
  }, [isEnabled, isBrowseRollActive, isAssembled, currentTrackIndex])

  // Synchronize playing volume when global volume changes
  useEffect(() => {
    const currentTrackId = TRACKS[currentTrackIndex].id
    const audio = audioInstances[currentTrackId]
    if (audio && isEnabled && !isBrowseRollActive) {
      audio.volume = volumeScales[currentTrackId].value * volume
    }
  }, [volume, currentTrackIndex, isEnabled, isBrowseRollActive])

  // Click outside listener for dropdown closing
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPlaylistOpen(false)
      }
    }

    if (isPlaylistOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isPlaylistOpen])

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      Object.keys(audioInstances).forEach((id) => {
        audioInstances[id].pause()
        gsap.killTweensOf(volumeScales[id])
        volumeScales[id].value = 0
      })
    }
  }, [])

  const showPlayingState = isEnabled && !isBrowseRollActive

  return (
    <div
      className="homepage-audio-controller-wrapper"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={dropdownRef}
    >
      <div className="homepage-cta-container">
        <AnimatePresence mode="wait">
          {showPlayingState ? (
            <motion.button
              key="playing-cta"
              className="homepage-audio-btn"
              onClick={(e) => {
                e.stopPropagation()
                togglePlayPause()
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              aria-label="Pause the Journey"
            >
              {/* music_play_with_list.svg Inline */}
              <svg width="162" height="59" viewBox="0 0 162 59" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#filter0_dd_315_85)">
                  <g clipPath="url(#clip0_315_85)">
                    <g filter="url(#filter1_di_315_85)">
                      <g clipPath="url(#clip1_315_85)">
                        <rect x="8" y="7" width="150.211" height="43" rx="21.5" fill="white" />
                        <g filter="url(#filter2_f_315_85)">
                          <rect x="-168" y="-171" width="400" height="400" fill="url(#pattern0_315_85)" />
                        </g>
                        <g opacity="0.3" style={{ mixBlendMode: 'saturation' }}>
                          <rect x="8" y="7" width="150.211" height="43" fill="#0000FF" style={{ mixBlendMode: 'saturation' }} />
                          <rect x="8" y="7" width="150.211" height="43" fill="#00FF00" style={{ mixBlendMode: 'saturation' }} />
                          <rect x="8" y="7" width="150.211" height="43" fill="#FF0000" style={{ mixBlendMode: 'saturation' }} />
                        </g>
                        <g clipPath="url(#paint0_angular_315_85_clip_path)" data-figma-skip-parse="true">
                          <g transform="matrix(0 0.2 -0.2 0 32 29)">
                            <foreignObject x="-1005" y="-1005" width="2010" height="2010">
                              <div
                                xmlns="http://www.w3.org/1999/xhtml"
                                style={{
                                  background: 'conic-gradient(from 90deg,rgba(0, 0, 5, 1) 0deg,rgba(0, 0, 0, 1) 4.52418deg,rgba(0, 0, 0, 1) 6.26747deg,rgba(0, 0, 2, 1) 12.7613deg,rgba(1, 47, 3, 1) 14.5992deg,rgba(88, 110, 160, 1) 18.333deg,rgba(195, 228, 199, 1) 33.2955deg,rgba(173, 229, 216, 1) 37.2578deg,rgba(216, 235, 242, 1) 49.7547deg,rgba(182, 237, 207, 1) 72.6581deg,rgba(26, 145, 197, 1) 75.7268deg,rgba(3, 13, 126, 1) 77.2464deg,rgba(11, 2, 7, 1) 91.2179deg,rgba(26, 17, 20, 1) 100.105deg,rgba(30, 22, 33, 1) 109.179deg,rgba(80, 177, 209, 1) 132.035deg,rgba(53, 19, 106, 1) 134.901deg,rgba(51, 3, 79, 1) 167.029deg,rgba(137, 16, 119, 1) 175.225deg,rgba(250, 12, 136, 1) 180.933deg,rgba(240, 237, 186, 1) 196.529deg,rgba(248, 218, 87, 1) 219.828deg,rgba(223, 59, 46, 1) 235.609deg,rgba(18, 26, 101, 1) 236.198deg,rgba(8, 0, 11, 1) 251.319deg,rgba(2, 6, 41, 1) 269.913deg,rgba(12, 9, 36, 1) 271.818deg,rgba(19, 15, 32, 1) 283.163deg,rgba(20, 34, 79, 1) 294.211deg,rgba(6, 9, 64, 1) 312.234deg,rgba(5, 3, 52, 1) 314.478deg,rgba(3, 0, 29, 1) 324.395deg,rgba(1, 0, 79, 1) 337.704deg,rgba(0, 0, 53, 1) 340.87deg,rgba(1, 0, 31, 1) 344.828deg,rgba(0, 0, 24, 1) 352.98deg,rgba(0, 0, 12, 1) 354.797deg,rgba(0, 0, 5, 1) 360deg)',
                                  height: '100%',
                                  width: '100%',
                                  opacity: 1
                                }}
                              />
                            </foreignObject>
                          </g>
                        </g>
                        <g clipPath="url(#paint1_angular_315_85_clip_path)" data-figma-skip-parse="true">
                          <g transform="matrix(0 0.185185 -0.185185 0 32 29)">
                            <foreignObject x="-1085.4" y="-1085.4" width="2170.8" height="2170.8">
                              <div
                                xmlns="http://www.w3.org/1999/xhtml"
                                style={{
                                  background: 'conic-gradient(from 90deg,rgba(104, 69, 135, 1) 0deg,rgba(117, 58, 122, 1) 4.59288deg,rgba(78, 34, 132, 1) 6.37906deg,rgba(76, 40, 127, 1) 12.6911deg,rgba(88, 178, 117, 1) 14.598deg,rgba(193, 209, 232, 1) 18.317deg,rgba(237, 248, 239, 1) 33.5689deg,rgba(225, 250, 244, 1) 36.9247deg,rgba(242, 252, 251, 1) 49.9771deg,rgba(226, 250, 234, 1) 72.6581deg,rgba(100, 212, 226, 1) 75.6575deg,rgba(25, 67, 188, 1) 77.3893deg,rgba(45, 22, 28, 1) 91.2241deg,rgba(64, 56, 45, 1) 100.189deg,rgba(63, 55, 58, 1) 109.033deg,rgba(93, 142, 185, 1) 131.787deg,rgba(70, 31, 99, 1) 134.868deg,rgba(60, 16, 75, 1) 166.872deg,rgba(90, 28, 91, 1) 174.942deg,rgba(161, 30, 96, 1) 186.09deg,rgba(205, 182, 115, 1) 202.704deg,rgba(236, 189, 73, 1) 220.011deg,rgba(225, 70, 39, 1) 235.55deg,rgba(23, 45, 95, 1) 236.214deg,rgba(37, 14, 32, 1) 251.444deg,rgba(10, 37, 80, 1) 269.997deg,rgba(48, 47, 88, 1) 271.729deg,rgba(80, 76, 97, 1) 283.008deg,rgba(99, 139, 169, 1) 294.268deg,rgba(84, 132, 170, 1) 311.898deg,rgba(88, 73, 168, 1) 314.157deg,rgba(96, 58, 157, 1) 324.436deg,rgba(72, 82, 180, 1) 337.84deg,rgba(94, 102, 177, 1) 340.971deg,rgba(69, 48, 143, 1) 344.863deg,rgba(70, 59, 151, 1) 352.832deg,rgba(90, 83, 151, 1) 354.523deg,rgba(104, 69, 135, 1) 360deg)',
                                  height: '100%',
                                  width: '100%',
                                  opacity: 1
                                }}
                              />
                            </foreignObject>
                          </g>
                        </g>
                        <circle cx="32" cy="29" r="200" fill="url(#paint2_radial_315_85)" style={{ mixBlendMode: 'difference' }} />
                        <rect x="8" y="7" width="150.211" height="43" fill="url(#paint3_linear_315_85)" fillOpacity="0.3" style={{ mixBlendMode: 'overlay' }} />
                        <rect x="8" y="7" width="150.211" height="43" fill="#D9D9D9" style={{ mixBlendMode: 'hard-light' }} />
                        <rect x="8" y="7" width="150.211" height="43" fill="white" fillOpacity="0.05" style={{ mixBlendMode: 'exclusion' }} />
                      </g>
                    </g>
                    {/* Animated Equalizer Bars - Replacing static path */}
                    <g className="homepage-equalizer playing">
                      <rect x="26.5" y="26" width="1.5" height="5" rx="0.75" fill="black" fillOpacity="0.9" className="eq-bar eq-bar-1" />
                      <rect x="29" y="22" width="1.5" height="13" rx="0.75" fill="black" fillOpacity="0.9" className="eq-bar eq-bar-2" />
                      <rect x="31.5" y="24" width="1.5" height="9" rx="0.75" fill="black" fillOpacity="0.9" className="eq-bar eq-bar-3" />
                      <rect x="34" y="26" width="1.5" height="5" rx="0.75" fill="black" fillOpacity="0.9" className="eq-bar eq-bar-4" />
                      <rect x="36.5" y="25" width="1.5" height="7" rx="0.75" fill="black" fillOpacity="0.9" className="eq-bar eq-bar-5" />
                    </g>
                    {/* Vectorized "Pause the Journey" */}
                    <path d="M48.5 25V17.8H51.92C52.4533 17.8 52.91 17.8933 53.29 18.08C53.6767 18.2667 53.9733 18.5267 54.18 18.86C54.3933 19.1933 54.5 19.5833 54.5 20.03C54.5 20.4767 54.3933 20.87 54.18 21.21C53.9667 21.55 53.6667 21.8167 53.28 22.01C52.9 22.1967 52.4467 22.29 51.92 22.29H49.72V21.11H51.84C52.1933 21.11 52.4667 21.0133 52.66 20.82C52.86 20.62 52.96 20.36 52.96 20.04C52.96 19.72 52.86 19.4633 52.66 19.27C52.4667 19.0767 52.1933 18.98 51.84 18.98H50.04V25H48.5ZM58.3967 25C58.3567 24.8533 58.3267 24.6967 58.3067 24.53C58.2934 24.3633 58.2867 24.17 58.2867 23.95H58.2467V21.54C58.2467 21.3333 58.1767 21.1733 58.0367 21.06C57.9034 20.94 57.7034 20.88 57.4367 20.88C57.1834 20.88 56.9801 20.9233 56.8267 21.01C56.6801 21.0967 56.5834 21.2233 56.5367 21.39H55.1067C55.1734 20.93 55.4101 20.55 55.8167 20.25C56.2234 19.95 56.7801 19.8 57.4867 19.8C58.2201 19.8 58.7801 19.9633 59.1667 20.29C59.5534 20.6167 59.7467 21.0867 59.7467 21.7V23.95C59.7467 24.1167 59.7567 24.2867 59.7767 24.46C59.8034 24.6267 59.8434 24.8067 59.8967 25H58.3967ZM56.6167 25.1C56.1101 25.1 55.7067 24.9733 55.4067 24.72C55.1067 24.46 54.9567 24.1167 54.9567 23.69C54.9567 23.2167 55.1334 22.8367 55.4867 22.55C55.8467 22.2567 56.3467 22.0667 56.9867 21.98L58.4767 21.77V22.64L57.2367 22.83C56.9701 22.87 56.7734 22.9433 56.6467 23.05C56.5201 23.1567 56.4567 23.3033 56.4567 23.49C56.4567 23.6567 56.5167 23.7833 56.6367 23.87C56.7567 23.9567 56.9167 24 57.1167 24C57.4301 24 57.6967 23.9167 57.9167 23.75C58.1367 23.5767 58.2467 23.3767 58.2467 23.15L58.3867 23.95C58.2401 24.33 58.0167 24.6167 57.7167 24.81C57.4167 25.0033 57.0501 25.1 56.6167 25.1ZM62.4859 25.1C62.1259 25.1 61.8159 25.0233 61.5559 24.87C61.3026 24.71 61.1093 24.5 60.9759 24.24C60.8426 23.9733 60.7759 23.6767 60.7759 23.35V19.9H62.2759V23.06C62.2759 23.34 62.3459 23.55 62.4859 23.69C62.6259 23.83 62.8226 23.9 63.0759 23.9C63.3026 23.9 63.5026 23.8467 63.6759 23.74C63.8493 23.6333 63.9859 23.4867 64.0859 23.3C64.1926 23.1067 64.2459 22.8867 64.2459 22.64L64.3759 23.87C64.2093 24.2367 63.9659 24.5333 63.6459 24.76C63.3259 24.9867 62.9393 25.1 62.4859 25.1ZM64.2759 25V23.8H64.2459V19.9H65.7459V25H64.2759ZM69.1409 25.1C68.3942 25.1 67.8009 24.95 67.3609 24.65C66.9209 24.35 66.6809 23.9367 66.6409 23.41H67.9809C68.0142 23.6367 68.1275 23.81 68.3209 23.93C68.5209 24.0433 68.7942 24.1 69.1409 24.1C69.4542 24.1 69.6809 24.0567 69.8209 23.97C69.9675 23.8767 70.0409 23.7467 70.0409 23.58C70.0409 23.4533 69.9975 23.3567 69.9109 23.29C69.8309 23.2167 69.6809 23.1567 69.4609 23.11L68.6409 22.94C68.0342 22.8133 67.5875 22.6233 67.3009 22.37C67.0142 22.11 66.8709 21.7767 66.8709 21.37C66.8709 20.8767 67.0609 20.4933 67.4409 20.22C67.8209 19.94 68.3509 19.8 69.0309 19.8C69.7042 19.8 70.2409 19.9367 70.6409 20.21C71.0409 20.4767 71.2609 20.85 71.3009 21.33H69.9609C69.9342 21.1567 69.8409 21.0267 69.6809 20.94C69.5209 20.8467 69.2942 20.8 69.0009 20.8C68.7342 20.8 68.5342 20.84 68.4009 20.92C68.2742 20.9933 68.2109 21.1 68.2109 21.24C68.2109 21.36 68.2642 21.4567 68.3709 21.53C68.4775 21.5967 68.6542 21.6567 68.9009 21.71L69.8209 21.9C70.3342 22.0067 70.7209 22.2067 70.9809 22.5C71.2475 22.7867 71.3809 23.1267 71.3809 23.52C71.3809 24.02 71.1842 24.41 70.7909 24.69C70.4042 24.9633 69.8542 25.1 69.1409 25.1ZM74.8957 25.1C74.329 25.1 73.8357 24.99 73.4157 24.77C72.9957 24.5433 72.669 24.23 72.4357 23.83C72.209 23.43 72.0957 22.97 72.0957 22.45C72.0957 21.9233 72.209 21.4633 72.4357 21.07C72.669 20.67 72.9924 20.36 73.4057 20.14C73.819 19.9133 74.299 19.8 74.8457 19.8C75.3724 19.8 75.829 19.9067 76.2157 20.12C76.6024 20.3333 76.9024 20.63 77.1157 21.01C77.329 21.39 77.4357 21.8367 77.4357 22.35C77.4357 22.4567 77.4324 22.5567 77.4257 22.65C77.419 22.7367 77.409 22.82 77.3957 22.9H72.9757V21.91H76.1857L75.9257 22.09C75.9257 21.6767 75.8257 21.3733 75.6257 21.18C75.4324 20.98 75.1657 20.88 74.8257 20.88C74.4324 20.88 74.1257 21.0133 73.9057 21.28C73.6924 21.5467 73.5857 21.9467 73.5857 22.48C73.5857 23 73.6924 23.3867 73.9057 23.64C74.1257 23.8933 74.4524 24.02 74.8857 24.02C75.1257 24.02 75.3324 23.98 75.5057 23.9C75.679 23.82 75.809 23.69 75.8957 23.51H77.3057C77.139 24.0033 76.8524 24.3933 76.4457 24.68C76.0457 24.96 75.529 25.1 74.8957 25.1ZM82.9622 25.11C82.3089 25.11 81.8222 24.9533 81.5022 24.64C81.1889 24.32 81.0322 23.8367 81.0322 23.19V18.76L82.5322 18.2V23.24C82.5322 23.4667 82.5955 23.6367 82.7222 23.75C82.8489 23.8633 83.0455 23.92 83.3122 23.92C83.4122 23.92 83.5055 23.91 83.5922 23.89C83.6789 23.87 83.7655 23.8467 83.8522 23.82V24.96C83.7655 25.0067 83.6422 25.0433 83.4822 25.07C83.3289 25.0967 83.1555 25.11 82.9622 25.11ZM80.0822 21.04V19.9H83.8522V21.04H80.0822ZM84.9512 25V17.8H86.4512V25H84.9512ZM88.5012 25V21.84C88.5012 21.56 88.4278 21.35 88.2812 21.21C88.1412 21.07 87.9345 21 87.6612 21C87.4278 21 87.2178 21.0533 87.0312 21.16C86.8512 21.2667 86.7078 21.4133 86.6012 21.6C86.5012 21.7867 86.4512 22.0067 86.4512 22.26L86.3212 21.03C86.4878 20.6567 86.7312 20.36 87.0512 20.14C87.3778 19.9133 87.7778 19.8 88.2512 19.8C88.8178 19.8 89.2512 19.96 89.5512 20.28C89.8512 20.5933 90.0012 21.0167 90.0012 21.55V25H88.5012ZM93.7426 25.1C93.1759 25.1 92.6826 24.99 92.2626 24.77C91.8426 24.5433 91.5159 24.23 91.2826 23.83C91.0559 23.43 90.9426 22.97 90.9426 22.45C90.9426 21.9233 91.0559 21.4633 91.2826 21.07C91.5159 20.67 91.8392 20.36 92.2526 20.14C92.6659 19.9133 93.1459 19.8 93.6926 19.8C94.2192 19.8 94.6759 19.9067 95.0626 20.12C95.4492 20.3333 95.7492 20.63 95.9626 21.01C96.1759 21.39 96.2826 21.8367 96.2826 22.35C96.2826 22.4567 96.2792 22.5567 96.2726 22.65C96.2659 22.7367 96.2559 22.82 96.2426 22.9H91.8226V21.91H95.0326L94.7726 22.09C94.7726 21.6767 94.6726 21.3733 94.4726 21.18C94.2792 20.98 94.0126 20.88 93.6726 20.88C93.2792 20.88 92.9726 21.0133 92.7526 21.28C92.5392 21.5467 92.4326 21.9467 92.4326 22.48C92.4326 23 92.5392 23.3867 92.7526 23.64C92.9726 23.8933 93.2992 24.02 93.7326 24.02C93.9726 24.02 94.1792 23.98 94.3526 23.9C94.5259 23.82 94.6559 23.69 94.7426 23.51H96.1526C95.9859 24.0033 95.6992 24.3933 95.2926 24.68C94.8926 24.96 94.3759 25.1 93.7426 25.1ZM100.129 25.1C99.8757 25.1 99.6324 25.08 99.3991 25.04C99.1657 25.0067 98.9957 24.9633 98.8891 24.91V23.73C99.0091 23.7767 99.1524 23.8167 99.3191 23.85C99.4857 23.8833 99.6557 23.9 99.8291 23.9C100.202 23.9 100.472 23.84 100.639 23.72C100.812 23.5933 100.899 23.3667 100.899 23.04V17.8H102.439V23.11C102.439 23.7767 102.242 24.2767 101.849 24.61C101.456 24.9367 100.882 25.1 100.129 25.1ZM106.159 25.1C105.599 25.1 105.106 24.99 104.679 24.77C104.259 24.5433 103.929 24.23 103.689 23.83C103.456 23.4233 103.339 22.9567 103.339 22.43C103.339 21.9033 103.456 21.4433 103.689 21.05C103.929 20.6567 104.259 20.35 104.679 20.13C105.106 19.91 105.599 19.8 106.159 19.8C106.726 19.8 107.219 19.91 107.639 20.13C108.066 20.35 108.396 20.6567 108.629 21.05C108.863 21.4433 108.979 21.9033 108.979 22.43C108.979 22.9567 108.859 23.4233 108.619 23.83C108.386 24.23 108.056 24.5433 107.629 24.77C107.209 24.99 106.719 25.1 106.159 25.1ZM106.159 23.92C106.393 23.92 106.603 23.86 106.789 23.74C106.983 23.62 107.136 23.45 107.249 23.23C107.363 23.0033 107.419 22.7333 107.419 22.42C107.419 21.96 107.296 21.6067 107.049 21.36C106.809 21.1067 106.513 20.98 106.159 20.98C105.806 20.98 105.506 21.1067 105.259 21.36C105.019 21.6133 104.899 21.9667 104.899 22.42C104.899 22.7333 104.956 23.0033 105.069 23.23C105.183 23.45 105.333 23.62 105.519 23.74C105.713 23.86 105.926 23.92 106.159 23.92ZM111.625 25.1C111.265 25.1 110.955 25.0233 110.695 24.87C110.441 24.71 110.248 24.5 110.115 24.24C109.981 23.9733 109.915 23.6767 109.915 23.35V19.9H111.415V23.06C111.415 23.34 111.485 23.55 111.625 23.69C111.765 23.83 111.961 23.9 112.215 23.9C112.441 23.9 112.641 23.8467 112.815 23.74C112.988 23.6333 113.125 23.4867 113.225 23.3C113.331 23.1067 113.385 22.8867 113.385 22.64L113.515 23.87C113.348 24.2367 113.105 24.5333 112.785 24.76C112.465 24.9867 112.078 25.1 111.625 25.1ZM113.415 25V23.8H113.385V19.9H114.885V25H113.415ZM116.288 25V19.9H117.758V21.1H117.788V25H116.288ZM117.788 22.34L117.658 21.13C117.778 20.6967 117.975 20.3667 118.248 20.14C118.521 19.9133 118.861 19.8 119.268 19.8C119.395 19.8 119.488 19.8133 119.548 19.84V21.24C119.515 21.2267 119.468 21.22 119.408 21.22C119.348 21.2133 119.275 21.21 119.188 21.21C118.708 21.21 118.355 21.2967 118.128 21.47C117.901 21.6367 117.788 21.9267 117.788 22.34ZM120.472 25V19.9H121.942V21.1H121.972V25H120.472ZM124.022 25V21.84C124.022 21.56 123.949 21.35 123.802 21.21C123.662 21.07 123.456 21 123.182 21C122.949 21 122.739 21.0533 122.552 21.16C122.372 21.2667 122.229 21.4133 122.122 21.6C122.022 21.7867 121.972 22.0067 121.972 22.26L121.842 21.03C122.009 20.6567 122.252 20.36 122.572 20.14C122.899 19.9133 123.299 19.8 123.772 19.8C124.339 19.8 124.772 19.96 125.072 20.28C125.372 20.5933 125.522 21.0167 125.522 21.55V25H124.022ZM129.264 25.1C128.697 25.1 128.204 24.99 127.784 24.77C127.364 24.5433 127.037 24.23 126.804 23.83C126.577 23.43 126.464 22.97 126.464 22.45C126.464 21.9233 126.577 21.4633 126.804 21.07C127.037 20.67 127.36 20.36 127.774 20.14C128.187 19.9133 128.667 19.8 129.214 19.8C129.74 19.8 130.197 19.9067 130.584 20.12C130.97 20.3333 131.27 20.63 131.484 21.01C131.697 21.39 131.804 21.8367 131.804 22.35C131.804 22.4567 131.8 22.5567 131.794 22.65C131.787 22.7367 131.777 22.82 131.764 22.9H127.344V21.91H130.554L130.294 22.09C130.294 21.6767 130.194 21.3733 129.994 21.18C129.8 20.98 129.534 20.88 129.194 20.88C128.8 20.88 128.494 21.0133 128.274 21.28C128.06 21.5467 127.954 21.9467 127.954 22.48C127.954 23 128.06 23.3867 128.274 23.64C128.494 23.8933 128.82 24.02 129.254 24.02C129.494 24.02 129.7 23.98 129.874 23.9C130.047 23.82 130.177 23.69 130.264 23.51H131.674C131.507 24.0033 131.22 24.3933 130.814 24.68C130.414 24.96 129.897 25.1 129.264 25.1ZM132.919 27.05L134.329 23.93L134.589 23.5L135.909 19.9H137.509L134.419 27.05H132.919ZM133.999 24.9L132.039 19.9H133.659L135.269 24.46L133.999 24.9Z" fill="black" />
                    {/* Dynamic track title */}
                    <text x="49" y="39.5" className="homepage-track-title-text" fill="black" fillOpacity="0.7">
                      {TRACKS[currentTrackIndex].name}
                    </text>
                    {/* Playlist Toggle */}
                    <g
                      style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsPlaylistOpen(!isPlaylistOpen)
                      }}
                    >
                      <rect width="25" height="25" x="114" y="24" fill="transparent" />
                      <path d="M116.503 34.0266C116.569 34.0265 116.634 34.0394 116.694 34.0646C116.755 34.0897 116.81 34.1267 116.856 34.1732L119.414 36.7306C119.492 36.808 119.583 36.8694 119.685 36.9113C119.786 36.9532 119.894 36.9747 120.003 36.9747C120.113 36.9747 120.221 36.9532 120.322 36.9113C120.424 36.8694 120.515 36.808 120.593 36.7306L123.146 34.1766C123.193 34.1288 123.248 34.0907 123.309 34.0645C123.37 34.0383 123.435 34.0245 123.502 34.0239C123.568 34.0234 123.634 34.036 123.695 34.0612C123.757 34.0863 123.813 34.1234 123.86 34.1704C123.907 34.2173 123.944 34.2731 123.969 34.3346C123.994 34.396 124.007 34.4619 124.006 34.5283C124.006 34.5947 123.992 34.6603 123.966 34.7213C123.939 34.7823 123.901 34.8374 123.853 34.8836L121.3 37.4376C120.956 37.781 120.49 37.9738 120.003 37.9738C119.517 37.9738 119.051 37.781 118.707 37.4376L116.149 34.8802C116.08 34.8103 116.032 34.7212 116.013 34.6242C115.993 34.5272 116.003 34.4266 116.041 34.3352C116.079 34.2438 116.143 34.1657 116.225 34.1108C116.308 34.0558 116.404 34.0265 116.503 34.0266V34.0266Z" fill="black" fillOpacity="0.7" />
                    </g>
                  </g>
                </g>
                <defs>
                  <filter id="filter0_dd_315_85" x="0" y="0" width="162" height="59" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="1" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_315_85" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="4" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.16 0" />
                    <feBlend mode="normal" in2="effect1_dropShadow_315_85" result="effect2_dropShadow_315_85" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_315_85" result="shape" />
                  </filter>
                  <filter id="filter1_di_315_85" x="7.5" y="6.5" width="151.211" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feMorphology radius="0.5" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_315_85" />
                    <feOffset />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0" />
                    <feBlend mode="screen" in2="BackgroundImageFix" result="effect1_dropShadow_315_85" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_315_85" result="shape" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect2_innerShadow_315_85" />
                    <feOffset />
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
                    <feBlend mode="overlay" in2="shape" result="effect2_innerShadow_315_85" />
                  </filter>
                  <filter id="filter2_f_315_85" x="-288" y="-291" width="640" height="640" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feGaussianBlur stdDeviation="60" result="effect1_foregroundBlur_315_85" />
                  </filter>
                  <pattern id="pattern0_315_85" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use href="#image0_315_85" transform="translate(0 -0.25) scale(0.003125)" />
                  </pattern>
                  <clipPath id="paint0_angular_315_85_clip_path"><circle cx="32" cy="29" r="200" /></clipPath>
                  <clipPath id="paint1_angular_315_85_clip_path"><circle cx="32" cy="29" r="200" /></clipPath>
                  <radialGradient id="paint2_radial_315_85" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 29) rotate(90) scale(200)">
                    <stop stopColor="#F2F2F2" />
                    <stop offset="1" stopColor="white" />
                  </radialGradient>
                  <linearGradient id="paint3_linear_315_85" x1="8" y1="7" x2="30.754" y2="86.4864" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#666666" />
                    <stop offset="0.333333" stopColor="#F2F2F2" />
                    <stop offset="0.666667" stopColor="#4D4D4D" />
                    <stop offset="1" />
                  </linearGradient>
                  <clipPath id="clip0_315_85">
                    <path d="M8 28.5C8 16.6259 17.6259 7 29.5 7H132.5C144.374 7 154 16.6259 154 28.5V28.5C154 40.3741 144.374 50 132.5 50H29.5C17.6259 50 8 40.3741 8 28.5V28.5Z" fill="white" />
                  </clipPath>
                  <clipPath id="clip1_315_85">
                    <rect x="8" y="7" width="150.211" height="43" rx="21.5" fill="white" />
                  </clipPath>
                  <image id="image0_315_85" width="320" height="480" preserveAspectRatio="none" href="/assets/music_bg.jpg" />
                </defs>
              </svg>
            </motion.button>
          ) : (
            <motion.button
              key="paused-cta"
              className="homepage-audio-btn"
              onClick={(e) => {
                e.stopPropagation()
                togglePlayPause()
              }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              aria-label="Resume the Journey"
            >
              {/* resume_with_list.svg Inline */}
              <svg width="170" height="59" viewBox="0 0 170 59" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#filter0_dd_316_100)">
                  <g clipPath="url(#clip0_316_100)">
                    <g filter="url(#filter1_di_316_100)">
                      <g clipPath="url(#clip1_316_100)">
                        <rect x="8" y="7" width="158.442" height="43" rx="21.5" fill="white" />
                        <g filter="url(#filter2_f_316_100)">
                          <rect x="-168" y="-171" width="400" height="400" fill="url(#pattern0_316_100)" />
                        </g>
                        <g opacity="0.3" style={{ mixBlendMode: 'saturation' }}>
                          <rect x="8" y="7" width="158.442" height="43" fill="#0000FF" style={{ mixBlendMode: 'saturation' }} />
                          <rect x="8" y="7" width="158.442" height="43" fill="#00FF00" style={{ mixBlendMode: 'saturation' }} />
                          <rect x="8" y="7" width="158.442" height="43" fill="#FF0000" style={{ mixBlendMode: 'saturation' }} />
                        </g>
                        <g clipPath="url(#paint0_angular_316_100_clip_path)" data-figma-skip-parse="true">
                          <g transform="matrix(0 0.2 -0.2 0 32 29)">
                            <foreignObject x="-1005" y="-1005" width="2010" height="2010">
                              <div
                                xmlns="http://www.w3.org/1999/xhtml"
                                style={{
                                  background: 'conic-gradient(from 90deg,rgba(0, 0, 5, 1) 0deg,rgba(0, 0, 0, 1) 4.52418deg,rgba(0, 0, 0, 1) 6.26747deg,rgba(0, 0, 2, 1) 12.7613deg,rgba(1, 47, 3, 1) 14.5992deg,rgba(88, 110, 160, 1) 18.333deg,rgba(195, 228, 199, 1) 33.2955deg,rgba(173, 229, 216, 1) 37.2578deg,rgba(216, 235, 242, 1) 49.7547deg,rgba(182, 237, 207, 1) 72.6581deg,rgba(26, 145, 197, 1) 75.7268deg,rgba(3, 13, 126, 1) 77.2464deg,rgba(11, 2, 7, 1) 91.2179deg,rgba(26, 17, 20, 1) 100.105deg,rgba(30, 22, 33, 1) 109.179deg,rgba(80, 177, 209, 1) 132.035deg,rgba(53, 19, 106, 1) 134.901deg,rgba(51, 3, 79, 1) 167.029deg,rgba(137, 16, 119, 1) 175.225deg,rgba(250, 12, 136, 1) 180.933deg,rgba(240, 237, 186, 1) 196.529deg,rgba(248, 218, 87, 1) 219.828deg,rgba(223, 59, 46, 1) 235.609deg,rgba(18, 26, 101, 1) 236.198deg,rgba(8, 0, 11, 1) 251.319deg,rgba(2, 6, 41, 1) 269.913deg,rgba(12, 9, 36, 1) 271.818deg,rgba(19, 15, 32, 1) 283.163deg,rgba(20, 34, 79, 1) 294.211deg,rgba(6, 9, 64, 1) 312.234deg,rgba(5, 3, 52, 1) 314.478deg,rgba(3, 0, 29, 1) 324.395deg,rgba(1, 0, 79, 1) 337.704deg,rgba(0, 0, 53, 1) 340.87deg,rgba(1, 0, 31, 1) 344.828deg,rgba(0, 0, 24, 1) 352.98deg,rgba(0, 0, 12, 1) 354.797deg,rgba(0, 0, 5, 1) 360deg)',
                                  height: '100%',
                                  width: '100%',
                                  opacity: 1
                                }}
                              />
                            </foreignObject>
                          </g>
                        </g>
                        <g clipPath="url(#paint1_angular_316_100_clip_path)" data-figma-skip-parse="true">
                          <g transform="matrix(0 0.185185 -0.185185 0 32 29)">
                            <foreignObject x="-1085.4" y="-1085.4" width="2170.8" height="2170.8">
                              <div
                                xmlns="http://www.w3.org/1999/xhtml"
                                style={{
                                  background: 'conic-gradient(from 90deg,rgba(104, 69, 135, 1) 0deg,rgba(117, 58, 122, 1) 4.59288deg,rgba(78, 34, 132, 1) 6.37906deg,rgba(76, 40, 127, 1) 12.6911deg,rgba(88, 178, 117, 1) 14.598deg,rgba(193, 209, 232, 1) 18.317deg,rgba(237, 248, 239, 1) 33.5689deg,rgba(225, 250, 244, 1) 36.9247deg,rgba(242, 252, 251, 1) 49.9771deg,rgba(226, 250, 234, 1) 72.6581deg,rgba(100, 212, 226, 1) 75.6575deg,rgba(25, 67, 188, 1) 77.3893deg,rgba(45, 22, 28, 1) 91.2241deg,rgba(64, 56, 45, 1) 100.189deg,rgba(63, 55, 58, 1) 109.033deg,rgba(93, 142, 185, 1) 131.787deg,rgba(70, 31, 99, 1) 134.868deg,rgba(60, 16, 75, 1) 166.872deg,rgba(90, 28, 91, 1) 174.942deg,rgba(161, 30, 96, 1) 186.09deg,rgba(205, 182, 115, 1) 202.704deg,rgba(236, 189, 73, 1) 220.011deg,rgba(225, 70, 39, 1) 235.55deg,rgba(23, 45, 95, 1) 236.214deg,rgba(37, 14, 32, 1) 251.444deg,rgba(10, 37, 80, 1) 269.997deg,rgba(48, 47, 88, 1) 271.729deg,rgba(80, 76, 97, 1) 283.008deg,rgba(99, 139, 169, 1) 294.268deg,rgba(84, 132, 170, 1) 311.898deg,rgba(88, 73, 168, 1) 314.157deg,rgba(96, 58, 157, 1) 324.436deg,rgba(72, 82, 180, 1) 337.84deg,rgba(94, 102, 177, 1) 340.971deg,rgba(69, 48, 143, 1) 344.863deg,rgba(70, 59, 151, 1) 352.832deg,rgba(90, 83, 151, 1) 354.523deg,rgba(104, 69, 135, 1) 360deg)',
                                  height: '100%',
                                  width: '100%',
                                  opacity: 1
                                }}
                              />
                            </foreignObject>
                          </g>
                        </g>
                        <circle cx="32" cy="29" r="200" fill="url(#paint2_radial_316_100)" style={{ mixBlendMode: 'difference' }} />
                        <rect x="8" y="7" width="158.442" height="43" fill="url(#paint3_linear_316_100)" fillOpacity="0.3" style={{ mixBlendMode: 'overlay' }} />
                        <rect x="8" y="7" width="158.442" height="43" fill="#D9D9D9" style={{ mixBlendMode: 'hard-light' }} />
                        <rect x="8" y="7" width="158.442" height="43" fill="white" fillOpacity="0.05" style={{ mixBlendMode: 'exclusion' }} />
                      </g>
                    </g>
                    {/* Play triangle path */}
                    <path d="M43 28.4998C43.0004 28.6696 42.9569 28.8366 42.8736 28.9845C42.7904 29.1325 42.6703 29.2564 42.525 29.3442L33.52 34.8529C33.3682 34.9459 33.1943 34.9967 33.0163 35C32.8383 35.0033 32.6627 34.959 32.5075 34.8717C32.3538 34.7858 32.2258 34.6605 32.1366 34.5087C32.0474 34.3568 32.0003 34.184 32 34.0079V22.9917C32.0003 22.8156 32.0474 22.6428 32.1366 22.491C32.2258 22.3392 32.3538 22.2139 32.5075 22.1279C32.6627 22.0407 32.8383 21.9964 33.0163 21.9997C33.1943 22.003 33.3682 22.0537 33.52 22.1467L42.525 27.6554C42.6703 27.7432 42.7904 27.8671 42.8736 28.0151C42.9569 28.1631 43.0004 28.3301 43 28.4998Z" fill="black" fillOpacity="0.9" />
                    {/* Vectorized "Resume the Journey" */}
                    <path d="M52.46 25V17.8H55.68C56.2 17.8 56.6533 17.89 57.04 18.07C57.4267 18.2433 57.7267 18.49 57.94 18.81C58.1533 19.13 58.26 19.5033 58.26 19.93C58.26 20.35 58.1533 20.72 57.94 21.04C57.7267 21.3533 57.4267 21.6 57.04 21.78C56.6533 21.9533 56.2 22.04 55.68 22.04H53.68V20.91H55.64C56.0067 20.91 56.2867 20.8267 56.48 20.66C56.68 20.4867 56.78 20.2467 56.78 19.94C56.78 19.6267 56.6833 19.39 56.49 19.23C56.2967 19.0633 56.0133 18.98 55.64 18.98H54V25H52.46ZM56.52 25L53.63 21.26H55.26L58.6 25H56.52ZM61.577 25.1C61.0103 25.1 60.517 24.99 60.097 24.77C59.677 24.5433 59.3503 24.23 59.117 23.83C58.8903 23.43 58.777 22.97 58.777 22.45C58.777 21.9233 58.8903 21.4633 59.117 21.07C59.3503 20.67 59.6736 20.36 60.087 20.14C60.5003 19.9133 60.9803 19.8 61.527 19.8C62.0536 19.8 62.5103 19.9067 62.897 20.12C63.2836 20.3333 63.5836 20.63 63.797 21.01C64.0103 21.39 64.117 21.8367 64.117 22.35C64.117 22.4567 64.1136 22.5567 64.107 22.65C64.1003 22.7367 64.0903 22.82 64.077 22.9H59.657V21.91H62.867L62.607 22.09C62.607 21.6767 62.507 21.3733 62.307 21.18C62.1136 20.98 61.847 20.88 61.507 20.88C61.1136 20.88 60.807 21.0133 60.587 21.28C60.3736 21.5467 60.267 21.9467 60.267 22.48C60.267 23 60.3736 23.3867 60.587 23.64C60.807 23.8933 61.1336 24.02 61.567 24.02C61.807 24.02 62.0136 23.98 62.187 23.9C62.3603 23.82 62.4903 23.69 62.577 23.51H63.987C63.8203 24.0033 63.5336 24.3933 63.127 24.68C62.727 24.96 62.2103 25.1 61.577 25.1ZM67.228 25.1C66.4813 25.1 65.888 24.95 65.448 24.65C65.008 24.35 64.768 23.9367 64.728 23.41H66.068C66.1013 23.6367 66.2146 23.81 66.408 23.93C66.608 24.0433 66.8813 24.1 67.228 24.1C67.5413 24.1 67.768 24.0567 67.908 23.97C68.0546 23.8767 68.128 23.7467 68.128 23.58C68.128 23.4533 68.0846 23.3567 67.998 23.29C67.918 23.2167 67.768 23.1567 67.548 23.11L66.728 22.94C66.1213 22.8133 65.6746 22.6233 65.388 22.37C65.1013 22.11 64.958 21.7767 64.958 21.37C64.958 20.8767 65.148 20.4933 65.528 20.22C65.908 19.94 66.438 19.8 67.118 19.8C67.7913 19.8 68.328 19.9367 68.728 20.21C69.128 20.4767 69.348 20.85 69.388 21.33H68.048C68.0213 21.1567 67.928 21.0267 67.768 20.94C67.608 20.8467 67.3813 20.8 67.088 20.8C66.8213 20.8 66.6213 20.84 66.488 20.92C66.3613 20.9933 66.298 21.1 66.298 21.24C66.298 21.36 66.3513 21.4567 66.458 21.53C66.5646 21.5967 66.7413 21.6567 66.988 21.71L67.908 21.9C68.4213 22.0067 68.808 22.2067 69.068 22.5C69.3346 22.7867 69.468 23.1267 69.468 23.52C69.468 24.02 69.2713 24.41 68.878 24.69C68.4913 24.9633 67.9413 25.1 67.228 25.1ZM72.0766 25.1C71.7166 25.1 71.4066 25.0233 71.1466 24.87C70.8932 24.71 70.6999 24.5 70.5666 24.24C70.4332 23.9733 70.3666 23.6767 70.3666 23.35V19.9H71.8666V23.06C71.8666 23.34 71.9366 23.55 72.0766 23.69C72.2166 23.83 72.4132 23.9 72.6666 23.9C72.8932 23.9 73.0932 23.8467 73.2666 23.74C73.4399 23.6333 73.5766 23.4867 73.6766 23.3C73.7832 23.1067 73.8366 22.8867 73.8366 22.64L73.9666 23.87C73.7999 24.2367 73.5566 24.5333 73.2366 24.76C72.9166 24.9867 72.5299 25.1 72.0766 25.1ZM73.8666 25V23.8H73.8366V19.9H75.3366V25H73.8666ZM76.7398 25V19.9H78.2098V21.1H78.2398V25H76.7398ZM80.1698 25V21.76C80.1698 21.5 80.0998 21.31 79.9598 21.19C79.8265 21.0633 79.6365 21 79.3898 21C79.1765 21 78.9798 21.05 78.7998 21.15C78.6265 21.2433 78.4898 21.38 78.3898 21.56C78.2898 21.7333 78.2398 21.94 78.2398 22.18L78.1098 21.03C78.2765 20.6567 78.5165 20.36 78.8298 20.14C79.1498 19.9133 79.5332 19.8 79.9798 19.8C80.5132 19.8 80.9265 19.95 81.2198 20.25C81.5198 20.55 81.6698 20.9267 81.6698 21.38V25H80.1698ZM83.5998 25V21.76C83.5998 21.5 83.5298 21.31 83.3898 21.19C83.2565 21.0633 83.0665 21 82.8198 21C82.6065 21 82.4098 21.05 82.2298 21.15C82.0565 21.2433 81.9198 21.38 81.8198 21.56C81.7198 21.7333 81.6698 21.94 81.6698 22.18L81.4398 21.03C81.6065 20.6567 81.8532 20.36 82.1798 20.14C82.5132 19.9133 82.9132 19.8 83.3798 19.8C83.9332 19.8 84.3565 19.9567 84.6498 20.27C84.9498 20.5767 85.0998 20.98 85.0998 21.48V25H83.5998ZM88.8418 25.1C88.2751 25.1 87.7818 24.99 87.3618 24.77C86.9418 24.5433 86.6151 24.23 86.3818 23.83C86.1551 23.43 86.0418 22.97 86.0418 22.45C86.0418 21.9233 86.1551 21.4633 86.3818 21.07C86.6151 20.67 86.9385 20.36 87.3518 20.14C87.7651 19.9133 88.2451 19.8 88.7918 19.8C89.3185 19.8 89.7751 19.9067 90.1618 20.12C90.5485 20.3333 90.8485 20.63 91.0618 21.01C91.2751 21.39 91.3818 21.8367 91.3818 22.35C91.3818 22.4567 91.3785 22.5567 91.3718 22.65C91.3651 22.7367 91.3551 22.82 91.3418 22.9H86.9218V21.91H90.1318L89.8718 22.09C89.8718 21.6767 89.7718 21.3733 89.5718 21.18C89.3785 20.98 89.1118 20.88 88.7718 20.88C88.3785 20.88 88.0718 21.0133 87.8518 21.28C87.6385 21.5467 87.5318 21.9467 87.5318 22.48C87.5318 23 87.6385 23.3867 87.8518 23.64C88.0718 23.8933 88.3985 24.02 88.8318 24.02C89.0718 24.02 89.2785 23.98 89.4518 23.9C89.6251 23.82 89.7551 23.69 89.8418 23.51H91.2518C91.0851 24.0033 90.7985 24.3933 90.3918 24.68C89.9918 24.96 89.4751 25.1 88.8418 25.1ZM96.9083 25.11C96.2549 25.11 95.7683 24.9533 95.4483 24.64C95.1349 24.32 94.9783 23.8367 94.9783 23.19V18.76L96.4783 18.2V23.24C96.4783 23.4667 96.5416 23.6367 96.6683 23.75C96.7949 23.8633 96.9916 23.92 97.2583 23.92C97.3583 23.92 97.4516 23.91 97.5383 23.89C97.6249 23.87 97.7116 23.8467 97.7983 23.82V24.96C97.7116 25.0067 97.5883 25.0433 97.4283 25.07C97.2749 25.0967 97.1016 25.11 96.9083 25.11ZM94.0283 21.04V19.9H97.7983V21.04H94.0283ZM98.8973 25V17.8H100.397V25H98.8973ZM102.447 25V21.84C102.447 21.56 102.374 21.35 102.227 21.21C102.087 21.07 101.881 21 101.607 21C101.374 21 101.164 21.0533 100.977 21.16C100.797 21.2667 100.654 21.4133 100.547 21.6C100.447 21.7867 100.397 22.0067 100.397 22.26L100.267 21.03C100.434 20.6567 100.677 20.36 100.997 20.14C101.324 19.9133 101.724 19.8 102.197 19.8C102.764 19.8 103.197 19.96 103.497 20.28C103.797 20.5933 103.947 21.0167 103.947 21.55V25H102.447ZM107.689 25.1C107.122 25.1 106.629 24.99 106.209 24.77C105.789 24.5433 105.462 24.23 105.229 23.83C105.002 23.43 104.889 22.97 104.889 22.45C104.889 21.9233 105.002 21.4633 105.229 21.07C105.462 20.67 105.785 20.36 106.199 20.14C106.612 19.9133 107.092 19.8 107.639 19.8C108.165 19.8 108.622 19.9067 109.009 20.12C109.395 20.3333 109.695 20.63 109.909 21.01C110.122 21.39 110.229 21.8367 110.229 22.35C110.229 22.4567 110.225 22.5567 110.219 22.65C110.212 22.7367 110.202 22.82 110.189 22.9H105.769V21.91H108.979L108.719 22.09C108.719 21.6767 108.619 21.3733 108.419 21.18C108.225 20.98 107.959 20.88 107.619 20.88C107.225 20.88 106.919 21.0133 106.699 21.28C106.485 21.5467 106.379 21.9467 106.379 22.48C106.379 23 106.485 23.3867 106.699 23.64C106.919 23.8933 107.245 24.02 107.679 24.02C107.919 24.02 108.125 23.98 108.299 23.9C108.472 23.82 108.602 23.69 108.689 23.51H110.099C109.932 24.0033 109.645 24.3933 109.239 24.68C108.839 24.96 108.322 25.1 107.689 25.1ZM114.075 25.1C113.822 25.1 113.578 25.08 113.345 25.04C113.112 25.0067 112.942 24.9633 112.835 24.91V23.73C112.955 23.7767 113.098 23.8167 113.265 23.85C113.432 23.8833 113.602 23.9 113.775 23.9C114.148 23.9 114.418 23.84 114.585 23.72C114.758 23.5933 114.845 23.3667 114.845 23.04V17.8H116.385V23.11C116.385 23.7767 116.188 24.2767 115.795 24.61C115.402 24.9367 114.828 25.1 114.075 25.1ZM120.106 25.1C119.546 25.1 119.052 24.99 118.626 24.77C118.206 24.5433 117.876 24.23 117.636 23.83C117.402 23.4233 117.286 22.9567 117.286 22.43C117.286 21.9033 117.402 21.4433 117.636 21.05C117.876 20.6567 118.206 20.35 118.626 20.13C119.052 19.91 119.546 19.8 120.106 19.8C120.672 19.8 121.166 19.91 121.586 20.13C122.012 20.35 122.342 20.6567 122.576 21.05C122.809 21.4433 122.926 21.9033 122.926 22.43C122.926 22.9567 122.806 23.4233 122.566 23.83C122.332 24.23 122.002 24.5433 121.576 24.77C121.156 24.99 120.666 25.1 120.106 25.1ZM120.106 23.92C120.339 23.92 120.549 23.86 120.736 23.74C120.929 23.62 121.082 23.45 121.196 23.23C121.309 23.0033 121.366 22.7333 121.366 22.42C121.366 21.96 121.242 21.6067 120.996 21.36C120.756 21.1067 120.459 20.98 120.106 20.98C119.752 20.98 119.452 21.1067 119.206 21.36C118.966 21.6133 118.846 21.9667 118.846 22.42C118.846 22.7333 118.902 23.0033 119.016 23.23C119.129 23.45 119.279 23.62 119.466 23.74C119.659 23.86 119.872 23.92 120.106 23.92ZM125.571 25.1C125.211 25.1 124.901 25.0233 124.641 24.87C124.387 24.71 124.194 24.5 124.061 24.24C123.927 23.9733 123.861 23.6767 123.861 23.35V19.9H125.361V23.06C125.361 23.34 125.431 23.55 125.571 23.69C125.711 23.83 125.907 23.9 126.161 23.9C126.387 23.9 126.587 23.8467 126.761 23.74C126.934 23.6333 127.071 23.4867 127.171 23.3C127.277 23.1067 127.331 22.8867 127.331 22.64L127.461 23.87C127.294 24.2367 127.051 24.5333 126.731 24.76C126.411 24.9867 126.024 25.1 125.571 25.1ZM127.361 25V23.8H127.331V19.9H128.831V25H127.361ZM130.234 25V19.9H131.704V21.1H131.734V25H130.234ZM131.734 22.34L131.604 21.13C131.724 20.6967 131.921 20.3667 132.194 20.14C132.467 19.9133 132.807 19.8 133.214 19.8C133.341 19.8 133.434 19.8133 133.494 19.84V21.24C133.461 21.2267 133.414 21.22 133.354 21.22C133.294 21.2133 133.221 21.21 133.134 21.21C132.654 21.21 132.301 21.2967 132.074 21.47C131.847 21.6367 131.734 21.9267 131.734 22.34ZM134.418 25V19.9H135.888V21.1H135.918V25H134.418ZM137.968 25V21.84C137.968 21.56 137.895 21.35 137.748 21.21C137.608 21.07 137.402 21 137.128 21C136.895 21 136.685 21.0533 136.498 21.16C136.318 21.2667 136.175 21.4133 136.068 21.6C135.968 21.7867 135.918 22.0067 135.918 22.26L135.788 21.03C135.955 20.6567 136.198 20.36 136.518 20.14C136.845 19.9133 137.245 19.8 137.718 19.8C138.285 19.8 138.718 19.96 139.018 20.28C139.318 20.5933 139.468 21.0167 139.468 21.55V25H137.968ZM143.21 25.1C142.643 25.1 142.15 24.99 141.73 24.77C141.31 24.5433 140.983 24.23 140.75 23.83C140.523 23.43 140.41 22.97 140.41 22.45C140.41 21.9233 140.523 21.4633 140.75 21.07C140.983 20.67 141.306 20.36 141.72 20.14C142.133 19.9133 142.613 19.8 143.16 19.8C143.686 19.8 144.143 19.9067 144.53 20.12C144.916 20.3333 145.216 20.63 145.43 21.01C145.643 21.39 145.75 21.8367 145.75 22.35C145.75 22.4567 145.746 22.5567 145.74 22.65C145.733 22.7367 145.723 22.82 145.71 22.9H141.29V21.91H144.5L144.24 22.09C144.24 21.6767 144.14 21.3733 143.94 21.18C143.746 20.98 143.48 20.88 143.14 20.88C142.746 20.88 142.44 21.0133 142.22 21.28C142.006 21.5467 141.9 21.9467 141.9 22.48C141.9 23 142.006 23.3867 142.22 23.64C142.44 23.8933 142.766 24.02 143.2 24.02C143.44 24.02 143.646 23.98 143.82 23.9C143.993 23.82 144.123 23.69 144.21 23.51H145.62C145.453 24.0033 145.166 24.3933 144.76 24.68C144.36 24.96 143.843 25.1 143.21 25.1ZM146.865 27.05L148.275 23.93L148.535 23.5L149.855 19.9H151.455L148.365 27.05H146.865ZM147.945 24.9L145.985 19.9H147.605L149.215 24.46L147.945 24.9Z" fill="black" fillOpacity="0.7" />
                    {/* Dynamic track title */}
                    <text x="53" y="39.5" className="homepage-track-title-text" fill="black" fillOpacity="0.5">
                      {TRACKS[currentTrackIndex].name}
                    </text>
                    {/* Playlist Toggle */}
                    <g
                      style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        setIsPlaylistOpen(!isPlaylistOpen)
                      }}
                    >
                      <rect width="25" height="25" x="118" y="24" fill="transparent" />
                      <path d="M120.503 34.0266C120.569 34.0265 120.634 34.0394 120.694 34.0646C120.755 34.0897 120.81 34.1267 120.856 34.1732L123.414 36.7306C123.492 36.808 123.583 36.8694 123.685 36.9113C123.786 36.9532 123.894 36.9747 124.003 36.9747C124.113 36.9747 124.221 36.9532 124.322 36.9113C124.424 36.8694 124.515 36.808 124.593 36.7306L127.146 34.1766C127.193 34.1288 127.248 34.0907 127.309 34.0645C127.37 34.0383 127.435 34.0245 127.502 34.0239C127.568 34.0234 127.634 34.036 127.695 34.0612C127.757 34.0863 127.813 34.1234 127.86 34.1704C127.907 34.2173 127.944 34.2731 127.969 34.3346C127.994 34.396 128.007 34.4619 128.006 34.5283C128.006 34.5947 127.992 34.6603 127.966 34.7213C127.939 34.7823 127.901 34.8374 127.853 34.8836L125.3 37.4376C124.956 37.781 124.49 37.9738 124.003 37.9738C123.517 37.9738 123.051 37.781 122.707 37.4376L120.149 34.8802C120.08 34.8103 120.032 34.7212 120.013 34.6242C119.993 34.5272 120.003 34.4266 120.041 34.3352C120.079 34.2438 120.143 34.1657 120.225 34.1108C120.308 34.0558 120.404 34.0265 120.503 34.0266V34.0266Z" fill="black" fillOpacity="0.7" />
                    </g>
                  </g>
                </g>
                <defs>
                  <filter id="filter0_dd_316_100" x="0" y="0" width="170" height="59" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="1" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0" />
                    <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_316_100" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feOffset dy="1" />
                    <feGaussianBlur stdDeviation="4" />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.16 0" />
                    <feBlend mode="normal" in2="effect1_dropShadow_316_100" result="effect2_dropShadow_316_100" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect2_dropShadow_316_100" result="shape" />
                  </filter>
                  <filter id="filter1_di_316_100" x="7.5" y="6.5" width="159.442" height="44" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feMorphology radius="0.5" operator="dilate" in="SourceAlpha" result="effect1_dropShadow_316_100" />
                    <feOffset />
                    <feComposite in2="hardAlpha" operator="out" />
                    <feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.1 0" />
                    <feBlend mode="screen" in2="BackgroundImageFix" result="effect1_dropShadow_316_100" />
                    <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_316_100" result="shape" />
                    <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                    <feMorphology radius="2" operator="erode" in="SourceAlpha" result="effect2_innerShadow_316_100" />
                    <feOffset />
                    <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.4 0" />
                    <feBlend mode="overlay" in2="shape" result="effect2_innerShadow_316_100" />
                  </filter>
                  <filter id="filter2_f_316_100" x="-288" y="-291" width="640" height="640" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                    <feGaussianBlur stdDeviation="60" result="effect1_foregroundBlur_316_100" />
                  </filter>
                  <pattern id="pattern0_316_100" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use href="#image0_316_100" transform="translate(0 -0.25) scale(0.003125)" />
                  </pattern>
                  <clipPath id="paint0_angular_316_100_clip_path"><circle cx="32" cy="29" r="200" /></clipPath>
                  <clipPath id="paint1_angular_316_100_clip_path"><circle cx="32" cy="29" r="200" /></clipPath>
                  <radialGradient id="paint2_radial_316_100" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 29) rotate(90) scale(200)">
                    <stop stopColor="#F2F2F2" />
                    <stop offset="1" stopColor="white" />
                  </radialGradient>
                  <linearGradient id="paint3_linear_316_100" x1="8" y1="7" x2="29.7386" y2="87.1003" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#666666" />
                    <stop offset="0.333333" stopColor="#F2F2F2" />
                    <stop offset="0.666667" stopColor="#4D4D4D" />
                    <stop offset="1" />
                  </linearGradient>
                  <clipPath id="clip0_316_100">
                    <path d="M8 28.5C8 16.6259 17.6259 7 29.5 7H140.5C152.374 7 162 16.6259 162 28.5V28.5C162 40.3741 152.374 50 140.5 50H29.5C17.6259 50 8 40.3741 8 28.5V28.5Z" fill="white" />
                  </clipPath>
                  <clipPath id="clip1_316_100">
                    <rect x="8" y="7" width="158.442" height="43" rx="21.5" fill="white" />
                  </clipPath>
                  <image id="image0_316_100" width="320" height="480" preserveAspectRatio="none" href="/assets/music_bg.jpg" />
                </defs>
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Glassmorphic Volume Slider Container */}
      <motion.div
        className="homepage-volume-slider-container"
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
          className="homepage-volume-slider"
          aria-label="Volume Control"
        />
      </motion.div>

      {/* Frosted Glass Playlist Dropdown */}
      <AnimatePresence>
        {isPlaylistOpen && (
          <motion.div
            className="homepage-playlist-dropdown"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 24,
            }}
          >
            <ul className="homepage-playlist-list">
              {TRACKS.map((track, index) => {
                const isActive = index === currentTrackIndex
                return (
                  <li
                    key={track.id}
                    className={`homepage-playlist-item ${isActive ? 'active' : ''}`}
                    onClick={() => switchTrack(index)}
                  >
                    <span className="homepage-playlist-indicator">
                      {isActive ? '●' : '○'}
                    </span>
                    <span className="homepage-playlist-name">{track.name}</span>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
