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

    // Realistic spring-based swinging pendulum animation
    // Start from current rotation and apply a strong initial push velocity
    controls.start({
      rotate: 0,
      x: 0,
      transition: {
        rotate: {
          type: 'spring',
          stiffness: 27,
          damping: 0.85,
          mass: 1,
          velocity: -170, // initial velocity in deg/s for a strong push
        },
        x: { duration: 0.2, ease: 'easeOut' }
      }
    })

    return () => {
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
        <img src={loader} alt="" draggable="false" />
      </div>
    </motion.section>
  )
}
