'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function HeroGraph3D() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // --- Scene Setup ---
    const scene = new THREE.Scene()
    
    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
    camera.position.z = 18

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // --- Graph Node Data ---
    // Central ME node
    // 4 child category nodes
    // 12 leaf project/skill nodes
    const nodes: { pos: THREE.Vector3; size: number; color: string; mesh?: THREE.Mesh }[] = [
      // ME (Center)
      { pos: new THREE.Vector3(0, 0, 0), size: 1.2, color: '#b3ec13' },
      
      // Categories (Level 1)
      { pos: new THREE.Vector3(-4, 3, 2), size: 0.7, color: '#f0f0f0' },  // Identity
      { pos: new THREE.Vector3(4, 2, -3), size: 0.7, color: '#f0f0f0' },  // Projects
      { pos: new THREE.Vector3(-3, -3, 3), size: 0.7, color: '#f0f0f0' }, // Skills
      { pos: new THREE.Vector3(3, -2, 2), size: 0.7, color: '#f0f0f0' },  // Rules

      // Leafs (Level 2)
      { pos: new THREE.Vector3(-6, 4, 3), size: 0.35, color: '#888888' },
      { pos: new THREE.Vector3(-5, 2, 5), size: 0.35, color: '#888888' },
      
      { pos: new THREE.Vector3(6, 3, -1), size: 0.35, color: '#888888' },
      { pos: new THREE.Vector3(5, 1, -5), size: 0.35, color: '#888888' },
      { pos: new THREE.Vector3(7, -1, -3), size: 0.35, color: '#888888' },

      { pos: new THREE.Vector3(-5, -4, 4), size: 0.35, color: '#888888' },
      { pos: new THREE.Vector3(-2, -5, 2), size: 0.35, color: '#888888' },
      { pos: new THREE.Vector3(-4, -2, 6), size: 0.35, color: '#888888' },

      { pos: new THREE.Vector3(4, -4, 3), size: 0.35, color: '#888888' },
      { pos: new THREE.Vector3(5, -2, 1), size: 0.35, color: '#888888' },
      { pos: new THREE.Vector3(2, -4, 4), size: 0.35, color: '#888888' },
    ]

    // Connections (indices [from, to])
    const connections = [
      [0, 1], [0, 2], [0, 3], [0, 4], // Center to Level 1
      [1, 5], [1, 6],                 // Level 1 to Leafs
      [2, 7], [2, 8], [2, 9],
      [3, 10], [3, 11], [3, 12],
      [4, 13], [4, 14], [4, 15]
    ]

    const graphGroup = new THREE.Group()
    scene.add(graphGroup)

    // --- Mesh creations ---
    // Materials
    const nodeMaterialCache: { [key: string]: THREE.MeshBasicMaterial } = {}
    const getNodeMaterial = (color: string) => {
      if (!nodeMaterialCache[color]) {
        nodeMaterialCache[color] = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          toneMapped: false,
        })
      }
      return nodeMaterialCache[color]
    }

    // Nodes
    nodes.forEach(node => {
      const geo = new THREE.SphereGeometry(node.size, 16, 16)
      const mesh = new THREE.Mesh(geo, getNodeMaterial(node.color))
      mesh.position.copy(node.pos)
      graphGroup.add(mesh)
      node.mesh = mesh
    })

    // Edges
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.08,
      linewidth: 1, // Note: linewidth > 1 usually not supported by WebGL implementations
    })

    const linePositions: number[] = []
    connections.forEach(([from, to]) => {
      const p1 = nodes[from].pos
      const p2 = nodes[to].pos
      linePositions.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z)
    })

    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3))
    const lines = new THREE.LineSegments(lineGeo, lineMaterial)
    graphGroup.add(lines)

    // --- Ambient Particle Dust (Wow Factor) ---
    const particleCount = 200
    const particleGeo = new THREE.BufferGeometry()
    const particlePositions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 40
      particlePositions[i + 1] = (Math.random() - 0.5) * 40
      particlePositions[i + 2] = (Math.random() - 0.5) * 40
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))

    // Subtle floating dot texture
    const pMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.08,
      transparent: true,
      opacity: 0.15,
      sizeAttenuation: true
    })

    const particles = new THREE.Points(particleGeo, pMat)
    scene.add(particles)

    // --- Lights (Even though we use basic materials, lights can support future standard materials) ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    // --- Interaction / Inertia Mouse Tracking ---
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      // Normalize coords from -1 to +1
      mouse.targetX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.targetY = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }

    window.addEventListener('mousemove', handleMouseMove)

    // --- Resize handler ---
    const handleResize = () => {
      if (!containerRef.current) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    // --- Animation loop ---
    let frameId: number
    const clock = new THREE.Clock()

    const animate = () => {
      frameId = requestAnimationFrame(animate)

      const time = clock.getElapsedTime()

      // Inertia ease towards target mouse positions
      mouse.x += (mouse.targetX - mouse.x) * 0.08
      mouse.y += (mouse.targetY - mouse.y) * 0.08

      // Slow orbital rotate
      graphGroup.rotation.y = time * 0.04
      graphGroup.rotation.x = Math.sin(time * 0.02) * 0.08

      // Mouse interactive tilt/translation
      graphGroup.rotation.y += mouse.x * 0.15
      graphGroup.rotation.x -= mouse.y * 0.15
      
      // Slow float particles
      particles.rotation.y = -time * 0.01
      particles.rotation.x = Math.cos(time * 0.005) * 0.05

      // Make lines pulse slightly in opacity
      lineMaterial.opacity = 0.06 + Math.sin(time * 2) * 0.02

      renderer.render(scene, camera)
    }

    animate()

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      
      // Dispose materials/geometries
      scene.clear()
      lineGeo.dispose()
      lineMaterial.dispose()
      particleGeo.dispose()
      pMat.dispose()
      Object.values(nodeMaterialCache).forEach(mat => mat.dispose())
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[350px] lg:min-h-[450px] relative cursor-grab active:cursor-grabbing"
    />
  )
}
