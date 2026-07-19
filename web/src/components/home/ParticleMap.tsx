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
  animationDelay: number
}

const cities: City[] = [
  { id: 'delhi', name: 'Delhi', lat: 28.6139, lon: 77.2090, polaroidCount: 3, animationDelay: 0.5 },
  { id: 'mussoorie', name: 'Mussoorie', lat: 30.4598, lon: 78.0792, polaroidCount: 2, animationDelay: 1.8 },
  { id: 'landour', name: 'Landour', lat: 30.4674, lon: 78.1002, polaroidCount: 4, animationDelay: 3.2 },
  { id: 'rishikesh', name: 'Rishikesh', lat: 30.0869, lon: 78.2676, polaroidCount: 3, animationDelay: 4.5 },
  { id: 'nainital', name: 'Nainital', lat: 29.3803, lon: 79.4636, polaroidCount: 2, animationDelay: 1.2 },
  { id: 'goa', name: 'Goa', lat: 15.2993, lon: 74.1240, polaroidCount: 4, animationDelay: 2.7 },
  { id: 'bangalore', name: 'Bangalore', lat: 12.9716, lon: 77.5946, polaroidCount: 3, animationDelay: 5.1 },
  { id: 'coorg', name: 'Coorg', lat: 12.3375, lon: 75.8069, polaroidCount: 2, animationDelay: 0.9 },
  { id: 'ooty', name: 'Ooty', lat: 11.4102, lon: 76.6950, polaroidCount: 3, animationDelay: 3.8 },
  { id: 'coonoor', name: 'Coonoor', lat: 11.3530, lon: 76.7959, polaroidCount: 2, animationDelay: 2.2 },
  { id: 'chennai', name: 'Chennai', lat: 13.0827, lon: 80.2707, polaroidCount: 4, animationDelay: 4.6 },
  { id: 'puducherry', name: 'Puducherry', lat: 11.9416, lon: 79.8083, polaroidCount: 3, animationDelay: 1.5 }
]

