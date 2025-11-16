import * as THREE from 'three'
import GSAP from 'gsap'

import Animations from './Animations.js'
import SmoothScroll from './SmoothScroll.js'
import ThresholdSnap from './ThresholdSnap.js'

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

class ScrollStage {
  constructor() {
    this.element = document.querySelector('.content')

    this.elements = {
      line: this.element.querySelector('.layout__line')
    }

    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    this.mouse = {
      x: 0,
      y: 0
    }

    this.scroll = {
      height: 0,
      limit: 0,
      hard: 0,
      soft: 0,
      ease: 0.05,
      normalized: 0, 
      running: false
    }

    // Define unique shader settings for each section (5 sections total)
    this.sectionSettings = [
      // Section 1: Hero - Calm introduction, centered, medium size
      {
        uFrequency: 0,
        uAmplitude: 4,
        uDensity: 1,
        uStrength: 0.3,
        uDeepPurple: 1,
        uOpacity: 0.4,
        rotation: { x: 0.2, y: 0, z: 0 },
        position: { x: 0, y: 0, z: 0 },
        scale: 1.0,
        cameraZ: 2.5
      },
      // Section 2: Services - Moderate energy, PROMINENT right movement
      {
        uFrequency: 2,
        uAmplitude: 4,
        uDensity: 1,
        uStrength: 0.6,
        uDeepPurple: 0.7,
        uOpacity: 0.5,
        rotation: { x: 0.4, y: 0.3, z: 0.1 },
        position: { x: 1.2, y: -0.5, z: 0.3 },
        scale: 1.4,
        cameraZ: 3.0
      },
      // Section 3: Case Studies - High energy, DRAMATIC left movement
      {
        uFrequency: 3.5,
        uAmplitude: 4,
        uDensity: 1.2,
        uStrength: 0.9,
        uDeepPurple: 0.4,
        uOpacity: 0.6,
        rotation: { x: 0.6, y: -0.4, z: 0.2 },
        position: { x: -1.0, y: 0.6, z: -0.4 },
        scale: 1.6,
        cameraZ: 3.4
      },
      // Section 4: Process - EXTREME dynamic movement
      {
        uFrequency: 4,
        uAmplitude: 4,
        uDensity: 1,
        uStrength: 1.1,
        uDeepPurple: 0.2,
        uOpacity: 0.65,
        rotation: { x: 0.8, y: 0.5, z: -0.2 },
        position: { x: 0.9, y: -0.8, z: 0.7 },
        scale: 1.9,
        cameraZ: 3.8
      },
      // Section 5: Contact - MASSIVE energetic finale
      {
        uFrequency: 4.5,
        uAmplitude: 4,
        uDensity: 1.3,
        uStrength: 1.2,
        uDeepPurple: 0,
        uOpacity: 0.7,
        rotation: { x: 1.0, y: 0.8, z: 0.3 },
        position: { x: 0, y: 0.8, z: 1.0 },
        scale: 2.2,
        cameraZ: 4.5
      }
    ].reverse();

    this.currentSectionIndex = 0

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    })

    this.canvas = this.renderer.domElement

    this.camera = new THREE.PerspectiveCamera( 
      75, 
      this.viewport.width / this.viewport.height, 
      .1, 
      10
    )

    this.clock = new THREE.Clock()

    this.smoothScroll = new SmoothScroll({ 
      element: this.element, 
      viewport: this.viewport, 
      scroll: this.scroll
    })

    GSAP.defaults({
      ease: 'power2',
      duration: 6.6,
      overwrite: true
    })
    
    this.updateScrollAnimations = this.updateScrollAnimations.bind(this)
    this.update = this.update.bind(this)
        
    this.init()
  }
  
  init() {
    this.addCanvas()
    this.addCamera()
    this.addMesh()
    this.addEventListeners()
    this.onResize()
    this.update()
  }

  /**
   * STAGE
   */
  addCanvas() {
    this.canvas.classList.add('webgl')
    document.body.appendChild(this.canvas)
  }

  addCamera() {
    this.camera.position.set(0, 0, 2.5)
    this.scene.add(this.camera)
  }

  /**
   * OBJECT
   */
  addMesh() {
    this.geometry = new THREE.IcosahedronGeometry(1, 64)

    // Initialize with first section's settings
    const initialSettings = this.sectionSettings[0]

    this.material = new THREE.ShaderMaterial({
      wireframe: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      vertexShader,
      fragmentShader,
      uniforms: {
        uFrequency: { value: initialSettings.uFrequency },
        uAmplitude: { value: initialSettings.uAmplitude },
        uDensity: { value: initialSettings.uDensity },
        uStrength: { value: initialSettings.uStrength },
        uDeepPurple: { value: initialSettings.uDeepPurple },
        uOpacity: { value: initialSettings.uOpacity }
      }
    })

    this.mesh = new THREE.Mesh(this.geometry, this.material)

    this.scene.add(this.mesh)
  }

  /**
   * SCROLL BASED ANIMATIONS - Section-based
   */
  updateScrollAnimations() {
    this.scroll.running = false

    const scrollTop = this.scroll.hard
    const sectionHeight = window.innerHeight
    const totalSections = this.sectionSettings.length

    // Calculate current section and progress within that section
    const rawSectionIndex = scrollTop / sectionHeight
    const sectionIndex = Math.floor(rawSectionIndex)
    const sectionProgress = rawSectionIndex - sectionIndex

    // Clamp to valid section range
    const currentSection = Math.max(0, Math.min(sectionIndex, totalSections - 1))
    const nextSection = Math.min(currentSection + 1, totalSections - 1)

    // Get settings for current and next section
    const currentSettings = this.sectionSettings[currentSection]
    const nextSettings = this.sectionSettings[nextSection]

    // Update progress bar based on overall scroll
    const overallProgress = Math.min(rawSectionIndex / (totalSections - 1), 1)
    GSAP.to(this.elements.line, {
      scaleX: overallProgress,
      transformOrigin: 'left',
      duration: 1.5,
      ease: 'power2.out'
    })

    // Interpolate between current and next section settings
    const interpolate = (current, next, progress) => {
      return current + (next - current) * progress
    }

    // Enhanced easing function for more dynamic movement
    const easeInOutCubic = (t) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    }

    const easedProgress = easeInOutCubic(sectionProgress)

    // Animate shader uniforms
    GSAP.to(this.mesh.material.uniforms.uFrequency, {
      value: interpolate(currentSettings.uFrequency, nextSettings.uFrequency, sectionProgress),
      duration: 1.2,
      ease: 'power2.out'
    })

    GSAP.to(this.mesh.material.uniforms.uAmplitude, {
      value: interpolate(currentSettings.uAmplitude, nextSettings.uAmplitude, sectionProgress),
      duration: 1.2,
      ease: 'power2.out'
    })

    GSAP.to(this.mesh.material.uniforms.uDensity, {
      value: interpolate(currentSettings.uDensity, nextSettings.uDensity, sectionProgress),
      duration: 1.2,
      ease: 'power2.out'
    })

    GSAP.to(this.mesh.material.uniforms.uStrength, {
      value: interpolate(currentSettings.uStrength, nextSettings.uStrength, sectionProgress),
      duration: 1.2,
      ease: 'power2.out'
    })

    GSAP.to(this.mesh.material.uniforms.uDeepPurple, {
      value: interpolate(currentSettings.uDeepPurple, nextSettings.uDeepPurple, sectionProgress),
      duration: 1.2,
      ease: 'power2.out'
    })

    GSAP.to(this.mesh.material.uniforms.uOpacity, {
      value: interpolate(currentSettings.uOpacity, nextSettings.uOpacity, sectionProgress),
      duration: 1.2,
      ease: 'power2.out'
    })

    // Animate mesh rotation based on section (all axes)
    const targetRotationX = interpolate(
      currentSettings.rotation.x,
      nextSettings.rotation.x,
      sectionProgress
    ) * Math.PI

    const targetRotationY = interpolate(
      currentSettings.rotation.y,
      nextSettings.rotation.y,
      sectionProgress
    ) * Math.PI

    const targetRotationZ = interpolate(
      currentSettings.rotation.z,
      nextSettings.rotation.z,
      sectionProgress
    ) * Math.PI

    GSAP.to(this.mesh.rotation, {
      x: targetRotationX,
      y: targetRotationY,
      z: targetRotationZ,
      duration: 1.2,
      ease: 'power2.out'
    })

    // ENHANCED: Animate mesh position with PROMINENT parallax effect based on scroll progress
    const basePositionX = interpolate(
      currentSettings.position.x,
      nextSettings.position.x,
      easedProgress
    )
    const basePositionY = interpolate(
      currentSettings.position.y,
      nextSettings.position.y,
      easedProgress
    )
    const basePositionZ = interpolate(
      currentSettings.position.z,
      nextSettings.position.z,
      easedProgress
    )

    // Add PROMINENT parallax wave effect - creates dramatic wave-like movement as you scroll
    const parallaxWaveX = Math.sin(sectionProgress * Math.PI * 2) * 0.4
    const parallaxWaveY = Math.cos(sectionProgress * Math.PI * 2) * 0.35

    // Add PROMINENT depth parallax - moves forward/backward based on scroll progress
    const depthParallax = Math.sin(sectionProgress * Math.PI) * 0.5

    // Section-based position multiplier - increases movement in later sections
    const positionIntensity = 1 + (currentSection * 0.15)

    // Combine base position with prominent parallax effects
    const targetPositionX = basePositionX + (parallaxWaveX * positionIntensity)
    const targetPositionY = basePositionY + (parallaxWaveY * positionIntensity)
    const targetPositionZ = basePositionZ + (depthParallax * positionIntensity)

    GSAP.to(this.mesh.position, {
      x: targetPositionX,
      y: targetPositionY,
      z: targetPositionZ,
      duration: 1.0,
      ease: 'power2.out'
    })

    // ENHANCED: Animate mesh scale with PROMINENT pulsing/breathing effect
    const baseScale = interpolate(
      currentSettings.scale,
      nextSettings.scale,
      easedProgress
    )

    // Add DRAMATIC pulsing effect - scale grows and shrinks as you scroll through section
    const pulseScale = Math.sin(sectionProgress * Math.PI) * 0.35

    // Add PROMINENT intensity-based variation - more dramatic scaling in later sections
    const scaleIntensityMultiplier = 1 + (currentSection * 0.12)

    const targetScale = baseScale + (pulseScale * scaleIntensityMultiplier)

    GSAP.to(this.mesh.scale, {
      x: targetScale,
      y: targetScale,
      z: targetScale,
      duration: 1.0,
      ease: 'power2.out'
    })

    // ENHANCED: Animate camera position with DRAMATIC zoom based on scroll progress
    const baseCameraZ = interpolate(
      currentSettings.cameraZ,
      nextSettings.cameraZ,
      easedProgress
    )

    // Add PROMINENT zoom pulse - camera zooms in/out dramatically as you scroll
    const zoomPulse = Math.sin(sectionProgress * Math.PI) * 0.6

    const targetCameraZ = baseCameraZ + zoomPulse

    GSAP.to(this.camera.position, {
      z: targetCameraZ,
      duration: 1.0,
      ease: 'power2.out'
    })

    // ENHANCED: Add PROMINENT camera tilt based on position for cinematic effect
    const cameraTiltX = (targetPositionY * -0.15) + (sectionProgress * 0.08)
    const cameraTiltY = (targetPositionX * 0.12) + (Math.sin(sectionProgress * Math.PI) * 0.05)

    GSAP.to(this.camera.rotation, {
      x: cameraTiltX,
      y: cameraTiltY,
      duration: 1.3,
      ease: 'power2.out'
    })

    this.currentSectionIndex = currentSection
  }

  /**
   * EVENTS
   */
  addEventListeners() {
    window.addEventListener('load', this.onLoad.bind(this))

    // window.addEventListener('mousemove', this.onMouseMove.bind(this))  // enable for soundcheck (→ console)

    // Listen to scroll events on scroll__stage for snap scrolling support
    const scrollStage = document.querySelector('.scroll__stage')
    if (scrollStage) {
      scrollStage.addEventListener('scroll', this.onScroll.bind(this))
    }

    window.addEventListener('resize', this.onResize.bind(this))
  }

  onLoad() {
    document.body.classList.remove('loading')

    this.animations = new Animations(this.element, this.camera)

    // Ensure sizes are recalculated after load
    this.smoothScroll.setSizes()

    // Initialize threshold-based snap scrolling
    const scrollStage = document.querySelector('.scroll__stage')
    if (scrollStage) {
      this.thresholdSnap = new ThresholdSnap(scrollStage)
    }
  }

  onMouseMove(event) {
    // play with it!
    // enable / disable / change x, y, multiplier …

    this.mouse.x = (event.clientX / this.viewport.width).toFixed(2) * 4
    this.mouse.y = (event.clientY / this.viewport.height).toFixed(2) * 2

    GSAP.to(this.mesh.material.uniforms.uFrequency, { value: this.mouse.x })
    GSAP.to(this.mesh.material.uniforms.uAmplitude, { value: this.mouse.x })
    GSAP.to(this.mesh.material.uniforms.uDensity, { value: this.mouse.y })
    GSAP.to(this.mesh.material.uniforms.uStrength, { value: this.mouse.y })
    // GSAP.to(this.mesh.material.uniforms.uDeepPurple, { value: this.mouse.x })
    // GSAP.to(this.mesh.material.uniforms.uOpacity, { value: this.mouse.y })

    console.info(`X: ${this.mouse.x}  |  Y: ${this.mouse.y}`)
  }

  onScroll() {
    if (!this.scroll.running) {
      window.requestAnimationFrame(this.updateScrollAnimations)
      
      this.scroll.running = true
    }
  }

  onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    this.smoothScroll.onResize()

    if (this.viewport.width < this.viewport.height) {
      this.mesh.scale.set(.75, .75, .75)
    } else {
      this.mesh.scale.set(1, 1, 1)
    }

    this.camera.aspect = this.viewport.width / this.viewport.height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(this.viewport.width, this.viewport.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))  
  }

  /**
   * LOOP
   */
  update() {
    const elapsedTime = this.clock.getElapsedTime()

    // Add subtle continuous oscillation on top of scroll-based rotation
    // This creates a "breathing" effect
    this.mesh.rotation.y += Math.sin(elapsedTime * 0.5) * 0.0005
    this.mesh.rotation.x += Math.cos(elapsedTime * 0.3) * 0.0003

    this.smoothScroll.update()

    this.render()

    window.requestAnimationFrame(this.update)
  }

  /**
   * RENDER
   */
  render() {
    this.renderer.render(this.scene, this.camera)
  }  
}

new ScrollStage()

console.log('%c Made by ꜰᴀʙᴏᴏʟᴇᴀ → https://twitter.com/faboolea', 'background: black; color: white; padding: 1ch 2ch; border-radius: 2rem;')
