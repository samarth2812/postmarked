import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './ArchiveTimeline.css'

interface PolaroidCard {
  caption: string;
  imageUrl?: string;
  description?: string;
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
      { 
        caption: 'Promenade walk', 
        imageUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=400&q=80',
        description: 'A peaceful evening stroll along the rocky beach of Pondicherry, capturing the gentle waves and the soft coastal breeze.'
      },
      { 
        caption: 'White Town lanes', 
        imageUrl: 'https://images.unsplash.com/photo-1603258591244-c689ba488d5e?auto=format&fit=crop&w=400&q=80',
        description: 'Wandering through the vibrant yellow streets lined with colonial French villas and blooming bougainvillea.'
      },
      { 
        caption: 'Auroville dome', 
        imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb061295a?auto=format&fit=crop&w=400&q=80',
        description: 'The magnificent Matrimandir, a symbol of peaceful coexistence and spiritual unity, rising golden against the sky.'
      },
      { 
        caption: 'By the bay', 
        imageUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=400&q=80',
        description: 'Looking out at the vast blue horizon of the Bay of Bengal, where fishing boats drift under the soft morning sun.'
      }
    ]
  },
  {
    id: 'chennai',
    name: 'Chennai',
    state: 'Tamil Nadu',
    bgType: 'bg-theme-white',
    polaroids: [
      { 
        caption: 'Marina waves', 
        imageUrl: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=400&q=80',
        description: 'Catching the sunset at Marina Beach, one of the longest natural urban beaches in the world, filled with energy.'
      },
      { 
        caption: 'Kapaleeshwarar temple', 
        imageUrl: 'https://images.unsplash.com/photo-1609137144814-722a4f404495?auto=format&fit=crop&w=400&q=80',
        description: 'Admiring the detailed Dravidian architecture and towering gopuram of this active, centuries-old sacred temple in Mylapore.'
      },
      { 
        caption: 'Filter coffee stop', 
        imageUrl: 'https://images.unsplash.com/photo-1587049013516-72f10b776269?auto=format&fit=crop&w=400&q=80',
        description: 'Savoring a hot, frothy cup of traditional South Indian filter coffee, poured back and forth from brass tumblers.'
      },
      { 
        caption: 'Sari shopping', 
        imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=400&q=80',
        description: 'Exploring the busy markets of T. Nagar, filled with rows of brilliant, handwoven silk Kanchipuram saris.'
      }
    ]
  },
  {
    id: 'landour',
    name: 'Landour',
    state: 'Uttarakhand',
    bgType: 'bg-theme-black',
    polaroids: [
      { 
        caption: 'Char Dukan pancakes', 
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=400&q=80',
        description: 'Enjoying classic cinnamon pancakes and hot ginger tea at the historic, cozy Char Dukan square.'
      },
      { 
        caption: 'Ivy Cottage view', 
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
        description: 'Looking out at the snow-capped Himalayan peaks from the quiet, winding pathways of Ivy Cottage.'
      },
      { 
        caption: 'Mist in the pines', 
        imageUrl: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=400&q=80',
        description: 'Wandering under towering deodars and pines as thick mountain fog rolls silently over the hills.'
      },
      { 
        caption: 'Lal Tibba sunset', 
        imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80',
        description: 'Watching the sky turn crimson and gold over the distant snow peaks from the highest viewpoint in Landour.'
      }
    ]
  },
  {
    id: 'mussoorie',
    name: 'Mussoorie',
    state: 'Uttarakhand',
    bgType: 'bg-theme-white',
    polaroids: [
      { 
        caption: 'Mall Road lights', 
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
        description: 'A lively walk down the bustling Mall Road as colonial streetlamps light up the mountain ridge.'
      },
      { 
        caption: 'Kempty cascade', 
        imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=400&q=80',
        description: 'Listening to the roar of Kempty Falls splashing down rock formations into a fresh mountain pool.'
      },
      { 
        caption: 'Library bazaar', 
        imageUrl: 'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=400&q=80',
        description: 'Passing by the iconic colonial-era library building at the gateway of Mussoories historical market.'
      },
      { 
        caption: 'Clouds End walk', 
        imageUrl: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=400&q=80',
        description: 'Walking to the edge of the ridge where the dense oak forests end and the deep valley opens up.'
      }
    ]
  },
  {
    id: 'rishikesh',
    name: 'Rishikesh',
    state: 'Uttarakhand',
    bgType: 'bg-theme-black',
    polaroids: [
      { 
        caption: 'Laxman Jhula crossing', 
        imageUrl: 'https://images.unsplash.com/photo-1598977123418-45f04b61b4bb?auto=format&fit=crop&w=400&q=80',
        description: 'Walking across the swaying suspension bridge, looking down at the fast-flowing emerald waters of the Ganges.'
      },
      { 
        caption: 'Ganga Aarti glow', 
        imageUrl: 'https://images.unsplash.com/photo-1561361062-856753540121?auto=format&fit=crop&w=400&q=80',
        description: 'Experiencing the evening prayer ceremony at Triveni Ghat, with hundreds of tiny oil lamps floating on the river.'
      },
      { 
        caption: 'Beatles Ashram walls', 
        imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=400&q=80',
        description: 'Exploring the abandoned, graffiti-covered dome structures where the Beatles composed the White Album in 1968.'
      },
      { 
        caption: 'Mountain breeze', 
        imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=400&q=80',
        description: 'Taking a deep breath of crisp mountain air at a quiet riverbank retreat, surrounded by green Himalayan foothills.'
      }
    ]
  },
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'National Capital Territory',
    bgType: 'bg-theme-white',
    polaroids: [
      { 
        caption: 'Lodi Gardens stroll', 
        imageUrl: 'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?auto=format&fit=crop&w=400&q=80',
        description: 'Walking among the majestic 15th-century Sayyid and Lodi dynasty tombs, surrounded by manicured lawns and old trees.'
      },
      { 
        caption: 'Humayun\'s tomb', 
        imageUrl: 'https://images.unsplash.com/photo-1587135941948-670b381f08e9?auto=format&fit=crop&w=400&q=80',
        description: 'Admiring the grand red sandstone Mughal architecture that inspired the creation of the Taj Mahal.'
      },
      { 
        caption: 'Old Delhi spice walk', 
        imageUrl: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&q=80',
        description: 'Navigating the narrow, crowded lanes of Khari Baoli, the largest wholesale spice market in Asia.'
      },
      { 
        caption: 'Street side chai', 
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
        description: 'Sipping hot cardamon chai from a clay kulhad at a busy corner shop in Connaught Place.'
      }
    ]
  },
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    bgType: 'bg-theme-black',
    polaroids: [
      { 
        caption: 'Palolem sunset', 
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=400&q=80',
        description: 'Watching the sun dip below the Arabian Sea, painting the sky in pastel hues behind leaning coconut palms.'
      },
      { 
        caption: 'Fontainhas colorful streets', 
        imageUrl: 'https://images.unsplash.com/photo-1616843413587-9e3a37f7f3f2?auto=format&fit=crop&w=400&q=80',
        description: 'Wandering past bright yellow, blue, and red Portuguese villas in Panaji\'s old Latin Quarter.'
      },
      { 
        caption: 'Fort Aguada breeze', 
        imageUrl: 'https://images.unsplash.com/photo-1540206395-68808572332f?auto=format&fit=crop&w=400&q=80',
        description: 'Standing on the ramparts of the 17th-century lighthouse fort, feeling the cool ocean spray.'
      },
      { 
        caption: 'Shack lunches', 
        imageUrl: 'https://images.unsplash.com/photo-1501446529957-6226bd447c46?auto=format&fit=crop&w=400&q=80',
        description: 'Enjoying fresh, spicy fish curry and cold beverages with sand underfoot at a beachside shack.'
      }
    ]
  },
  {
    id: 'coorg',
    name: 'Coorg',
    state: 'Karnataka',
    bgType: 'bg-theme-white',
    polaroids: [
      { 
        caption: 'Coffee estate paths', 
        imageUrl: 'https://images.unsplash.com/photo-1500627869374-13cd993b1115?auto=format&fit=crop&w=400&q=80',
        description: 'Walking down shady forest trails under the canopy of silver oak and pepper vines, surrounded by coffee plants.'
      },
      { 
        caption: 'Abbey falls splash', 
        imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=400&q=80',
        description: 'Watching the Kaveri river cascade over rock faces, creating a cool mist throughout the surrounding valley.'
      },
      { 
        caption: 'Raja\'s seat mist', 
        imageUrl: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=400&q=80',
        description: 'Gazing at the rolling green valleys as a thick blanket of morning fog rises slowly from the hills.'
      },
      { 
        caption: 'Golden Temple peace', 
        imageUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=400&q=80',
        description: 'Experiencing the serenity of the Namdroling Monastery, home to massive golden Buddha statues and colorful murals.'
      }
    ]
  },
  {
    id: 'ooty',
    name: 'Ooty',
    state: 'Tamil Nadu',
    bgType: 'bg-theme-black',
    polaroids: [
      { 
        caption: 'Toy train ride', 
        imageUrl: 'https://images.unsplash.com/photo-1532408840957-22729327b360?auto=format&fit=crop&w=400&q=80',
        description: 'Riding the historic steam-operated Nilgiri Mountain Railway, crossing narrow bridges and dark stone tunnels.'
      },
      { 
        caption: 'Botanical blooms', 
        imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80',
        description: 'Walking through terraces of exotic flowers, ferns, and a 20-million-year-old fossilized tree trunk.'
      },
      { 
        caption: 'Pykara lake blue', 
        imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80',
        description: 'Boating on the quiet, pine-fringed waters of Pykara Lake, away from the busy town streets.'
      },
      { 
        caption: 'Tea estates rolling green', 
        imageUrl: 'https://images.unsplash.com/photo-1554160113-748ff8d07019?auto=format&fit=crop&w=400&q=80',
        description: 'Stepping into the geometric rows of bright green tea leaves covering the hillsides like a carpet.'
      }
    ]
  },
  {
    id: 'coonoor',
    name: 'Coonoor',
    state: 'Tamil Nadu',
    bgType: 'bg-theme-white',
    polaroids: [
      { 
        caption: 'Dolphin\'s Nose overlook', 
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
        description: 'Standing on a massive rock peak, watching Catherine Falls cascade into the deep valley far below.'
      },
      { 
        caption: 'Sim\'s park quiet', 
        imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=400&q=80',
        description: 'Strolling through this botanical garden containing century-old trees and manicured rose beds.'
      },
      { 
        caption: 'Tea factory scent', 
        imageUrl: 'https://images.unsplash.com/photo-1563822249548-9a72b6353cdb?auto=format&fit=crop&w=400&q=80',
        description: 'Taking a tour to see how raw tea leaves are crushed, dried, and packaged, smelling the rich aroma.'
      },
      { 
        caption: 'High tea afternoon', 
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80',
        description: 'Relaxing on the porch of a colonial-style bungalow with a freshly brewed cup of black Nilgiri tea.'
      }
    ]
  },
  {
    id: 'bangalore',
    name: 'Bangalore',
    state: 'Karnataka',
    bgType: 'bg-theme-black',
    polaroids: [
      { 
        caption: 'Cubbon Park morning', 
        imageUrl: 'https://images.unsplash.com/photo-1500627869374-13cd993b1115?auto=format&fit=crop&w=400&q=80',
        description: 'Walking under giant bamboo groves as morning sunlight breaks through the leaves of this central forest.'
      },
      { 
        caption: 'Lalbagh glasshouse', 
        imageUrl: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=400&q=80',
        description: 'Admiring the glass exhibition palace modeled after London\'s Crystal Palace, surrounded by rare plants.'
      },
      { 
        caption: 'Filter coffee mornings', 
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80',
        description: 'Standing on the pavement of a traditional café, drinking hot coffee before the city wakes up.'
      },
      { 
        caption: 'Corner House sundae', 
        imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=400&q=80',
        description: 'Sharing a rich, warm chocolate-fudge Death by Chocolate sundae at a legendary local dessert shop.'
      }
    ]
  },
  {
    id: 'nainital',
    name: 'Nainital',
    state: 'Uttarakhand',
    bgType: 'bg-theme-white',
    polaroids: [
      { 
        caption: 'Naini Lake rowing', 
        imageUrl: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&q=80',
        description: 'Drifting across the pear-shaped volcanic lake, surrounded by rising forested mountain slopes.'
      },
      { 
        caption: 'Snow View peak', 
        imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=400&q=80',
        description: 'Looking at the high Himalayan peaks through a telescope from the top of the cable car route.'
      },
      { 
        caption: 'Tiffin Top hike', 
        imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
        description: 'Trekking through oak forests to reach the rocky peak, enjoying a birds-eye view of Nainital.'
      },
      { 
        caption: 'Mall Road reflection', 
        imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
        description: 'Watching the town lights reflect on the ripples of the dark lake as the night temperature drops.'
      }
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

export interface PolaroidLayoutCard {
  caption: string;
  imageUrl?: string;
  description?: string;
  offsetX: number;
  offsetY: number;
  rotation: number;
  scale: number;
  zIndex: number;
  breatheDuration: number;
  breatheDelay: number;
  driftY: number;
  driftRotate: number;
  entryDelay: number;
  entryRotateOffset: number;
  hoverDelay: number;
  hoverTilt: number;
}

export function getPolaroidsForLocation(loc: LocationEntry): PolaroidLayoutCard[] {
  const rand = getSeededRandom(loc.id)
  const memoriesCount = loc.polaroids.length
  const count = 12 + Math.floor(rand() * 4) // deterministic count: 12, 13, 14, or 15 polaroids

  const zIndices = Array.from({ length: count }, (_, i) => i + 1)
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [zIndices[i], zIndices[j]] = [zIndices[j], zIndices[i]]
  }

  return Array.from({ length: count }).map((_, pIndex) => {
    const memoryIndex = pIndex % memoriesCount
    const memory = loc.polaroids[memoryIndex]
    
    // We define a set of 8 distinct target layout zones to scatter cards across the screen.
    const zones = [
      [-320, -180, 120, 240],  // Zone 0: Beneath CTA
      [-180, -60, 80, 180],    // Zone 1: Left-Center
      [-60, 60, 20, 120],      // Zone 2: Center Pile
      [60, 180, -140, 60],     // Zone 3: Right-Center
      [180, 320, -80, 80],     // Zone 4: Far Right
      [120, 240, 140, 260],    // Zone 5: Bottom Right
      [180, 300, -240, -120],  // Zone 6: Top Right
      [-80, 80, 40, 140]       // Zone 7: Center Pile 2
    ]
    
    let zoneIndex = pIndex % zones.length
    if (pIndex >= zones.length) {
      zoneIndex = Math.floor(rand() * zones.length)
    }
    
    const zone = zones[zoneIndex]
    const offsetX = zone[0] + rand() * (zone[1] - zone[0])
    const offsetY = zone[2] + rand() * (zone[3] - zone[2])
    const rotation = -18 + rand() * 36
    const scale = 0.95 + rand() * 0.10
    const zIndex = zIndices[pIndex]
    
    const breatheDuration = 6 + rand() * 4
    const breatheDelay = -rand() * breatheDuration
    const driftY = 1.5 + rand() * 1.5
    const driftRotate = 0.3 + rand() * 0.5
    const entryDelay = pIndex * 0.08
    const entryRotateOffset = -20 + rand() * 40
    const hoverDelay = (count - 1 - pIndex) * 0.012
    const hoverTilt = (rand() * 3 - 1.5) * (pIndex / count)
    
    return {
      caption: memory.caption,
      imageUrl: memory.imageUrl,
      description: memory.description,
      offsetX,
      offsetY,
      rotation,
      scale,
      zIndex,
      breatheDuration,
      breatheDelay,
      driftY,
      driftRotate,
      entryDelay,
      entryRotateOffset,
      hoverDelay,
      hoverTilt
    }
  })
}

export function ArchiveTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const connectorRef = useRef<HTMLDivElement>(null)

  const [activePolaroid, setActivePolaroid] = useState<{
    locationId: string;
    cardIndex: number;
    card: PolaroidLayoutCard;
  } | null>(null)

  const activeLocation = activePolaroid
    ? LOCATIONS_DATA.find((l) => l.id === activePolaroid.locationId)
    : null

  const locationCards = activeLocation ? getPolaroidsForLocation(activeLocation) : []

  const handleNext = () => {
    if (!activePolaroid || locationCards.length === 0) return
    const nextIdx = (activePolaroid.cardIndex + 1) % locationCards.length
    setActivePolaroid({
      locationId: activePolaroid.locationId,
      cardIndex: nextIdx,
      card: locationCards[nextIdx]
    })
  }

  const handlePrev = () => {
    if (!activePolaroid || locationCards.length === 0) return
    const prevIdx = (activePolaroid.cardIndex - 1 + locationCards.length) % locationCards.length
    setActivePolaroid({
      locationId: activePolaroid.locationId,
      cardIndex: prevIdx,
      card: locationCards[prevIdx]
    })
  }

  // Handle keyboard events (Esc, ArrowRight, ArrowLeft)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePolaroid(null)
      } else if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }

    if (activePolaroid) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activePolaroid, locationCards])

  // Dispatch custom event to lock scroll
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('lightbox-toggle', {
        detail: { open: !!activePolaroid }
      })
    )
  }, [activePolaroid])

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
              onCardClick={(cardIndex, card) => setActivePolaroid({ locationId: loc.id, cardIndex, card })}
              activeCardIndex={activePolaroid?.locationId === loc.id ? activePolaroid.cardIndex : undefined}
              activeLocationId={activePolaroid?.locationId}
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

      {/* Lightbox / Gallery Portal */}
      <AnimatePresence>
        {activePolaroid && activeLocation && (
          <div className="lightbox-portal-root">
            {/* Dark glass backdrop */}
            <motion.div
              className="glass-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
              onClick={() => setActivePolaroid(null)}
            />

            <div className="lightbox-content-container">
              {/* Left Navigation Arrow */}
              <button 
                className="lightbox-nav-btn prev-btn" 
                onClick={handlePrev}
                aria-label="Previous image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              {/* Centered Enlarged Polaroid Card */}
              <div className="polaroid-wrapper-enlarged">
                <motion.div
                  layoutId={`polaroid-card-${activePolaroid.locationId}-${activePolaroid.cardIndex}`}
                  className="polaroid-card-enlarged"
                  onClick={() => setActivePolaroid(null)}
                  transition={{
                    type: 'spring',
                    stiffness: 90,
                    damping: 15,
                    mass: 1.1
                  }}
                >
                  <div className="polaroid-image-frame-enlarged">
                    {activePolaroid.card.imageUrl ? (
                      <img
                        src={activePolaroid.card.imageUrl}
                        alt={activePolaroid.card.caption}
                        className="polaroid-img-enlarged"
                      />
                    ) : (
                      <div className="polaroid-img-placeholder-enlarged" />
                    )}
                  </div>
                  <div className="polaroid-caption-strip-enlarged">
                    {activePolaroid.card.caption}
                  </div>
                </motion.div>

                {/* Info Panel under the Polaroid card */}
                <motion.div 
                  className="lightbox-info-panel"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  <div className="lightbox-location-badge">
                    <img src="/assets/current_location.svg" className="lightbox-location-icon" alt="Location" />
                    <span>{activeLocation.name}, {activeLocation.state}</span>
                  </div>
                </motion.div>
              </div>

              {/* Right Navigation Arrow */}
              <button 
                className="lightbox-nav-btn next-btn" 
                onClick={handleNext}
                aria-label="Next image"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>

            {/* Close Button at Top Right of Screen */}
            <button 
              className="lightbox-close-btn" 
              onClick={() => setActivePolaroid(null)}
              aria-label="Close gallery"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function TimelineItem({ 
  loc, 
  isFinal, 
  onCardClick,
  activeCardIndex,
  activeLocationId
}: { 
  loc: LocationEntry; 
  isFinal: boolean; 
  onCardClick: (cardIndex: number, card: PolaroidLayoutCard) => void;
  activeCardIndex?: number;
  activeLocationId?: string;
}) {
  const itemRef = useRef<HTMLDivElement>(null)
  const isThemeBlack = loc.bgType === 'bg-theme-black'
  
  // Framer Motion entry stagger animation details
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.08,
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

  const polaroidsWithLayout = getPolaroidsForLocation(loc)

  // Framer Motion staggered spring drop-in animation configurations
  const cardVariants = {
    hidden: (card: PolaroidLayoutCard) => ({
      opacity: 0,
      x: card.offsetX,
      y: card.offsetY - 200,
      rotate: card.rotation + card.entryRotateOffset,
      scale: card.scale * 0.8
    }),
    visible: (card: PolaroidLayoutCard) => ({
      opacity: 1,
      x: card.offsetX,
      y: card.offsetY,
      rotate: card.rotation,
      scale: card.scale,
      transition: {
        type: 'spring' as const,
        stiffness: 85,
        damping: 14,
        mass: 1.1,
        delay: card.entryDelay
      }
    })
  }

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
        <div className="timeline-item-details">
          <div className="timeline-text-side">
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
          </div>

          <motion.div className="polaroid-stack-wrapper" variants={childVariants}>
            <div className="polaroid-card-stack">
              {polaroidsWithLayout.map((card, idx) => (
                <motion.div
                  key={idx}
                  layoutId={`polaroid-card-${loc.id}-${idx}`}
                  className="polaroid-card-item"
                  custom={card}
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  onClick={() => onCardClick(idx, card)}
                  style={{
                    zIndex: card.zIndex,
                    '--hover-delay': `${card.hoverDelay}s`,
                    '--hover-tilt': `${card.hoverTilt}deg`,
                    '--offset-x': `${card.offsetX}px`,
                    '--offset-y': `${card.offsetY}px`,
                    '--rotation': `${card.rotation}deg`,
                    '--scale': card.scale,
                    cursor: 'pointer',
                    opacity: (activeLocationId === loc.id && activeCardIndex === idx) ? 0 : 1,
                    pointerEvents: activeLocationId ? 'none' : 'auto'
                  } as React.CSSProperties}
                >
                  <div
                    className="polaroid-card-inner"
                    style={{
                      animation: `polaroidIdleAnimation ${card.breatheDuration}s ease-in-out infinite`,
                      animationDelay: `${card.breatheDelay}s`,
                      '--drift-y': `${card.driftY}px`,
                      '--drift-rotate': `${card.driftRotate}deg`,
                    } as React.CSSProperties}
                  >
                    <div className="polaroid-image-frame">
                      {card.imageUrl ? (
                        <img 
                          src={card.imageUrl} 
                          alt={card.caption} 
                          className="polaroid-img" 
                          loading="lazy"
                        />
                      ) : (
                        <div className="polaroid-img-placeholder" />
                      )}
                    </div>
                    <div className="polaroid-caption-strip">
                      {card.caption}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
