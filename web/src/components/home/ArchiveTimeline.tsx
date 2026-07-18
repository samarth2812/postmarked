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
        <motion.div
          className="archive-footer-container"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Handcrafted Heart Icon */}
          <div className="footer-heart-wrapper">
            <svg
              width="69"
              height="69"
              viewBox="0 0 69 69"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="footer-heart-svg"
            >
              <path
                d="M25.875 5.75H14.375V11.5H8.625V17.25H2.875V34.5H8.625V40.25H14.375V46H20.125V51.75H25.875V57.5H31.625V63.25H37.375V57.5H43.125V51.75H48.875V46H54.625V40.25H60.375V34.5H66.125V17.25H60.375V11.5H54.625V5.75H43.125V11.5H37.375V17.25H31.625V11.5H25.875V5.75ZM25.875 11.5V17.25H31.625V23H37.375V17.25H43.125V11.5H54.625V17.25H60.375V34.5H54.625V40.25H48.875V46H43.125V51.75H37.375V57.5H31.625V51.75H25.875V46H20.125V40.25H14.375V34.5H8.625V17.25H14.375V11.5H25.875Z"
                fill="#C52929"
              />
            </svg>
          </div>

          {/* Spacing & text row */}
          <div className="footer-content-row">
            <a
              href="https://www.linkedin.com/in/samarth-dhawan28/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-text-link"
            >
              Collected, designed & built by Samarth Dhawan
            </a>
            <div className="footer-arrow-wrapper">
              <svg
                width="31"
                height="21"
                viewBox="0 0 41 31"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="footer-arrow-svg"
              >
                <path
                  d="M21.4352 24.7176C22.1049 24.0106 22.9654 23.2966 23.5793 22.4131C24.8577 20.5737 26.0343 18.6619 27.2009 16.7487C29.4166 13.115 31.596 9.45928 33.9761 5.50436C30.8815 6.51328 28.5854 9.12373 24.9492 8.51223C25.2711 7.94422 25.3656 7.49494 25.6047 7.39785C29.2645 5.91215 32.4233 3.65464 35.4526 1.18757C37.9167 -0.819293 39.2198 -0.273478 39.5188 2.75556C39.8326 5.93569 40.5081 9.07968 40.9796 12.2462C41.0564 12.7618 40.8955 13.3124 40.8349 13.9479C39.4868 13.3238 38.2572 10.6998 37.1462 6.07595C36.7512 6.70266 36.4434 7.1579 36.1685 7.63198C33.3962 12.4139 30.6807 17.2294 27.8313 21.9653C26.9155 23.4874 25.7804 24.9309 24.5177 26.1834C22.2573 28.4255 19.7761 28.3446 17.679 25.933C16.6196 24.7146 15.8149 23.2287 15.1199 21.7588C14.3248 20.0773 13.826 18.2601 13.1098 16.5382C12.6021 15.3176 11.9471 14.1576 11.3369 12.9283C9.89473 13.4804 9.30166 14.5514 8.65609 15.5176C5.89897 19.6442 3.81582 24.0972 2.2825 28.8076C2.09803 29.3743 1.98534 29.9918 1.67133 30.4787C1.47993 30.7753 0.968948 30.9937 0.597376 31C0.395819 31.0033 0.0198948 30.4937 0.0106289 30.2063C-0.0155777 29.394 -0.00608015 28.5491 0.189019 27.7663C1.51811 22.4324 3.68419 17.453 6.82383 12.9209C7.45508 12.0097 8.22569 11.1501 9.08115 10.4456C10.6242 9.17495 12.1919 9.23626 13.4323 10.7916C14.4403 12.0555 15.209 13.5486 15.8736 15.0331C16.848 17.2096 17.581 19.4918 18.5226 21.684C19.0478 22.9068 19.6954 24.1209 21.4352 24.7176Z"
                  fill="black"
                />
              </svg>
            </div>
          </div>
        </motion.div>
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
