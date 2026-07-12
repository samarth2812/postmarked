import { useEffect, useRef } from 'react'
import { motion, useAnimationControls } from 'framer-motion'
import { gsap } from 'gsap'
import signBoard from '../../../../docs/figma/LandingPage/sign_board.svg'

type IntroSignProps = {
  wobble: boolean
}

export function IntroSign({ wobble }: IntroSignProps) {
  const controls = useAnimationControls()
  const stripesRef = useRef<SVGGElement>(null)

  useEffect(() => {
    if (!stripesRef.current) return

    // Setup seamless horizontal translation loop for stripes
    const stripesTween = gsap.to(stripesRef.current, {
      x: -43.6704,
      duration: 1.2,
      ease: 'none',
      repeat: -1,
    })

    let speedTimer: number | undefined

    if (!wobble) {
      // Idle stage
      controls.start({
        rotate: [-1.8, 1.35, -1.05, 0.9, -1.4],
        x: [0, -2, 1, -1, 0],
        transition: { duration: 2.6, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' },
      })
    } else {
      // Swing swing/loading stage
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

      // Accelerate stripes 500ms before transition (at 8500ms from start, i.e., 8420ms after wobble stage starts)
      speedTimer = window.setTimeout(() => {
        gsap.to(stripesTween, {
          timeScale: 4.5,
          duration: 0.5,
          ease: 'power2.in',
        })
      }, 8420)
    }

    return () => {
      controls.stop()
      stripesTween.kill()
      if (speedTimer) {
        window.clearTimeout(speedTimer)
      }
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
        <svg width="263" height="28" viewBox="0 0 263 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <mask id="mask0_211_1361" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="263" height="28">
            <rect width="263" height="28" rx="14" fill="#D9D9D9"/>
          </mask>
          <g mask="url(#mask0_211_1361)" ref={stripesRef}>
            <path d="M-20.3463 -37H1.4889L-15.3074 64H-37.1426L-20.3463 -37Z" fill="#FFD500"/>
            <path d="M1.48868 -37H23.3239L6.52757 64H-15.3076L1.48868 -37Z" fill="#CBA100"/>
            <path d="M23.3241 -37H45.1593L28.363 64H6.52783L23.3241 -37Z" fill="#FFD500"/>
            <path d="M45.1591 -37H66.9943L50.198 64H28.3628L45.1591 -37Z" fill="#CBA100"/>
            <path d="M66.9945 -37H88.8297L72.0334 64H50.1982L66.9945 -37Z" fill="#FFD500"/>
            <path d="M88.8295 -37H110.665L93.8684 64H72.0332L88.8295 -37Z" fill="#CBA100"/>
            <path d="M110.665 -37H132.5L115.704 64H93.8687L110.665 -37Z" fill="#FFD500"/>
            <path d="M132.296 -37H154.131L137.335 64H115.5L132.296 -37Z" fill="#CBA100"/>
            <path d="M154.131 -37H175.966L159.17 64H137.335L154.131 -37Z" fill="#FFD500"/>
            <path d="M175.967 -37H197.802L181.006 64H159.17L175.967 -37Z" fill="#CBA100"/>
            <path d="M197.802 -37H219.637L202.841 64H181.005L197.802 -37Z" fill="#FFD500"/>
            <path d="M219.637 -37H241.472L224.676 64H202.841L219.637 -37Z" fill="#CBA100"/>
            <path d="M241.472 -37H263.307L246.511 64H224.676L241.472 -37Z" fill="#FFD500"/>
            <path d="M263.308 -37H285.143L268.346 64H246.511L263.308 -37Z" fill="#CBA100"/>
            <path d="M285.143 -37H306.978L290.181 64H268.346L285.143 -37Z" fill="#FFD500"/>
            <path d="M306.978 -37H328.813L312.016 64H290.181L306.978 -37Z" fill="#CBA100"/>
          </g>
        </svg>
      </div>
    </motion.section>
  )
}
