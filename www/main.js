/* eslint-disable import/extensions,no-unused-vars */

// import ScrollObserver from './ScrollObserver.js';
import ScrollTracker from './ScrollTracker.js';

const getCurrentScrollPercentage = () => {
  const st = 'scrollTop';
  const sh = 'scrollHeight';

  const h = document.documentElement;
  const b = document.body;

  const depth = (h[sh] || b[sh]) - h.clientHeight;
  const scrollTop = h[st] || b[st];

  return depth === 0 ? 0 : Math.round((scrollTop / depth) * 100);
};

const messageElement = document.querySelector('.message');
const percentageElement = document.querySelector('.percentage');

const setUI = (depthInfo) => {
  if (depthInfo.state === 'page loaded') {
    messageElement.textContent = depthInfo.state;
    percentageElement.textContent = `${getCurrentScrollPercentage()} %`;
    return;
  }

  messageElement.textContent = depthInfo.state;
  percentageElement.textContent = `${depthInfo.depth} %`;
};

function main() {
  window.dataLayer = window.dataLayer || [];

  // const scrollObserver = new ScrollObserver({
  //   thresholds: '0.25',
  //   // triggerOnce: true,
  //   triggerPrevious: true,
  //   showMarkers: true,
  // });

  // // setUI({ state: 'page loaded' });

  // scrollObserver.observe([25, 50], (depthInfo) => {
  //   setUI(depthInfo);
  //   window.dataLayer.push({
  //     depth: depthInfo.depth,
  //   });
  // });
  // scrollObserver.observe(75, (depthInfo) => {
  //   setUI(depthInfo);
  //   window.dataLayer.push({
  //     depth: depthInfo.depth,
  //   });
  // });

  const scrollTracker = new ScrollTracker({
    triggerOnce: true,
    triggerPrevious: true,
  });
  scrollTracker.observe(20, (depthInfo) => {
    setUI(depthInfo);
    window.dataLayer.push({
      depth: depthInfo.depth,
    });
  });
  scrollTracker.observe(60, (depthInfo) => {
    setUI(depthInfo);
    window.dataLayer.push({
      depth: depthInfo.depth,
    });
  });
}

function contentLoadedHandler(evt) {
  window.removeEventListener('DOMContentLoaded', contentLoadedHandler);
  main.call(this);
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', contentLoadedHandler);
} else main();
