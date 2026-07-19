import { useEffect, useState } from 'react'
import { CircleReveal } from './CircleReveal'
import { DisclaimerScreen } from './DisclaimerScreen'
import { IntroSign } from './IntroSign'
import { LogoReveal } from './LogoReveal'
import { useAudioStore } from '../../store/audioStore'

type LandingSequenceProps = {
  onLandingComplete: () => void
}

type SequenceStage = 'intro' | 'wobble' | 'reveal' | 'logo' | 'logoOut' | 'disclaimer'

export function LandingSequence({ onLandingComplete }: LandingSequenceProps) {
  const [stage, setStage] = useState<SequenceStage>('intro')
  const [showEnterButton, setShowEnterButton] = useState(false)
  const startLoader = useAudioStore((state) => state.startLoader)
  const fadeOutLoader = useAudioStore((state) => state.fadeOutLoader)
  const startDisclaimer = useAudioStore((state) => state.startDisclaimer)

  // Start the wobble/loader stage automatically at 80ms
  useEffect(() => {
    const timer = window.setTimeout(() => setStage('wobble'), 80)
    return () => window.clearTimeout(timer)
  }, [])

  // When wobble stage starts, wait 5920ms (total 6000ms since load) to show the ENTER button
  useEffect(() => {
    if (stage === 'wobble') {
      const timer = window.setTimeout(() => {
        setShowEnterButton(true)
      }, 5920)
      return () => window.clearTimeout(timer)
    }
  }, [stage])

  // Handle stage transitions
  useEffect(() => {
    if (stage === 'wobble') {
      startLoader()
    } else if (stage === 'reveal') {
      fadeOutLoader(700)
    } else if (stage === 'logoOut') {
      startDisclaimer()
    }
  }, [stage, startLoader, fadeOutLoader, startDisclaimer])

  const handleEnterClick = () => {
    setShowEnterButton(false)
    setStage('reveal')

    // Schedule remaining transition stages with the exact original delays:
    // reveal -> logo (810ms) -> logoOut (1970ms) -> disclaimer (2370ms)
    window.setTimeout(() => setStage('logo'), 810)
    window.setTimeout(() => setStage('logoOut'), 1970)
    window.setTimeout(() => setStage('disclaimer'), 2370)
  }

  const introVisible = stage === 'intro' || stage === 'wobble' || stage === 'reveal'

  return (
    <main className={`landing-sequence stage-${stage}`}>
      {introVisible && <IntroSign wobble={stage !== 'intro'} />}
      <CircleReveal active={stage === 'reveal' || stage === 'logo' || stage === 'logoOut' || stage === 'disclaimer'} />
      <LogoReveal visible={stage === 'logo'} />
      <DisclaimerScreen visible={stage === 'logoOut' || stage === 'disclaimer'} onComplete={onLandingComplete} />

      {showEnterButton && (
        <div className="enter-overlay">
          <button className="enter-button" onClick={handleEnterClick}>
            ENTER THE POSTMARKED
          </button>
        </div>
      )}
    </main>
  )
}

