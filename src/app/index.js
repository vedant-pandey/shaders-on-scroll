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
      // Section 1: Hero - Calm introduction
      {
        uFrequency: 0,
        uAmplitude: 4,
        uDensity: 1,
        uStrength: 0.3,
        uDeepPurple: 1,
        uOpacity: 0.4,
        rotationMultiplier: 0.2
      },
      // Section 2: Services - Moderate energy
      {
        uFrequency: 2,
        uAmplitude: 4,
        uDensity: 1,
        uStrength: 0.6,
        uDeepPurple: 0.7,
        uOpacity: 0.5,
        rotationMultiplier: 0.4
      },
      // Section 3: Case Studies - High energy
      {
        uFrequency: 3.5,
        uAmplitude: 4,
        uDensity: 1.2,
        uStrength: 0.9,
        uDeepPurple: 0.4,
        uOpacity: 0.6,
        rotationMultiplier: 0.6
      },
      // Section 4: Process - Dynamic
      {
        uFrequency: 4,
        uAmplitude: 4,
        uDensity: 1,
        uStrength: 1.1,
        uDeepPurple: 0.2,
        uOpacity: 0.65,
        rotationMultiplier: 0.8
      },
      // Section 5: Contact - Energetic finale
      {
        uFrequency: 4.5,
        uAmplitude: 4,
        uDensity: 1.3,
        uStrength: 1.2,
        uDeepPurple: 0,
        uOpacity: 0.7,
        rotationMultiplier: 1.0
      }
    ]

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

    // Animate mesh rotation based on section
    const targetRotation = interpolate(
      currentSettings.rotationMultiplier,
      nextSettings.rotationMultiplier,
      sectionProgress
    ) * Math.PI

    GSAP.to(this.mesh.rotation, {
      x: targetRotation,
      duration: 1.2,
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
    this.mesh.rotation.y = elapsedTime * .05

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
