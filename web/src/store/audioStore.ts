import { create } from 'zustand'
import { gsap } from 'gsap'
import loaderMusicUrl from '../../../docs/figma/music/loader-musinc.mp3'
import disclaimerMusicUrl from '../../../docs/figma/music/disclaimer-musinc.mp3'

// Singleton HTMLAudioElement instances for global audio playback
const loaderAudio = new Audio(loaderMusicUrl)
loaderAudio.preload = 'auto'
loaderAudio.volume = 0

const disclaimerAudio = new Audio(disclaimerMusicUrl)
disclaimerAudio.preload = 'auto'
disclaimerAudio.loop = true
disclaimerAudio.volume = 0

// Trigger browser preloading
loaderAudio.load()
disclaimerAudio.load()

// Track volume scales (0 to 1) for smooth GSAP transitions
const volumeScales = {
  loader: { value: 0 },
  disclaimer: { value: 0 },
}

const registeredAudios = new Set<HTMLAudioElement>()

export const registerAudioForUnlock = (audio: HTMLAudioElement) => {
  registeredAudios.add(audio)
}

// Register initial global audio elements
registerAudioForUnlock(loaderAudio)
registerAudioForUnlock(disclaimerAudio)

let isUnlocked = false

const unlockAllAudio = (e?: Event) => {
  if (isUnlocked) return

  const state = useAudioStore.getState()
  const target = e?.target as HTMLElement | undefined
  const isController = target?.closest('.global-audio-controller-wrapper')

  if (state.isEnabled) {
    registeredAudios.forEach((audio) => {
      const isLoader = audio === loaderAudio
      const isDisclaimer = audio === disclaimerAudio

      const shouldPlayNow =
        !isController && (
          (isLoader && state.currentScene === 'loader') ||
          (isDisclaimer && state.currentScene === 'disclaimer')
        )

      if (shouldPlayNow) {
        audio.play().catch((err) => {
          console.warn('Autoplay still blocked for active scene:', err)
        })
      } else {
        if (audio.paused) {
          audio.play()
            .then(() => {
              audio.pause()
            })
            .catch((err) => {
              console.warn('Unlock failed for passive audio:', err)
            })
        }
      }
    })
  }

  isUnlocked = true

  // Remove the event listeners
  window.removeEventListener('click', unlockAllAudio)
  window.removeEventListener('pointerdown', unlockAllAudio)
  window.removeEventListener('touchstart', unlockAllAudio)
  window.removeEventListener('keydown', unlockAllAudio)
}

// Add the event listeners for first user gesture
window.addEventListener('click', unlockAllAudio)
window.addEventListener('pointerdown', unlockAllAudio)
window.addEventListener('touchstart', unlockAllAudio)
window.addEventListener('keydown', unlockAllAudio)

const playAudioSafely = (audio: HTMLAudioElement) => {
  audio.play().catch((err) => {
    console.warn('Audio playback blocked by autoplay policy, waiting for user gesture:', err)
  })
}


interface AudioState {
  isEnabled: boolean
  volume: number
  isBrowseRollActive: boolean
  currentScene: 'loader' | 'disclaimer' | 'none'
  startLoader: () => void
  fadeOutLoader: (durationMs: number) => Promise<void>
  startDisclaimer: () => void
  fadeOutDisclaimer: (durationMs: number) => Promise<void>
  togglePlayPause: () => void
  setVolume: (vol: number) => void
  setBrowseRollActive: (active: boolean) => void
}

