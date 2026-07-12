import { motion } from 'framer-motion'

type DisclaimerScreenProps = {
  visible: boolean
  onComplete: () => void
}

const paragraphs = [
  'The photographs, locations, and stories presented in this archive are part of my personal journey and are shared solely for artistic, documentary, and archival purposes.',
  "Any appearance of individuals, places, or events is intended with respect and without the intention to offend, misrepresent, or infringe upon anyone's privacy.",
  'By continuing, you acknowledge that this experience is a personal collection of memories, thoughtfully preserved and shared.',
]

export function DisclaimerScreen({ visible, onComplete }: DisclaimerScreenProps) {
  return (
    <motion.section
      className="disclaimer"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      onClick={onComplete}
      aria-hidden={!visible}
    >
      <h1>Disclaimer.</h1>
      <motion.div
        className="disclaimer-copy"
        initial="hidden"
        animate={visible ? 'visible' : 'hidden'}
        variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.12 } } }}
      >
        <motion.p variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.38 } } }}>Dear Visitor,</motion.p>
        {paragraphs.map((paragraph) => (
          <motion.p key={paragraph} variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.38 } } }}>
            {paragraph}
          </motion.p>
        ))}
      </motion.div>
      <motion.p className="continue" animate={{ opacity: [1, 0.72, 1] }} transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}>
        Click anywhere to continue.
      </motion.p>
    </motion.section>
  )
}
