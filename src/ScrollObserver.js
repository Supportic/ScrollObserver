const convertNumberToFloatingPoint = (step) => {
  const isInt = `${step}`.indexOf('.') === -1;

  if (step > 100 || (!isInt && Number(step) > 1)) {
    throw Error(`Not more than 100% allowed: ${JSON.stringify({ step })}`);
  }

  return isInt ? step / 100 : step;
};

/**
   * Creates threshold steps for the observer.
   * @param {string} oneStep
   * @param {string} excludeZero
   * @returns {number[]}
   * @memberof ScrollObserver
   */
const createSteps = (step) => {
  let oneStep = step ?? 0.25;

  oneStep = convertNumberToFloatingPoint(oneStep);
  const steps = Math.round(1 / oneStep);

  const thresholds = Array(steps + 1)
    .fill()
    .map((_, i) => {
      // do not go above 1
      const num = Number((i * oneStep).toFixed(2));
      return num > 1 ? 1 : num;
    });

  return thresholds;
};

const hasProp = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

export default class ScrollObserver {
  #options = {};
  #observer = {};
  #triggerFunctions = {};

  // ignore setting it on page load
  #lastScrollPercentage = 'init';

  isScrollingUp = true;
  isScrollingDown = !this.isScrollingUp;

  constructor(options) {
    this.#init(options);

    // setting document.body as root doesn't work somehow
    const observerOptions = {
      threshold: this.#options.thresholds,
      root:
        this.#options.target === document.body ? null : this.#options.target,
      rootMargin: this.#options.rootMargin,
    };

    this.#observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // from the element in the DOM
          const scrollDepth = parseFloat(entry.target.dataset.threshold);
          const threshold = scrollDepth * 100;
          const canInteract = scrollDepth >= this.#options.interactWhen;

          this.#setScrollDirection();

          if (canInteract) {
            for (const [percent, fns] of Object.entries(
              this.#triggerFunctions,
            )) {
              if (Number(percent) === scrollDepth) {
                fns.forEach((fn) => fn(threshold));
              }
            }
          }

          // Stop observing.
          if (this.#options.triggerOnce) {
            this.#observer.unobserve(entry.target);
          }
        }
      });
    }, observerOptions);

    this.#setObserverMarkers();
  }

  #init = (options) => {
    this.#setupOptions(options);

    this.#setRelativeStyle();

    if (this.#options.showRootMargin) { this.#showRootMargin(); }
  };

  // Set target position to relative to position makers absolute, if main body just set style, otherwise use wrapper
  #setRelativeStyle = () => {
    if (this.#options.target === document.body) {
      this.#options.target.style.position = 'relative';
    } else {
      const wrapper = document.createElement('div');
      wrapper.id = this.#options.scrollWrapperId;
      wrapper.style.position = 'relative';
      wrapper.innerHTML = this.#options.target.innerHTML;
      this.#options.target.innerHTML = '';
      this.#options.target.appendChild(wrapper);
    }
  };

  #showRootMargin = () => {
    const margins = this.#options.rootMargin.split(' ');

    // eslint-disable-next-line prefer-const
    let [, topMarginSign, topMargin, topMarginUnit] = /(-?)(\d+)(\w+|%)/.exec(
      margins[0],
    );
    topMarginSign = topMarginSign === '' ? '+' : '-';

    // eslint-disable-next-line prefer-const
    let [, bottomMarginSign, bottomMargin, bottomMarginUnit] = /(-?)(\d+)(\w+|%)/.exec(margins[2]);
    bottomMarginSign = bottomMarginSign === '' ? '+' : '-';

    if (Number(topMargin) === 0 && Number(bottomMargin) === 0) {
      return;
    }

    [document.createElement('div'), document.createElement('div')].forEach(
      (marginElement, i) => {
        const me = marginElement;
        const isTopElement = i === 0;

        me.style.position = 'fixed';

        if (isTopElement) {
          me.style.bottom = `calc(100% ${topMarginSign} ${topMargin}${topMarginUnit})`;
          me.style.top = 0;
        } else {
          me.style.top = `calc(100% ${bottomMarginSign} ${bottomMargin}${bottomMarginUnit})`;
          me.style.bottom = 0;
        }

        me.style.boxShadow = isTopElement
          ? '0 3px 0 rgb(244, 246, 0)'
          : '0 -3px 0 rgb(244, 246, 0)';

        me.ariaHidden = true;

        me.style.width = '100%';
        me.style.height = isTopElement
          ? topMargin + topMarginUnit
          : bottomMargin + bottomMarginUnit;
        me.style.background = 'rgba(225,190,18,0.7)';
        me.style.display = 'block';
        me.style.pointerEvents = 'none';

        this.#appendElementToTarget(me);
      },
    );
  };

  #setScrollDirection = () => {
    const currentScrollPercentage = this.#getCurrentScrollPercentage().rounded;
    if (typeof this.#lastScrollPercentage === 'number') {
      if (currentScrollPercentage < this.#lastScrollPercentage) {
        this.isScrollingUp = false;
      } else {
        this.isScrollingUp = true;
      }
    }
    this.#lastScrollPercentage = currentScrollPercentage;
  };

  /**
   * Calculates the current scroll position on the page.
   *
   * @return {Object} The floating point number as percentage of the scroll position.
   * @example
   * { value: 3.285450149338643, rounded: 3, text: '3 %' }
   */
  #getCurrentScrollPercentage = () => {
    const st = 'scrollTop';
    const sh = 'scrollHeight';

    let depth; let
      scrollTop;

    let h = document.documentElement;
    const b = document.body;

    if (this.#options.target === document.body) {
      depth = (h[sh] || b[sh]) - h.clientHeight;
      scrollTop = h[st] || b[st];
    } else {
      h = document.querySelector(`#${this.#options.scrollWrapperId}`);

      depth = h[sh] - h.clientHeight;
      scrollTop = h[st];
    }

    const scrollValue = (scrollTop / depth) * 100;
    const scrollValueRounded = Math.round(scrollValue);

    return depth === 0
      ? { value: 0, rounded: 0, text: '0 %' }
      : {
        value: scrollValue,
        rounded: scrollValueRounded,
        text: `${scrollValueRounded} %`,
      };
  };

  // registers a callback function which should trigger at a percentage
  observe = (thresholds, fn) => {
    // transform to array if necessary
    const thresholdsArr = !Array.isArray(thresholds) ? Array.of(thresholds) : thresholds;

    const currentScrollPercentage = this.#getCurrentScrollPercentage().value;

    for (const threshold of thresholdsArr) {
      const step = convertNumberToFloatingPoint(threshold);

      // trigger callbacks already when scroll depth is above threshold on pageload
      if (
        this.#options.triggerPrevious
        && Number(step) * 100 < currentScrollPercentage
      ) {
        fn(Number(step) * 100);

        // eslint-disable-next-line no-continue
        if (this.#options.triggerOnce) continue;
      }

      if (this.#triggerFunctions[step]) {
        this.#triggerFunctions[step].push(fn);
        return;
      }
      this.#triggerFunctions[step] = [];
      this.#triggerFunctions[step].push(fn);
    }
  };

  #appendElementToTarget = (elem) => {
    if (this.#options.target === document.body) {
      this.#options.target.appendChild(elem);
    } else {
      document
        .querySelector(`#${this.#options.scrollWrapperId}`)
        .appendChild(elem);
    }
  };

  // inject markers in the DOM to trigger the observer
  #setObserverMarkers = () => {
    this.#options.thresholds.forEach((threshold, i) => {
      // Create marker and set style.
      const depthDiv = document.createElement('div');
      depthDiv.className = this.#options.markerClasses;
      depthDiv.style.position = 'absolute';
      depthDiv.style.top = `${100 * threshold}%`;
      depthDiv.style.pointerEvents = 'none';
      depthDiv.style.left = '50%';
      depthDiv.style.transform = 'translateX(-50%)';

      depthDiv.dataset.threshold = threshold;
      depthDiv.ariaHidden = true;
      if (this.#options.markerIdPrefix) {
        depthDiv.id = this.#options.markerIdPrefix + (i + 1);
      }
      if (!this.#options.showMarkers) {
        depthDiv.style.zIndex = '-1';
      }

      if (this.#options.showMarkers) {
        depthDiv.style.width = '100%';
        depthDiv.style.height = '3px';
        depthDiv.style.background = 'black';
        depthDiv.style.display = 'block';
      }

      this.#appendElementToTarget(depthDiv);

      // Observe Marker.
      this.#observer.observe(depthDiv);
    });
  };

  // error checking for thresholds
  #checkThresholds = () => {
    const isThresholdsTypeString = typeof this.#options.thresholds === 'string';
    const isThresholdsTypeArray = Array.isArray(this.#options.thresholds);

    if (!hasProp(this.#options, 'thresholds')) {
      throw TypeError(
        `Property 'tresholds' in ${this.constructor.name} options required.`,
      );
    } else if (!(isThresholdsTypeString || isThresholdsTypeArray)) {
      throw TypeError(
        `Property 'tresholds' in ${this.constructor.name} must be type of 'string' or 'array'.`,
      );
    } else if (
      isThresholdsTypeString
      && this.#options.thresholds.indexOf('.') === -1
    ) {
      throw TypeError(
        `Property 'tresholds' in ${this.constructor.name} of type string must be floating point value.`,
      );
    } else if (isThresholdsTypeString) {
      this.#options.thresholds = createSteps(this.#options.thresholds);
    } else if (isThresholdsTypeArray) {
      // filter duplicates, sort array and convert to floating point values of necessary
      this.#options.thresholds = [...new Set(this.#options.thresholds)]
        .sort((a, b) => {
          if (a === Infinity || Number.isNaN(a)) {
            throw new TypeError(
              `Property 'tresholds' in ${this.constructor.name} is invalid. Only numbers are allowed.`,
            );
          }

          return a - b;
        })
        .map((threshold) => convertNumberToFloatingPoint(threshold));
    }
  };

  #formatRootMargin = () => {
    const margins = this.#options.rootMargin.split(' ');

    // Top Right Bottom Left
    switch (margins.length) {
      case 1: // TRBL
        this.#options.rootMargin = `${margins[0]} `.repeat(4).trimEnd();
        break;
      case 2: // TB LR
        this.#options.rootMargin = `${margins[0]} ${margins[1]} `
          .repeat(2)
          .trimEnd();
        break;
      case 3: // T LR B
        this.#options.rootMargin = `${margins[0]} ${margins[1]} ${margins[1]} ${margins[2]}`;
        break;
      default:
        break;
    }
  };

  #setupOptions = (options) => {
    const defaults = {
      // element to monitor when scrolling
      target: document.body,
      /** sets the area margin when to trigger the thresholds,
       * positive values shifts the detection area outside the screen
       * to trigger callbacks earlier before they enter the viewport
      */
      rootMargin: '0px 0px 0px 0px',
      /**
       * These are the measure points, they will trigger the callbacks when the threshold entered the viewport.
       * They represent percentages.
       * Can be an array of values:
       * [0, 10, 25, 45, 50, 70, 100]
       * [0, 0.10, 0.25, 0.45, 0.50, 0.70, 1]
       * Can be automatically generated by providing a step as string:
       * '0.25' => [0, 0.25, 0.50, 0.75, 1]
       * */
      thresholds: [0, 0.25, 0.5, 0.75, 1],
      // triggers only callbacks from this threshold and above, ignores the callbacks below this mark
      interactWhen: 0,
      // does not trigger on 0 scroll depth
      excludeZero: false,
      // triggers registered callbacks only once when the threshold was passed
      triggerOnce: false,
      // triggers registered callbacks on pageload when they are already below the current scroll depth
      triggerPrevious: false,

      // shows rootMargin areas when thresholds should trigger, may be not visible when it's outside the viewport
      showRootMargin: false,
      // display horizontal lines where the markers are located
      showMarkers: false,
      // set classes on markers
      markerClasses: 'sc-scroll-depth-marker',
      // set IDs for markers as a prefix followed by a number
      markerIdPrefix: '',
      scrollWrapperId: 'sc-scroll-wrapper',
    };

    this.#options = options ?? {};

    // check for unwanted passed options
    for (const prop of Object.keys(this.#options)) {
      if (typeof defaults[prop] === 'undefined') {
        throw new Error(
          `Property '${prop}' in ${this.constructor.name} options invalid.`,
        );
      }
    }

    this.#checkThresholds();

    // add defaults to options, if not available in passed config
    for (const [option, val] of Object.entries(defaults)) {
      if (!hasProp(this.#options, option)) {
        this.#options[option] = val;
      }
    }

    // cut off 0 from the array
    if (
      this.#options.excludeZero
      && this.#options.thresholds.length > 0
      && this.#options.thresholds[0] === 0
    ) {
      this.#options.thresholds = this.#options.thresholds.slice(1);
    }

    this.#formatRootMargin();
  };
}
