import { useEffect, useRef, useState, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'

type City = {
  id: string
  name: string
  lat: number
  lon: number
  polaroidCount: number
}

const cities: City[] = [
  { id: 'delhi', name: 'Delhi', lat: 28.6139, lon: 77.2090, polaroidCount: 3 },
  { id: 'mussoorie', name: 'Mussoorie', lat: 30.4598, lon: 78.0792, polaroidCount: 2 },
  { id: 'landour', name: 'Landour', lat: 30.4674, lon: 78.1002, polaroidCount: 4 },
  { id: 'rishikesh', name: 'Rishikesh', lat: 30.0869, lon: 78.2676, polaroidCount: 3 },
  { id: 'nainital', name: 'Nainital', lat: 29.3803, lon: 79.4636, polaroidCount: 2 },
  { id: 'goa', name: 'Goa', lat: 15.2993, lon: 74.1240, polaroidCount: 4 },
  { id: 'bangalore', name: 'Bangalore', lat: 12.9716, lon: 77.5946, polaroidCount: 3 },
  { id: 'coorg', name: 'Coorg', lat: 12.3375, lon: 75.8069, polaroidCount: 2 },
  { id: 'ooty', name: 'Ooty', lat: 11.4102, lon: 76.6950, polaroidCount: 3 },
  { id: 'coonoor', name: 'Coonoor', lat: 11.3530, lon: 76.7959, polaroidCount: 2 },
  { id: 'chennai', name: 'Chennai', lat: 13.0827, lon: 80.2707, polaroidCount: 4 },
  { id: 'puducherry', name: 'Puducherry', lat: 11.9416, lon: 79.8083, polaroidCount: 3 }
]

type ParticleMapProps = {
  showPolaroids: boolean
  onAssemblyComplete: () => void
}

type ParticleData = {
  positions: Float32Array
  velocities: Float32Array
  initialPositions: Float32Array
  targets: Float32Array
  opacities: Float32Array
  sizes: Float32Array
  seeds: Float32Array
  isMap: Uint8Array
  count: number
  numMapParticles: number
}

// Custom Shaders for circular antialiased particles
const vertexShader = `
  attribute float aSize;
  attribute float aOpacity;
  varying float vOpacity;
  
  void main() {
    vOpacity = aOpacity;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Size attenuation (adjust sizes naturally based on distance from camera)
    gl_PointSize = aSize * (15.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying float vOpacity;
  
  void main() {
    // Render smooth antialiased circular dots
    float dist = length(gl_PointCoord - vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.4, dist);
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * vOpacity);
  }
`

// A seedable pseudo-random number generator (Mulberry32) for render purity
function createRandom(seed: number) {
  let a = seed
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function ParticleMap({ showPolaroids, onAssemblyComplete }: ParticleMapProps) {
  const { viewport } = useThree()
  const { width, height } = viewport
  
  // States to avoid accessing refs during render
  const [rawPoints, setRawPoints] = useState<{ x: number; y: number }[]>([])
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number }>({ x: 418.5, y: 471.0 })
  
  // Track timeline in refs for high frequency useFrame updates without re-renders
  const elapsedTimeRef = useRef(0)
  const assemblyCompleteTriggeredRef = useRef(false)
  
  // Reference for updating the positions inside the frame loop
  const particlesRef = useRef<ParticleData | null>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  
  // Dynamic scaling to center and fit the map to screen height/width proportionally
  const scale = useMemo(() => {
    const mapWidth = 835
    const mapHeight = 940
    // Fill up to 75% of screen size to leave comfortable margin
    const scaleX = (width * 0.75) / mapWidth
    const scaleY = (height * 0.75) / mapHeight
    return Math.min(scaleX, scaleY)
  }, [width, height])
  
  // Load and parse SVG outline on mount
  useEffect(() => {
    fetch('/assets/indiamap.svg')
      .then((res) => res.text())
      .then((svgText) => {
        const loader = new SVGLoader()
        const svgData = loader.parse(svgText)
        
        let minX = Infinity, maxX = -Infinity
        let minY = Infinity, maxY = -Infinity
        
        // Sum subpath lengths to allocate particles proportionally
        let totalLength = 0
        const pathsData: { subPath: THREE.Path; length: number }[] = []
        
        svgData.paths.forEach((path) => {
          path.subPaths.forEach((subPath) => {
            const len = subPath.getLength()
            if (len > 0) {
              totalLength += len
              pathsData.push({ subPath, length: len })
            }
          })
        })
        
        // Target around 7,500 particles for map outline
        const MAP_PARTICLE_TARGET = 7500
        const tempPoints: THREE.Vector2[] = []
        
        pathsData.forEach(({ subPath, length }) => {
          const count = Math.max(2, Math.round((length / totalLength) * MAP_PARTICLE_TARGET))
          const pts = subPath.getSpacedPoints(count)
          pts.forEach((pt: THREE.Vector2) => {
            tempPoints.push(new THREE.Vector2(pt.x, pt.y))
            minX = Math.min(minX, pt.x)
            maxX = Math.max(maxX, pt.x)
            minY = Math.min(minY, pt.y)
            maxY = Math.max(maxY, pt.y)
          })
        })
        
        const centerX = (minX + maxX) / 2
        const centerY = (minY + maxY) / 2
        
        const points = tempPoints.map((pt) => ({
          x: pt.x - centerX,
          y: centerY - pt.y // Invert Y coordinate
        }))
        
        setMapCenter({ x: centerX, y: centerY })
        setRawPoints(points)
      })
      .catch((err) => console.error('Error loading SVG map:', err))
  }, [])
  
  // Initialize particles once rawPoints are loaded (pure useMemo)
  const particleData = useMemo(() => {
    if (rawPoints.length === 0) return null
    
    const numMapParticles = rawPoints.length
    const numAmbientParticles = 1500 // Ambient background floating dots
    const count = numMapParticles + numAmbientParticles
    
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const initialPositions = new Float32Array(count * 3)
    const targets = new Float32Array(count * 3)
    const opacities = new Float32Array(count)
    const sizes = new Float32Array(count)
    const seeds = new Float32Array(count * 3)
    const isMap = new Uint8Array(count)
    
    const rand = createRandom(12345)
    
    for (let i = 0; i < count; i++) {
      // 1. Initial Position: Random distribution in a box fitting standard screen bounds
      const initX = (rand() - 0.5) * 20
      const initY = (rand() - 0.5) * 15
      const initZ = (rand() - 0.5) * 8
      
      positions[i * 3] = initX
      positions[i * 3 + 1] = initY
      positions[i * 3 + 2] = initZ
      
      initialPositions[i * 3] = initX
      initialPositions[i * 3 + 1] = initY
      initialPositions[i * 3 + 2] = initZ
      
      // 2. Velocities (small drift speed)
      velocities[i * 3] = (rand() - 0.5) * 0.1
      velocities[i * 3 + 1] = (rand() - 0.5) * 0.1
      velocities[i * 3 + 2] = (rand() - 0.5) * 0.05
      
      // 3. Size: Mostly tiny, few medium
      if (rand() < 0.85) {
        sizes[i] = 1.0 + rand() * 1.0 // Tiny particles
      } else {
        sizes[i] = 2.0 + rand() * 2.0 // Medium particles
      }
      
      // 4. Seeds for drift math
      seeds[i * 3] = rand()
      seeds[i * 3 + 1] = rand()
      seeds[i * 3 + 2] = rand()
      
      // 5. Targets and opacities setup
      if (i < numMapParticles) {
        isMap[i] = 1
        opacities[i] = 1.0 // Map outline is fully opaque
        
        const pt = rawPoints[i]
        targets[i * 3] = pt.x * scale
        targets[i * 3 + 1] = pt.y * scale
        targets[i * 3 + 2] = (rand() - 0.5) * 0.05 // Slight depth spread
      } else {
        isMap[i] = 0
        
        // Split ambient into permanent faint and fading ambient
        const ambientIndex = i - numMapParticles
        const isPermanent = ambientIndex < 400 // 400 stay visible
        
        if (isPermanent) {
          opacities[i] = 0.2 + rand() * 0.15 // Permanent background drift
        } else {
          opacities[i] = 0.5 + rand() * 0.2 // Fades to 0 in final stage
        }
        
        // Random floating targets within viewport limits
        targets[i * 3] = (rand() - 0.5) * 20
        targets[i * 3 + 1] = (rand() - 0.5) * 15
        targets[i * 3 + 2] = (rand() - 0.5) * 8
      }
    }
    
    return {
      positions,
      velocities,
      initialPositions,
      targets,
      opacities,
      sizes,
      seeds,
      isMap,
      count,
      numMapParticles
    }
  }, [rawPoints, scale])
  
  // Synchronize mutable particlesRef for useFrame physics loop
  useEffect(() => {
    particlesRef.current = particleData
  }, [particleData])
  
  // Re-scale map targets dynamically when viewport scale changes
  useEffect(() => {
    const data = particlesRef.current
    if (!data || rawPoints.length === 0) return
    
    const targets = data.targets
    for (let i = 0; i < data.numMapParticles; i++) {
      const pt = rawPoints[i]
      targets[i * 3] = pt.x * scale
      targets[i * 3 + 1] = pt.y * scale
    }
  }, [scale, rawPoints])
  
  // Calculate screen-projected coordinates for polaroids overlay (safe for render phase)
  const cityPositions3D = useMemo(() => {
    if (rawPoints.length === 0) return []
    const mapCenterX = mapCenter.x
    const mapCenterY = mapCenter.y
    
    return cities.map((city) => {
      // Apply the calculated affine transform:
      const svgX = 28.998341 * city.lon - 0.619147 * city.lat - 1980.125634
      const svgY = 0.384495 * city.lon - 32.192500 * city.lat + 1140.291126
      
      // Shift to centered R3F coords and scale:
      const x3D = (svgX - mapCenterX) * scale
      const y3D = (mapCenterY - svgY) * scale
      return { ...city, x3D, y3D }
    })
  }, [scale, rawPoints, mapCenter])
  
  // Core physics updates run at 60 FPS on GPU frame request loop
  useFrame((state, delta) => {
    const data = particlesRef.current
    if (!data) return
    
    const dt = Math.min(delta, 0.1) // Cap time step to avoid lag jumps
    elapsedTimeRef.current += dt
    const elapsed = elapsedTimeRef.current
    const time = state.clock.getElapsedTime()
    
    const { positions, velocities, targets, opacities, seeds, isMap, count, numMapParticles } = data
    
    // Phase 1 (0-1s): Calm drift
    // Phase 2 (1-2.2s): Assemble into outline
    // Phase 3 (2.2s+): Complete
    let assembleFactor = 0
    if (elapsed > 1.0) {
      assembleFactor = Math.min(1.0, (elapsed - 1.0) / 1.2) // Form over 1.2 seconds
    }
    
    // Dispatch assembly finished trigger
    if (elapsed >= 2.3 && !assemblyCompleteTriggeredRef.current) {
      assemblyCompleteTriggeredRef.current = true
      onAssemblyComplete()
    }
    
    for (let i = 0; i < count; i++) {
      const seedIdx = i * 3
      const seedX = seeds[seedIdx]
      const seedY = seeds[seedIdx + 1]
      const seedZ = seeds[seedIdx + 2]
      
      // 1. Air/dust breathing offset calculations using trigonometry
      const driftX = Math.sin(time * 0.4 + seedX * 12.0) * 0.12
      const driftY = Math.cos(time * 0.3 + seedY * 10.0) * 0.12
      const driftZ = Math.sin(time * 0.2 + seedZ * 8.0) * 0.08
      
      const px = positions[i * 3]
      const py = positions[i * 3 + 1]
      const pz = positions[i * 3 + 2]
      
      if (isMap[i] === 1) {
        // Map particle
        const tx = targets[i * 3]
        const ty = targets[i * 3 + 1]
        const tz = targets[i * 3 + 2]
        
        if (assembleFactor > 0) {
          // Physics: spring stiffness increases to pull them in and settle them tight
          const springConstant = 0.04 + assembleFactor * 0.16
          const damping = 0.88 - assembleFactor * 0.04
          
          // Cinematic curve offset: particles swing sideways while assembling
          const curveStrength = Math.sin(assembleFactor * Math.PI) * 1.2
          const offsetX = Math.sin(seedY * Math.PI) * curveStrength
          const offsetY = Math.cos(seedX * Math.PI) * curveStrength
          
          // Calculate force (F = k * dx)
          const fx = (tx + offsetX - px) * springConstant
          const fy = (ty + offsetY - py) * springConstant
          const fz = (tz - pz) * springConstant
          
          // Update velocity and dampen
          velocities[i * 3] = (velocities[i * 3] + fx) * damping
          velocities[i * 3 + 1] = (velocities[i * 3 + 1] + fy) * damping
          velocities[i * 3 + 2] = (velocities[i * 3 + 2] + fz) * damping
          
          // Apply position translation
          positions[i * 3] += velocities[i * 3]
          positions[i * 3 + 1] += velocities[i * 3 + 1]
          positions[i * 3 + 2] += velocities[i * 3 + 2]
          
          // Subtly breathe in final state
          if (assembleFactor >= 1.0) {
            positions[i * 3] += driftX * 0.02
            positions[i * 3 + 1] += driftY * 0.02
            positions[i * 3 + 2] += driftZ * 0.02
          }
        } else {
          // Phase 1 drift: Calmly float around initial spot
          velocities[i * 3] = (velocities[i * 3] + (Math.sin(time * 0.6 + seedX * 6.0) * 0.005)) * 0.98
          velocities[i * 3 + 1] = (velocities[i * 3 + 1] + (Math.cos(time * 0.5 + seedY * 6.0) * 0.005)) * 0.98
          velocities[i * 3 + 2] = (velocities[i * 3 + 2] + (Math.sin(time * 0.4 + seedZ * 4.0) * 0.003)) * 0.98
          
          positions[i * 3] += velocities[i * 3]
          positions[i * 3 + 1] += velocities[i * 3 + 1]
          positions[i * 3 + 2] += velocities[i * 3 + 2]
        }
      } else {
        // Ambient particle
        // Gentle brownian velocity changes
        velocities[i * 3] = (velocities[i * 3] + (Math.sin(time * 0.4 + seedX * 8.0) * 0.004)) * 0.97
        velocities[i * 3 + 1] = (velocities[i * 3 + 1] + (Math.cos(time * 0.3 + seedY * 8.0) * 0.004)) * 0.97
        velocities[i * 3 + 2] = (velocities[i * 3 + 2] + (Math.sin(time * 0.2 + seedZ * 6.0) * 0.002)) * 0.97
        
        positions[i * 3] += velocities[i * 3]
        positions[i * 3 + 1] += velocities[i * 3 + 1]
        positions[i * 3 + 2] += velocities[i * 3 + 2]
        
        // Handle fading of temporary ambient particles during Phase 2
        const ambientIdx = i - numMapParticles
        const isFading = ambientIdx >= 400
        if (isFading && assembleFactor > 0) {
          const initOpacity = 0.5 + (seeds[seedIdx] * 0.2)
          opacities[i] = Math.max(0, initOpacity * (1 - assembleFactor))
        }
      }
    }
    
    // Notify GPU that positions and opacities arrays have been updated
    if (geometryRef.current) {
      geometryRef.current.attributes.position.needsUpdate = true
      const opacityAttr = geometryRef.current.attributes.aOpacity as THREE.BufferAttribute | undefined
      if (opacityAttr) {
        opacityAttr.needsUpdate = true
      }
    }
  })
  
  if (!particleData) return null
  
  return (
    <>
      <points>
        <bufferGeometry ref={geometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[particleData.sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aOpacity"
            args={[particleData.opacities, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          attach="material"
          transparent
          depthWrite={false}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* HTML Stacks of Polaroid overlays mapped in 3D */}
      {showPolaroids &&
        cityPositions3D.map((city) => (
          <Html
            key={city.id}
            position={[city.x3D, city.y3D, 0.1]}
            center
            zIndexRange={[2, 10]}
            distanceFactor={10}
          >
            <div className={`polaroid-stack ${showPolaroids ? 'visible' : ''}`}>
              {/* Stack 2 to 4 polaroids */}
              {Array.from({ length: city.polaroidCount }).map((_, idx) => (
                <div key={idx} className="polaroid-card">
                  <div className="polaroid-image-placeholder" />
                </div>
              ))}
            </div>
          </Html>
        ))}
    </>
  )
}
