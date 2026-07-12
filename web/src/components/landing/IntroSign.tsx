import { useEffect } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import loader from '../../../../docs/figma/LandingPage/loader.svg'
import signBoard from '../../../../docs/figma/LandingPage/sign_board.svg'

type IntroSignProps = {
  wobble: boolean
}

export function IntroSign({ wobble }: IntroSignProps) {
  const controls = useAnimationControls()

  useEffect(() => {
    if (!wobble) {
      controls.start({
        rotate: [-1.8, 1.35, -1.05, 0.9, -1.4],
        x: [0, -2, 1, -1, 0],
        transition: { duration: 2.6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
      })
      return
    }

    let active = true

    void (async () => {
      const swings = [
        { rotate: -8.5, x: -5, transition: { type: 'spring' as const, stiffness: 138, damping: 8.5, mass: 1.25 } },
        { rotate: 7.25, x: 4, transition: { type: 'spring' as const, stiffness: 118, damping: 9.25, mass: 1.35 } },
        { rotate: -5.4, x: -3, transition: { type: 'spring' as const, stiffness: 98, damping: 10.5, mass: 1.48 } },
        { rotate: 4.35, x: 2, transition: { type: 'spring' as const, stiffness: 82, damping: 11.6, mass: 1.58 } },
        { rotate: -3.3, x: -1.5, transition: { type: 'spring' as const, stiffness: 68, damping: 12.2, mass: 1.68 } },
        { rotate: 2.7, x: 1, transition: { type: 'spring' as const, stiffness: 58, damping: 12.8, mass: 1.78 } },
      ]

      while (active) {
        for (const swing of swings) {
          if (!active) return
          await controls.start(swing)
        }
      }
    })()

    return () => {
      active = false
      controls.stop()
    }
  }, [controls, wobble])

  return (
    <motion.section className="intro-sign" aria-label="Collecting Memories Since 2001">
      <div className="pin" aria-hidden="true"><i /></div>
      <motion.div
        className="sign-rig"
        animate={controls}
        initial={{ rotate: -0.16 }}
      >
        <img className="sign-board" src={signBoard} alt="" draggable="false" />
      </motion.div>
      <div className="processing-loader" aria-hidden="true">
        <span>
          <img src={loader} alt="" draggable="false" />
          <img src={loader} alt="" draggable="false" />
        </span>
      </div>
    </motion.section>
  )
}
