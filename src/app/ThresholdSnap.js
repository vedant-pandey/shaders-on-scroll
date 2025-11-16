import GSAP from 'gsap'

export default class ThresholdSnap {
  constructor(scrollStage) {
    this.scrollStage = scrollStage
    this.sections = Array.from(document.querySelectorAll('.section'))
    this.currentSection = 0
    this.isSnapping = false
    this.lastScrollTop = 0
    this.threshold = 0.5 // 50% threshold
    this.scrollTimeout = null
    this.lastDirection = null

    this.onScroll = this.onScroll.bind(this)
    this.init()
  }

  init() {
    this.scrollStage.addEventListener('scroll', this.onScroll, { passive: true })
  }

  onScroll() {
    if (this.isSnapping) {
      return
    }

    // Clear existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }

    // Check threshold immediately
    this.checkThreshold()

    // Set a timeout to snap when scrolling stops
    this.scrollTimeout = setTimeout(() => {
      this.handleScrollEnd()
    }, 100)
  }

  checkThreshold() {
    const scrollTop = this.scrollStage.scrollTop
    const sectionHeight = window.innerHeight
    const scrollDirection = scrollTop > this.lastScrollTop ? 'down' : 'up'

    // Calculate current position within sections
    const sectionIndex = Math.floor(scrollTop / sectionHeight)
    const sectionProgress = (scrollTop % sectionHeight) / sectionHeight

    // Check if we've crossed the 50% threshold
    if (scrollDirection === 'down' && sectionProgress >= this.threshold) {
      // Crossed 50% going down, snap to next section
      const targetSection = Math.min(sectionIndex + 1, this.sections.length - 1)
      if (targetSection !== this.currentSection) {
        this.snapToSection(targetSection)
      }
    } else if (scrollDirection === 'up' && sectionProgress < this.threshold) {
      // Crossed 50% going up, snap to current section
      if (sectionIndex !== this.currentSection) {
        this.snapToSection(sectionIndex)
      }
    }

    this.lastScrollTop = scrollTop
    this.lastDirection = scrollDirection
  }

  handleScrollEnd() {
    if (this.isSnapping) {
      return
    }

    const scrollTop = this.scrollStage.scrollTop
    const sectionHeight = window.innerHeight

    // Snap to nearest section when scrolling stops
    const nearestSection = Math.round(scrollTop / sectionHeight)
    const clampedSection = Math.max(0, Math.min(nearestSection, this.sections.length - 1))

    // Only snap if we're not already at the target
    const targetScrollTop = clampedSection * sectionHeight
    if (Math.abs(scrollTop - targetScrollTop) > 10) {
      this.snapToSection(clampedSection)
    }
  }

  snapToSection(index) {
    if (this.isSnapping || index < 0 || index >= this.sections.length) {
      return
    }

    this.isSnapping = true
    this.currentSection = index

    const targetScrollTop = index * window.innerHeight

    // Use GSAP for smooth scrolling
    GSAP.to(this.scrollStage, {
      scrollTop: targetScrollTop,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => {
        this.isSnapping = false
        this.lastScrollTop = this.scrollStage.scrollTop
      }
    })
  }

  destroy() {
    this.scrollStage.removeEventListener('scroll', this.onScroll)
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout)
    }
  }
}