type ParticleMapProps = {
  showPolaroids: boolean
  onAssemblyComplete: () => void
  onAssemblyStart?: () => void
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

type Ripple = {
  x: number
  y: number
  radius: number
  maxRadius: number
  strength: number
  age: number
  maxAge: number
}

// Custom Shaders for circular particles with dynamic GPU local glows & size pulsing
const vertexShader = `
  uniform float uTime;
  uniform vec2 uHoveredCityPos;
  
  attribute float aSize;
  attribute float aOpacity;
  varying float vOpacity;
  
  void main() {
    vOpacity = aOpacity;
    vec3 pos = position;
    float sizeMultiplier = 1.0;
    
    // GPU Local Glow & Pulse:
    // If a hovered location is active, modify surrounding particles within 1.5 units
    if (uHoveredCityPos.x > -990.0) {
      float distToCity = distance(pos.xy, uHoveredCityPos);
      if (distToCity < 1.5) {
        float proximity = 1.0 - distToCity / 1.5;
        // Pulse size using a soft sine wave
        float pulse = 1.0 + sin(uTime * 5.0) * 0.25;
        sizeMultiplier += proximity * (pulse - 1.0 + 0.3);
        
        // Boost local particle brightness dynamically
        vOpacity = min(1.0, aOpacity + proximity * 0.4 * (1.0 + sin(uTime * 5.0) * 0.15));
      }
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * sizeMultiplier * (15.0 / -mvPosition.z);
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

export function ParticleMap({ showPolaroids, onAssemblyComplete, onAssemblyStart }: ParticleMapProps) {
  const { viewport } = useThree()
  const { width, height } = viewport
  
  // States to avoid accessing refs during render
  const [rawPoints, setRawPoints] = useState<{ x: number; y: number }[]>([])
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number }>({ x: 418.5, y: 471.0 })
  const [activeCityId, setActiveCityId] = useState<string | null>(null)
  
  // Track timeline in refs for high frequency useFrame updates without re-renders
  const elapsedTimeRef = useRef(0)
  const assemblyCompleteTriggeredRef = useRef(false)
  const assemblyStartedTriggeredRef = useRef(false)
  const activeCityIdRef = useRef<string | null>(null)
  
  // Reference for updating the positions inside the frame loop
  const particlesRef = useRef<ParticleData | null>(null)
  const geometryRef = useRef<THREE.BufferGeometry>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  // Ripple parameters
  const ripplesRef = useRef<Ripple[]>([])
  const prevMousePosRef = useRef<THREE.Vector3>(new THREE.Vector3())
  const lastRippleTimeRef = useRef<number>(0)
  
  // Shader uniforms declared at top level to satisfy hooks guidelines
  const shaderUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uHoveredCityPos: { value: new THREE.Vector2(-999.0, -999.0) }
  }), [])
  
  // Dynamic scaling to center and fit the map to screen height/width proportionally
  const scale = useMemo(() => {
    const mapWidth = 835
    const mapHeight = 940
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
    
    // Project current cursor screen position to 3D world coordinates on Z = 0 plane
    state.raycaster.setFromCamera(state.pointer, state.camera)
    const planeIntersect = new THREE.Vector3()
    state.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), planeIntersect)
    const mouseX3D = planeIntersect.x
    const mouseY3D = planeIntersect.y
    
    // 1. Expanding Mouse Movement Ripples
    const prevMouse = prevMousePosRef.current
    const distMoved = prevMouse.distanceTo(planeIntersect)
    if (distMoved > 0.1 && time - lastRippleTimeRef.current > 0.15) {
      if (ripplesRef.current.length >= 3) {
        ripplesRef.current.shift() // Limit to max 3 concurrent ripples
      }
      ripplesRef.current.push({
        x: mouseX3D,
        y: mouseY3D,
        radius: 0.1,
        maxRadius: 3.5,
        strength: 0.6,
        age: 0,
        maxAge: 1.0
      })
      lastRippleTimeRef.current = time
    }
    prevMouse.copy(planeIntersect)
    
    // Update active ripples parameters
    ripplesRef.current.forEach((r) => {
      r.radius += dt * 3.5 // Expand wavefront outward
      r.age += dt
      r.strength = Math.max(0, 0.6 * (1.0 - r.age / r.maxAge))
    })
    ripplesRef.current = ripplesRef.current.filter((r) => r.age < r.maxAge)
    
    // 2. Polaroid Hover & Location Name Reveal State detection (80px radius ≈ 1.1 units)
    let closestCityId: string | null = null
    let minCityDist = Infinity
    const HOVER_THRESHOLD = 1.1
    
    if (showPolaroids) {
      cityPositions3D.forEach((city) => {
        const cdx = mouseX3D - city.x3D
        const cdy = mouseY3D - city.y3D
        const cdist = Math.sqrt(cdx * cdx + cdy * cdy)
        
        if (cdist < HOVER_THRESHOLD && cdist < minCityDist) {
          minCityDist = cdist
          closestCityId = city.id
        }
      })
      
      if (closestCityId !== activeCityIdRef.current) {
        activeCityIdRef.current = closestCityId
        setActiveCityId(closestCityId)
      }
    }
    
    // 3. Update uniforms for GPU glowing and pulsing effects
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time
      if (activeCityIdRef.current) {
        const activeCity = cityPositions3D.find((c) => c.id === activeCityIdRef.current)
        if (activeCity) {
          materialRef.current.uniforms.uHoveredCityPos.value.set(activeCity.x3D, activeCity.y3D)
        } else {
          materialRef.current.uniforms.uHoveredCityPos.value.set(-999.0, -999.0)
        }
      } else {
        materialRef.current.uniforms.uHoveredCityPos.value.set(-999.0, -999.0)
      }
    }
    
    // Determine timeline stage factor
    let assembleFactor = 0
    if (elapsed > 1.0) {
      assembleFactor = Math.min(1.0, (elapsed - 1.0) / 1.2)
    }
    
    if (elapsed >= 1.0 && !assemblyStartedTriggeredRef.current) {
      assemblyStartedTriggeredRef.current = true
      setTimeout(() => {
        onAssemblyStart?.()
      }, 0)
    }
    
    if (elapsed >= 2.3 && !assemblyCompleteTriggeredRef.current) {
      assemblyCompleteTriggeredRef.current = true
      onAssemblyComplete()
    }
    
    for (let i = 0; i < count; i++) {
      const seedIdx = i * 3
      const seedX = seeds[seedIdx]
      const seedY = seeds[seedIdx + 1]
        // subtle breathing map offset (local procedural vibration)
      const mapBreatheX = Math.sin(time * 0.8 + seedX * 5.0) * 0.02
      const mapBreatheY = Math.cos(time * 0.7 + seedY * 5.0) * 0.02
      
      const px = positions[i * 3]
      const py = positions[i * 3 + 1]
      const pz = positions[i * 3 + 2]
      
      // Calculate cursor vector
      const curDx = mouseX3D - px
      const curDy = mouseY3D - py
      const curDist = Math.sqrt(curDx * curDx + curDy * curDy)
      
      // Accumulate cursor interaction forces
      let interactFx = 0
      let interactFy = 0
      
      if (curDist > 0.01) {
        // A. Cursor Magnetic Field attraction (Radius 1.5 units)
        if (curDist < 1.5) {
          const attractionScale = 1.0 - curDist / 1.5
          const pull = attractionScale * 0.007
          interactFx += curDx * pull
          interactFy += curDy * pull
          
          // Tangential Orbit swirl force
          const perpX = -curDy
          const perpY = curDx
          const orbit = attractionScale * 0.004
          interactFx += (perpX / curDist) * orbit
          interactFy += (perpY / curDist) * orbit
        }
        
        // B. Close Repulsion force (Radius 0.45 units)
        if (curDist < 0.45) {
          const repulsionScale = 1.0 - curDist / 0.45
          const push = repulsionScale * 0.025
          interactFx -= (curDx / curDist) * push
          interactFy -= (curDy / curDist) * push
        }
      }
      
      // C. Expandable ripples radial impulses
      let rippleFx = 0
      let rippleFy = 0
      ripplesRef.current.forEach((r) => {
        const rdx = px - r.x
        const rdy = py - r.y
        const rdist = Math.sqrt(rdx * rdx + rdy * rdy)
        if (rdist > 0.01) {
          const wavefrontDist = Math.abs(rdist - r.radius)
          if (wavefrontDist < 0.3) {
            const push = (1.0 - wavefrontDist / 0.3) * r.strength * 0.12
            rippleFx += (rdx / rdist) * push
            rippleFy += (rdy / rdist) * push
          }
        }
      })
      
      if (isMap[i] === 1) {
        // Map particle
        const tx = targets[i * 3]
        const ty = targets[i * 3 + 1]
        const tz = targets[i * 3 + 2]
        
        if (assembleFactor > 0) {
          const springConstant = 0.04 + assembleFactor * 0.16
          const damping = 0.88 - assembleFactor * 0.04
          
          const curveStrength = Math.sin(assembleFactor * Math.PI) * 1.2
          const offsetX = Math.sin(seedY * Math.PI) * curveStrength
          const offsetY = Math.cos(seedX * Math.PI) * curveStrength
          
          // Spring force + Cursor interactions + Ripples
          const fx = (tx + offsetX - px) * springConstant + interactFx + rippleFx
          const fy = (ty + offsetY - py) * springConstant + interactFy + rippleFy
          const fz = (tz - pz) * springConstant
          
          velocities[i * 3] = (velocities[i * 3] + fx) * damping
          velocities[i * 3 + 1] = (velocities[i * 3 + 1] + fy) * damping
          velocities[i * 3 + 2] = (velocities[i * 3 + 2] + fz) * damping
          
          positions[i * 3] += velocities[i * 3]
          positions[i * 3 + 1] += velocities[i * 3 + 1]
          positions[i * 3 + 2] += velocities[i * 3 + 2]
          
          // Subtly breathe map on final state
          if (assembleFactor >= 1.0) {
            positions[i * 3] += mapBreatheX
            positions[i * 3 + 1] += mapBreatheY
          }
        } else {
          // Phase 1 drift + Cursor interactions
          const fx = (Math.sin(time * 0.6 + seedX * 6.0) * 0.005) + interactFx
          const fy = (Math.cos(time * 0.5 + seedY * 6.0) * 0.005) + interactFy
          
          velocities[i * 3] = (velocities[i * 3] + fx) * 0.98
          velocities[i * 3 + 1] = (velocities[i * 3 + 1] + fy) * 0.98
          
          positions[i * 3] += velocities[i * 3]
          positions[i * 3 + 1] += velocities[i * 3 + 1]
          positions[i * 3 + 2] += velocities[i * 3 + 2]
        }
      } else {
        // Ambient particle + Cursor interactions + Ripples
        const fx = (Math.sin(time * 0.4 + seedX * 8.0) * 0.004) + interactFx + rippleFx
        const fy = (Math.cos(time * 0.3 + seedY * 8.0) * 0.004) + interactFy + rippleFy
        
        velocities[i * 3] = (velocities[i * 3] + fx) * 0.97
        velocities[i * 3 + 1] = (velocities[i * 3 + 1] + fy) * 0.97
        
        positions[i * 3] += velocities[i * 3]
        positions[i * 3 + 1] += velocities[i * 3 + 1]
        positions[i * 3 + 2] += velocities[i * 3 + 2]
        
        // Handle fading of temporary ambient particles during Phase 2
        const ambientIdx = i - numMapParticles
        const isFading = ambientIdx >= 400
        if (isFading && assembleFactor > 0) {
          const initOpacity = 0.5 + (seeds[seedIdx] * 0.2)
          opacities[i] = Math.max(0, initOpacity * (1.0 - assembleFactor))
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
          ref={materialRef}
          attach="material"
          transparent
          depthWrite={false}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          blending={THREE.AdditiveBlending}
          uniforms={shaderUniforms}
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
            <div
              className={`polaroid-stack ${showPolaroids ? 'visible' : ''} ${
                activeCityId === city.id ? 'active' : ''
              }`}
              style={{ animationDelay: `${city.animationDelay}s` }}
            >
              {/* Stack 2 to 4 polaroids */}
              {Array.from({ length: city.polaroidCount }).map((_, idx) => (
                <div key={idx} className="polaroid-card">
                  <div className="polaroid-image-placeholder" />
                </div>
              ))}
              
              {/* Location name fade-reveal label */}
              <div className={`location-name-label ${activeCityId === city.id ? 'visible' : ''}`}>
                {city.name}
              </div>
            </div>
          </Html>
        ))}
    </>
  )
}
