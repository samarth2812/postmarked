import { motion } from 'framer-motion'
import logo from '../../../../docs/figma/LandingPage/big_logo.svg'

type LogoRevealProps = {
  visible: boolean
}

export function LogoReveal({ visible }: LogoRevealProps) {
  return (
    <motion.div
      className="logo-reveal"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: visible ? 0.28 : 0.34, ease: 'easeInOut' }}
      aria-hidden={!visible}
    >
      <img src={logo} alt="Postmarked" />
    </motion.div>
  )
}
