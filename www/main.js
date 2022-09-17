'use strict';
// import ScrollObserver from './ScrollObserver.js';
import {ScrollObserver} from './ScrollObserver.js';

function main() {
  const scrollObserver = new ScrollObserver({
    thresholds: '0.25',
    triggerOnce: true,
    triggerPrevious: true,
    showMarkers: true,
  });

  window.dataLayer = window.dataLayer || [];

  scrollObserver.observe([25, 50], (depth) => {
    window.dataLayer.push({
      depth,
    });
  });
  scrollObserver.observe(75, (depth) => {
    window.dataLayer.push({
      depth,
    });
  });
}

function contentLoadedHandler(evt) {
  window.removeEventListener('DOMContentLoaded', contentLoadedHandler);
  main.call(this);
}

if (typeof window != 'undefined') {
  window.addEventListener('DOMContentLoaded', contentLoadedHandler);
} else main();
