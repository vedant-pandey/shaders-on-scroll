import GSAP from 'gsap'

export default class {
  constructor({ element, viewport, scroll }) {
    this.element = element
    this.viewport = viewport
    this.scroll = scroll

    this.elements = {
      scrollStage: this.element.querySelector('.scroll__stage'),
      scrollContent: this.element.querySelector('.scroll__content')
    }
  }

  setSizes() {
    this.scroll.height = this.elements.scrollContent.getBoundingClientRect().height
    this.scroll.limit = this.scroll.height - this.viewport.height
  }

  update() {
    // Use scroll__stage scrollTop instead of window.scrollY for snap scrolling
    this.scroll.hard = this.elements.scrollStage.scrollTop
    this.scroll.hard = GSAP.utils.clamp(0, this.scroll.limit, this.scroll.hard)
    this.scroll.soft = GSAP.utils.interpolate(this.scroll.soft, this.scroll.hard, this.scroll.ease)

    if (this.scroll.soft < 0.01) {
      this.scroll.soft = 0
    }

    // Remove transform-based scrolling to allow native scroll-snap
    // this.elements.scrollContent.style.transform = `translateY(${-this.scroll.soft}px)`
  }

  onResize() {
    this.viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    }

    this.setSizes()
  }
}
