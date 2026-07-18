import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import './ArchiveTimeline.css'

interface PolaroidCard {
  caption: string;
}

interface LocationEntry {
  id: string;
  name: string;
  state: string;
  bgType: 'bg-theme-black' | 'bg-theme-white';
  polaroids: PolaroidCard[];
}

const LOCATIONS_DATA: LocationEntry[] = [
  {
    id: 'pondicherry',
    name: 'Pondicherry',
    state: 'Tamil Nadu',
    bgType: 'bg-theme-black',
    polaroids: [
      { caption: 'Promenade walk' },
      { caption: 'White Town lanes' },
      { caption: 'Auroville dome' },
      { caption: 'By the bay' }
    ]
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    bgType: 'bg-theme-white',
    polaroids: [
      { caption: 'Marina waves' },
      { caption: 'Kapaleeshwarar temple' },
      { caption: 'Filter coffee stop' },
      { caption: 'Sari shopping' }
    ]
  },
  {
    id: 'landour',
    name: 'Landour',
    state: 'Uttarakhand',
    bgType: 'bg-theme-black',
    polaroids: [
      { caption: 'Char Dukan pancakes' },
      { caption: 'Ivy Cottage view' },
      { caption: 'Mist in the pines' },
      { caption: 'Lal Tibba sunset' }
    ]
  },
  {
    id: 'mussoorie',
    name: 'Mussoorie',
    state: 'Uttarakhand',
    bgType: 'bg-theme-white',
    polaroids: [
      { caption: 'Mall Road lights' },
      { caption: 'Kempty cascade' },
      { caption: 'Library bazaar' },
      { caption: 'Clouds End walk' }
    ]
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    state: 'Uttarakhand',
    bgType: 'bg-theme-black',
    polaroids: [
      { caption: 'Laxman Jhula crossing' },
      { caption: 'Ganga Aarti glow' },
      { caption: 'Beetles Ashram walls' },
      { caption: 'Mountain breeze' }
    ]
  },
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'National Capital Territory',
    bgType: 'bg-theme-white',
    polaroids: [
      { caption: 'Lodi Gardens stroll' },
      { caption: 'Humayun\'s tomb' },
      { caption: 'Old Delhi spice walk' },
      { caption: 'Street side chai' }
    ]
  },
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    bgType: 'bg-theme-black',
    polaroids: [
      { caption: 'Palolem sunset' },
      { caption: 'Fontainhas colorful streets' },
      { caption: 'Fort Aguada breeze' },
      { caption: 'Shack lunches' }
    ]
  },
  {
    id: 'coorg',
    name: 'Coorg',
    state: 'Karnataka',
    bgType: 'bg-theme-white',
    polaroids: [
      { caption: 'Coffee estate paths' },
      { caption: 'Abbey falls splash' },
      { caption: 'Raja\'s seat mist' },
      { caption: 'Golden Temple peace' }
    ]
  },
  {
    id: 'ooty',
    name: 'Ooty',
    state: 'Tamil Nadu',
    bgType: 'bg-theme-black',
    polaroids: [
      { caption: 'Toy train ride' },
      { caption: 'Botanical blooms' },
      { caption: 'Pykara lake blue' },
      { caption: 'Tea estates rolling green' }
    ]
  },
  {
    id: 'coonoor',
    name: 'Coonoor',
    state: 'Tamil Nadu',
    bgType: 'bg-theme-white',
    polaroids: [
      { caption: 'Dolphin\'s Nose overlook' },
      { caption: 'Sim\'s park quiet' },
      { caption: 'Tea factory scent' },
      { caption: 'High tea afternoon' }
    ]
  },
  {
    id: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    bgType: 'bg-theme-black',
    polaroids: [
      { caption: 'Cubbon Park morning' },
      { caption: 'Lalbagh glasshouse' },
      { caption: 'Filter coffee mornings' },
      { caption: 'Corner House sundae' }
    ]
  },
  {
    id: 'nainital',
    name: 'Nainital',
    state: 'Uttarakhand',
    bgType: 'bg-theme-white',
    polaroids: [
      { caption: 'Naini Lake rowing' },
      { caption: 'Snow View peak' },
      { caption: 'Tiffin Top hike' },
      { caption: 'Mall Road reflection' }
    ]
  }
]

