const hasProp = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/* eslint-disable */
const throttle = (fn, ms) => {
  let o = !1;
  return function () {
    o
      || (fn.apply(this, arguments),
      (o = !0),
      setTimeout(() => {
        o = !1;
      }, ms));
  };
};
/* eslint-enable */

export default class ScrollTracker {
  constructor(options) {
    const opts = options || {};

    // trigger all attached callbacks only once the scroll mark was hit
    let triggerOnce = false;
    // trigger all attached callbacks below the current seen scroll mark
    let triggerPrevious = false;

    if (hasProp(opts, 'triggerOnce')) {
      triggerOnce = opts.triggerOnce;
    }

    if (hasProp(opts, 'triggerPrevious')) {
      triggerPrevious = opts.triggerPrevious;
    }

    this.options = opts;
    this.options.triggerOnce = triggerOnce;
    this.options.triggerPrevious = triggerPrevious;
    this.loaded = false;

    this.lastScrollPercent = 0;
    this.isScrollingDown = false;
    this.isScrollingUp = false;

    /**
     * Collects all callbacks which should fire on a scroll percentage.
     * @example
     * {
     *  "25": [fn1, fn2],
     *  "50": [fn1, fn2. fn3],
     * }
     */
    this.triggerFunctions = {};

    // make sure 'this' is available inside the event listener
    const boundScrollListener = this.scrollListener.bind(this);
    this.boundScrollListener = throttle(boundScrollListener, 300);
    window.addEventListener('scroll', this.boundScrollListener);
  }

  // registers a callback function which should trigger at a percentage
  observe(percent, fn) {
    if (this.triggerFunctions[percent]) {
      this.triggerFunctions[percent].push(fn);
      return;
    }

    this.triggerFunctions[percent] = [];
    this.triggerFunctions[percent].push(fn);
  }

  static getScrollPercentage() {
    const scrollPercent = window.scrollY / (document.body.offsetHeight - window.innerHeight);
    return Math.round(scrollPercent * 100);
  }

  // executes all callback functions up to the current found scroll mark
  triggerPreviousScrollHeights(currentScrollPercent) {
    let state = '';
    if (!this.loaded) {
      state = 'page loaded';
    } else if (this.isScrollingDown) {
      state = 'scrolling down';
    } else if (this.isScrollingUp) {
      state = 'scrolling up';
    }

    for (let i = 0; i < Object.keys(this.triggerFunctions).length; i += 1) {
      const triggerPercent = Number(Object.keys(this.triggerFunctions)[i]);
      const fns = this.triggerFunctions[triggerPercent];

      if (currentScrollPercent >= triggerPercent) {
        fns.forEach((fn) => fn({ depth: currentScrollPercent, state }));

        if (this.options.triggerOnce) {
          this.triggerFunctions[triggerPercent] = [];
        }
      }
    }
  }

  setScrollDirection(currentScrollPercent) {
    if (currentScrollPercent < this.lastScrollPercent) {
      this.isScrollingDown = false;
      this.isScrollingUp = true;
    } else {
      this.isScrollingDown = true;
      this.isScrollingUp = false;
    }
  }

  scrollListener() {
    const staticSelf = this.constructor;
    const currentScrollPercent = staticSelf.getScrollPercentage();

    // early exit, no trigger functions available
    if (
      Object.values(this.triggerFunctions).every((entry) => entry.length === 0)
    ) {
      window.removeEventListener('scroll', this.boundScrollListener);
      return;
    }

    // can be shifted into constructor on pageload
    if (!this.loaded) {
      this.lastScrollPercent = currentScrollPercent;

      if (this.options.triggerPrevious) {
        this.triggerPreviousScrollHeights(currentScrollPercent);
      }
      this.loaded = true;
      return;
    }

    for (let i = 0; i < Object.keys(this.triggerFunctions).length; i += 1) {
      const triggerPercent = Number(Object.keys(this.triggerFunctions)[i]);
      const fns = this.triggerFunctions[triggerPercent];

      // found the next closest scroll mark
      if (
        // up
        (this.lastScrollPercent <= triggerPercent
          && currentScrollPercent > triggerPercent)
        // down
        || (this.lastScrollPercent >= triggerPercent
          && currentScrollPercent < triggerPercent)
      ) {
        this.setScrollDirection(currentScrollPercent);
        if (this.options.triggerPrevious) {
          this.triggerPreviousScrollHeights(triggerPercent);
        } else {
          fns.forEach((fn) => fn({
            depth: currentScrollPercent,
            state: this.isScrollingDown ? 'scrolling down' : 'scrolling up',
          }));
          if (this.options.triggerOnce) {
            this.triggerFunctions[triggerPercent] = [];
          }
        }
      }
    }

    this.lastScrollPercent = currentScrollPercent;
  }
}
