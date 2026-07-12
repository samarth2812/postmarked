import { useEffect, useState } from 'react'
import { CircleReveal } from './CircleReveal'
import { DisclaimerScreen } from './DisclaimerScreen'
import { IntroSign } from './IntroSign'
import { LogoReveal } from './LogoReveal'

type LandingSequenceProps = {
  onLandingComplete: () => void
}

type SequenceStage = 'intro' | 'wobble' | 'reveal' | 'logo' | 'logoOut' | 'disclaimer'

const schedule: Array<[number, SequenceStage]> = [
  [80, 'wobble'],
  [6000, 'reveal'],
  [6810, 'logo'],
  [7970, 'logoOut'],
  [8370, 'disclaimer'],
]

export function LandingSequence({ onLandingComplete }: LandingSequenceProps) {
  const [stage, setStage] = useState<SequenceStage>('intro')

  useEffect(() => {
    const timers = schedule.map(([delay, nextStage]) => window.setTimeout(() => setStage(nextStage), delay))
    return () => timers.forEach(window.clearTimeout)
  }, [])

  const introVisible = stage === 'intro' || stage === 'wobble' || stage === 'reveal'

  return (
    <main className={`landing-sequence stage-${stage}`}>
      {introVisible && <IntroSign wobble={stage !== 'intro'} />}
      <CircleReveal active={stage === 'reveal' || stage === 'logo' || stage === 'logoOut' || stage === 'disclaimer'} />
      <LogoReveal visible={stage === 'logo'} />
      <DisclaimerScreen visible={stage === 'logoOut' || stage === 'disclaimer'} onComplete={onLandingComplete} />
    </main>
  )
}
