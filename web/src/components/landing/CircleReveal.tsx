import { motion } from 'framer-motion'

type CircleRevealProps = {
  active: boolean
}

export function CircleReveal({ active }: CircleRevealProps) {
  return (
    <motion.div
      className="circle-reveal"
      initial={false}
      animate={{
        clipPath: active
          ? 'circle(150vmax at var(--reveal-x) var(--reveal-y))'
          : 'circle(0px at var(--reveal-x) var(--reveal-y))',
        opacity: 1,
      }}
      transition={{ duration: active ? 0.72 : 0.2, ease: active ? [0.42, 0, 0.16, 1] : 'easeOut' }}
      aria-hidden="true"
    />
  )
}