// Seeded random number generator to create stable, unique layout offsets for each card stack
function getSeededRandom(seedStr: string) {
  let h = 0
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0
  }
  return function () {
    let t = (h += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function ArchiveTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const connectorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateConnectorLine = () => {
      const container = containerRef.current
      const connector = connectorRef.current
      if (!container || !connector) return

      const dots = container.querySelectorAll('.timeline-dot-svg')
      if (dots.length < 2) return

      const containerRect = container.getBoundingClientRect()
      const firstDotRect = dots[0].getBoundingClientRect()
      const lastDotRect = dots[dots.length - 1].getBoundingClientRect()

      // Calculate vertical centers relative to the timeline container
      const topOffset = firstDotRect.top + firstDotRect.height / 2 - containerRect.top
      const bottomOffset = lastDotRect.top + lastDotRect.height / 2 - containerRect.top

      connector.style.top = `${topOffset}px`
      connector.style.height = `${bottomOffset - topOffset}px`
    }

    // Run measurement
    updateConnectorLine()

    // Set up resize listener to update line positions on viewport changes
    window.addEventListener('resize', updateConnectorLine)
    
    // Also run after a short delay for final layout settle (fonts/layouts rendering)
    const timer = setTimeout(updateConnectorLine, 150)

    return () => {
      window.removeEventListener('resize', updateConnectorLine)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div className="archive-timeline-container" id="archive-timeline" ref={containerRef}>
      {/* Central Timeline Layout */}
      <div className="timeline-wrapper">
        {/* Continuous Dotted Connector Line */}
        <div className="timeline-connector" ref={connectorRef} id="timeline-connector-line" />

        <div className="timeline-items-list">
          {LOCATIONS_DATA.map((loc, index) => (
            <TimelineItem
              key={loc.id}
              loc={loc}
              isFinal={index === LOCATIONS_DATA.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Signature Footer */}
      <footer className="archive-footer-section">
        <motion.a
          href="https://www.linkedin.com/in/samarthdhawan"
          target="_blank"
          rel="noopener noreferrer"
          className="archive-footer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="heart-icon">♡</span> Collected, designed & built by Samarth Dhawan
        </motion.a>
      </footer>
    </div>
  )
}

function TimelineItem({ loc, isFinal }: { loc: LocationEntry; isFinal: boolean }) {
  const itemRef = useRef<HTMLDivElement>(null)
  const isThemeBlack = loc.bgType === 'bg-theme-black'
  
  // Framer Motion entry stagger animation details
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05
      }
    }
  }

  const childVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 1, 0.5, 1] as [number, number, number, number]
      }
    }
  }

  // Pre-calculate stable random values for the polaroid cards in this stack (18 to 30 cards)
  const rand = getSeededRandom(loc.id)
  const count = 18 + Math.floor(rand() * 13) // 18 to 30 polaroids
  const polaroidsWithLayout = Array.from({ length: count }).map((_, pIndex) => {
    const angle = rand() * Math.PI * 2
    const radiusX = 160 + rand() * 140
    const radiusY = 70 + rand() * 70
    const distanceFactor = 0.15 + rand() * 0.85
    
    const offsetX = Math.cos(angle) * distanceFactor * radiusX
    const offsetY = Math.sin(angle) * distanceFactor * radiusY
    const rotation = (rand() * 26 - 13) // rotations between -13deg and +13deg
    const zIndex = pIndex + 1
    const breatheDuration = 8 + rand() * 6 // very slow (8s to 14s)
    const breatheDelay = rand() * -15 // asynchronous delay
    
    // Cycle through provided captions, fallback to generic
    const originalCaption = loc.polaroids[pIndex % loc.polaroids.length]?.caption
    const caption = originalCaption || `Memory #${pIndex + 1}`
    
    return {
      caption,
      rotation,
      offsetX,
      offsetY,
      zIndex,
      breatheDuration,
      breatheDelay
    }
  })

  // Determine section background style classes
  let bgClass = `curved-section ${loc.bgType}`
  if (isFinal) bgClass += ' final-section'

  return (
    <section className={bgClass} ref={itemRef}>
      {isThemeBlack && (
        <div className={`black-bg-wrapper ${loc.id !== 'pondicherry' ? 'has-top-curve' : ''} has-bottom-curve`}>
          {loc.id !== 'pondicherry' && <div className="curve-top" />}
          <div className="curve-bottom" />
        </div>
      )}
      <motion.div
        className={`timeline-item-content ${isThemeBlack ? 'theme-dark' : 'theme-light'}`}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-120px" }}
      >
        {/* Text & Stack Area (aligned content) */}
        <div className="timeline-item-details">
          <motion.div className="location-header-wrapper" variants={childVariants}>
            <span className="location-state-label">
              {loc.state || 'India'}
            </span>
            <div className="location-title-row">
              <div className="timeline-dot-container">
                <img src="/assets/current_location.svg" className="timeline-dot-svg" alt="marker" />
              </div>
              <h2 className="location-title">
                {loc.name}
              </h2>
            </div>
          </motion.div>

          <motion.div className="browse-button-wrapper" variants={childVariants}>
            <button className="browse-roll-cta">
              Browse the Roll
            </button>
          </motion.div>

          <motion.div className="polaroid-stack-wrapper" variants={childVariants}>
            <div className="polaroid-card-stack">
              {polaroidsWithLayout.map((card, idx) => (
                <div
                  key={idx}
                  className="polaroid-card-item"
                  style={{
                    transform: `translate(${card.offsetX}px, ${card.offsetY}px) rotate(${card.rotation}deg)`,
                    zIndex: card.zIndex,
                    animation: `polaroidIdleAnimation ${card.breatheDuration}s ease-in-out infinite`,
                    animationDelay: `${card.breatheDelay}s`
                  } as React.CSSProperties}
                >
                  {/* Polaroid image placeholder */}
                  <div className="polaroid-image-frame">
                    <div className="polaroid-img-placeholder" />
                  </div>
                  {/* Handwritten caption */}
                  <div className="polaroid-caption-strip">
                    {card.caption}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