export const useAudioStore = create<AudioState>((set, get) => {
  // Load preferences from localStorage
  const storedEnabled = localStorage.getItem('postmarked_music_enabled')
  const initialEnabled = storedEnabled !== 'false' // default to true

  const storedVolume = localStorage.getItem('postmarked_music_volume')
  const initialVolume = storedVolume !== null ? parseFloat(storedVolume) : 0.5

  // Apply initial volume limits
  const sanitizedVolume = Math.max(0, Math.min(1, initialVolume))

  return {
    isEnabled: initialEnabled,
    volume: sanitizedVolume,
    isBrowseRollActive: false,
    currentScene: 'none',

    startLoader: () => {
      set({ currentScene: 'loader' })
      const { isEnabled } = get()

      if (isEnabled) {
        loaderAudio.currentTime = 0
        playAudioSafely(loaderAudio)

        // Kill any ongoing tween on loader volume scale
        gsap.killTweensOf(volumeScales.loader)
        volumeScales.loader.value = 0
        loaderAudio.volume = 0

        // Fade in volume scale from 0 to 1 over 500ms
        gsap.to(volumeScales.loader, {
          value: 1,
          duration: 0.5,
          ease: 'power1.out',
          onUpdate: () => {
            loaderAudio.volume = volumeScales.loader.value * get().volume
          },
        })
      }
    },

    fadeOutLoader: (durationMs: number) => {
      return new Promise<void>((resolve) => {
        const { isEnabled } = get()
        if (!isEnabled || loaderAudio.paused) {
          loaderAudio.pause()
          resolve()
          return
        }

        gsap.killTweensOf(volumeScales.loader)
        gsap.to(volumeScales.loader, {
          value: 0,
          duration: durationMs / 1000,
          ease: 'power1.inOut',
          onUpdate: () => {
            loaderAudio.volume = volumeScales.loader.value * get().volume
          },
          onComplete: () => {
            loaderAudio.pause()
            resolve()
          },
        })
      })
    },

    startDisclaimer: () => {
      set({ currentScene: 'disclaimer' })
      const { isEnabled } = get()

      if (isEnabled) {
        disclaimerAudio.currentTime = 0
        playAudioSafely(disclaimerAudio)

        // Kill any ongoing tween on disclaimer volume scale
        gsap.killTweensOf(volumeScales.disclaimer)
        volumeScales.disclaimer.value = 0
        disclaimerAudio.volume = 0

        // Fade in volume scale from 0 to 1 over 800ms
        gsap.to(volumeScales.disclaimer, {
          value: 1,
          duration: 0.8,
          ease: 'power1.out',
          onUpdate: () => {
            disclaimerAudio.volume = volumeScales.disclaimer.value * get().volume
          },
        })
      }
    },

    fadeOutDisclaimer: (durationMs: number) => {
      return new Promise<void>((resolve) => {
        const { isEnabled } = get()
        if (!isEnabled || disclaimerAudio.paused) {
          disclaimerAudio.pause()
          set({ currentScene: 'none' })
          resolve()
          return
        }

        gsap.killTweensOf(volumeScales.disclaimer)
        gsap.to(volumeScales.disclaimer, {
          value: 0,
          duration: durationMs / 1000,
          ease: 'power1.inOut',
          onUpdate: () => {
            disclaimerAudio.volume = volumeScales.disclaimer.value * get().volume
          },
          onComplete: () => {
            disclaimerAudio.pause()
            set({ currentScene: 'none' })
            resolve()
          },
        })
      })
    },

    togglePlayPause: () => {
      const { isEnabled, currentScene, volume } = get()

      // If enabled but blocked/paused due to browser autoplay, play it instead of toggling to disabled
      let isBlocked = false
      if (isEnabled) {
        if (currentScene === 'loader' && loaderAudio.paused) {
          isBlocked = true
        } else if (currentScene === 'disclaimer' && disclaimerAudio.paused) {
          isBlocked = true
        }
      }

      if (isBlocked) {
        if (currentScene === 'loader') {
          playAudioSafely(loaderAudio)
          gsap.killTweensOf(volumeScales.loader)
          gsap.to(volumeScales.loader, {
            value: 1,
            duration: 0.5,
            ease: 'power1.out',
            onUpdate: () => {
              loaderAudio.volume = volumeScales.loader.value * get().volume
            },
          })
        } else if (currentScene === 'disclaimer') {
          playAudioSafely(disclaimerAudio)
          gsap.killTweensOf(volumeScales.disclaimer)
          gsap.to(volumeScales.disclaimer, {
            value: 1,
            duration: 0.5,
            ease: 'power1.out',
            onUpdate: () => {
              disclaimerAudio.volume = volumeScales.disclaimer.value * get().volume
            },
          })
        }
        return
      }

      const nextEnabled = !isEnabled
      set({ isEnabled: nextEnabled })
      localStorage.setItem('postmarked_music_enabled', String(nextEnabled))

      if (nextEnabled) {
        // Resume appropriate soundtrack for the current scene
        if (currentScene === 'loader') {
          playAudioSafely(loaderAudio)
          gsap.killTweensOf(volumeScales.loader)
          gsap.to(volumeScales.loader, {
            value: 1,
            duration: 0.5,
            ease: 'power1.out',
            onUpdate: () => {
              loaderAudio.volume = volumeScales.loader.value * get().volume
            },
          })
        } else if (currentScene === 'disclaimer') {
          playAudioSafely(disclaimerAudio)
          gsap.killTweensOf(volumeScales.disclaimer)
          gsap.to(volumeScales.disclaimer, {
            value: 1,
            duration: 0.5,
            ease: 'power1.out',
            onUpdate: () => {
              disclaimerAudio.volume = volumeScales.disclaimer.value * get().volume
            },
          })
        }
      } else {
        // Fade out and pause whatever is currently playing
        if (currentScene === 'loader') {
          gsap.killTweensOf(volumeScales.loader)
          gsap.to(volumeScales.loader, {
            value: 0,
            duration: 0.3,
            ease: 'power1.in',
            onUpdate: () => {
              loaderAudio.volume = volumeScales.loader.value * volume
            },
            onComplete: () => {
              loaderAudio.pause()
            },
          })
        } else if (currentScene === 'disclaimer') {
          gsap.killTweensOf(volumeScales.disclaimer)
          gsap.to(volumeScales.disclaimer, {
            value: 0,
            duration: 0.3,
            ease: 'power1.in',
            onUpdate: () => {
              disclaimerAudio.volume = volumeScales.disclaimer.value * volume
            },
            onComplete: () => {
              disclaimerAudio.pause()
            },
          })
        }
      }
    },

    setVolume: (vol: number) => {
      const sanitized = Math.max(0, Math.min(1, vol))
      set({ volume: sanitized })
      localStorage.setItem('postmarked_music_volume', String(sanitized))

      const { isEnabled, currentScene } = get()
      if (isEnabled) {
        if (currentScene === 'loader') {
          loaderAudio.volume = volumeScales.loader.value * sanitized
        } else if (currentScene === 'disclaimer') {
          disclaimerAudio.volume = volumeScales.disclaimer.value * sanitized
        }
      }
    },

    setBrowseRollActive: (active: boolean) => {
      set({ isBrowseRollActive: active })
    },
  }
})
