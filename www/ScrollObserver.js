const convertNumberToFloatingPoint=t=>{var e=-1===(""+t).indexOf(".");if(100<t||!e&&1<Number(t))throw Error("Not more than 100% allowed: "+JSON.stringify({step:t}));return e?t/100:t},createSteps=t=>{let o=t??.25;o=convertNumberToFloatingPoint(o);t=Math.round(1/o);return Array(t+1).fill().map((t,e)=>{e=Number((e*o).toFixed(2));return 1<e?1:e})},hasProp=(t,e)=>Object.prototype.hasOwnProperty.call(t,e);export default class ScrollObserver{#options={};#observer={};#triggerFunctions={};#lastScrollPercentage="init";isScrollingUp=!0;isScrollingDown=!this.isScrollingUp;constructor(t){this.#init(t);t={threshold:this.#options.thresholds,root:this.#options.target===document.body?null:this.#options.target,rootMargin:this.#options.rootMargin};this.#observer=new IntersectionObserver(t=>{t.forEach(t=>{if(t.isIntersecting){var e=parseFloat(t.target.dataset.threshold);const i=100*e;var o=e>=this.#options.interactWhen;if(this.#setScrollDirection(),o)for(var[r,s]of Object.entries(this.#triggerFunctions))Number(r)===e&&s.forEach(t=>t(i));this.#options.triggerOnce&&this.#observer.unobserve(t.target)}})},t),this.#setObserverMarkers()}#init=t=>{this.#setupOptions(t),this.#setRelativeStyle(),this.#options.showRootMargin&&this.#showRootMargin()};#setRelativeStyle=()=>{if(this.#options.target===document.body)this.#options.target.style.position="relative";else{const t=document.createElement("div");t.id=this.#options.scrollWrapperId,t.style.position="relative",t.innerHTML=this.#options.target.innerHTML,this.#options.target.innerHTML="",this.#options.target.appendChild(t)}};#showRootMargin=()=>{var t=this.#options.rootMargin.split(" ");let[,r,s,i]=/(-?)(\d+)(\w+|%)/.exec(t[0]),[,n,h,a]=(r=""===r?"+":"-",/(-?)(\d+)(\w+|%)/.exec(t[2]));n=""===n?"+":"-",0===Number(s)&&0===Number(h)||[document.createElement("div"),document.createElement("div")].forEach((t,e)=>{const o=t;t=0===e;o.style.position="fixed",t?(o.style.bottom=`calc(100% ${r} ${s}${i})`,o.style.top=0):(o.style.top=`calc(100% ${n} ${h}${a})`,o.style.bottom=0),o.style.boxShadow=t?"0 3px 0 rgb(244, 246, 0)":"0 -3px 0 rgb(244, 246, 0)",o.ariaHidden=!0,o.style.width="100%",o.style.height=t?s+i:h+a,o.style.background="rgba(225,190,18,0.7)",o.style.display="block",o.style.pointerEvents="none",this.#appendElementToTarget(o)})};#setScrollDirection=()=>{var t=this.#getCurrentScrollPercentage().rounded;"number"==typeof this.#lastScrollPercentage&&(t<this.#lastScrollPercentage?this.isScrollingUp=!1:this.isScrollingUp=!0),this.#lastScrollPercentage=t};#getCurrentScrollPercentage=()=>{var t="scrollTop",e="scrollHeight";let o,r,s=document.documentElement;var i=document.body,i=(r=this.#options.target===document.body?(o=(s[e]||i[e])-s.clientHeight,s[t]||i[t]):(s=document.querySelector("#"+this.#options.scrollWrapperId),o=s[e]-s.clientHeight,s[t]))/o*100,e=Math.round(i);return 0===o?{value:0,rounded:0,text:"0 %"}:{value:i,rounded:e,text:e+" %"}};observe=(t,e)=>{var t=Array.isArray(t)?t:Array.of(t),o=this.#getCurrentScrollPercentage().value;for(const s of t){var r=convertNumberToFloatingPoint(s);if(!(this.#options.triggerPrevious&&100*Number(r)<o&&(e(100*Number(r)),this.#options.triggerOnce))){if(this.#triggerFunctions[r])return void this.#triggerFunctions[r].push(e);this.#triggerFunctions[r]=[],this.#triggerFunctions[r].push(e)}}};#appendElementToTarget=t=>{(this.#options.target===document.body?this.#options.target:document.querySelector("#"+this.#options.scrollWrapperId)).appendChild(t)};#setObserverMarkers=()=>{this.#options.thresholds.forEach((t,e)=>{const o=document.createElement("div");o.className=this.#options.markerClasses,o.style.position="absolute",o.style.top=100*t+"%",o.style.pointerEvents="none",o.style.left="50%",o.style.transform="translateX(-50%)",o.dataset.threshold=t,o.ariaHidden=!0,this.#options.markerIdPrefix&&(o.id=this.#options.markerIdPrefix+(e+1)),this.#options.showMarkers||(o.style.zIndex="-1"),this.#options.showMarkers&&(o.style.width="100%",o.style.height="3px",o.style.background="black",o.style.display="block"),this.#appendElementToTarget(o),this.#observer.observe(o)})};#checkThresholds=()=>{var t="string"==typeof this.#options.thresholds,e=Array.isArray(this.#options.thresholds);if(!hasProp(this.#options,"thresholds"))throw TypeError(`Property 'tresholds' in ${this.constructor.name} options required.`);if(!t&&!e)throw TypeError(`Property 'tresholds' in ${this.constructor.name} must be type of 'string' or 'array'.`);if(t&&-1===this.#options.thresholds.indexOf("."))throw TypeError(`Property 'tresholds' in ${this.constructor.name} of type string must be floating point value.`);t?this.#options.thresholds=createSteps(this.#options.thresholds):e&&(this.#options.thresholds=[...new Set(this.#options.thresholds)].sort((t,e)=>{if(t===1/0||Number.isNaN(t))throw new TypeError(`Property 'tresholds' in ${this.constructor.name} is invalid. Only numbers are allowed.`);return t-e}).map(t=>convertNumberToFloatingPoint(t)))};#formatRootMargin=()=>{var t=this.#options.rootMargin.split(" ");switch(t.length){case 1:this.#options.rootMargin=(t[0]+" ").repeat(4).trimEnd();break;case 2:this.#options.rootMargin=`${t[0]} ${t[1]} `.repeat(2).trimEnd();break;case 3:this.#options.rootMargin=`${t[0]} ${t[1]} ${t[1]} `+t[2]}};#setupOptions=t=>{var e,o,r={target:document.body,rootMargin:"0px 0px 0px 0px",thresholds:[0,.25,.5,.75,1],interactWhen:0,excludeZero:!1,triggerOnce:!1,triggerPrevious:!1,showRootMargin:!1,showMarkers:!1,markerClasses:"sc-scroll-depth-marker",markerIdPrefix:"",scrollWrapperId:"sc-scroll-wrapper"};this.#options=t??{};for(const s of Object.keys(this.#options))if(void 0===r[s])throw new Error(`Property '${s}' in ${this.constructor.name} options invalid.`);this.#checkThresholds();for([e,o]of Object.entries(r))hasProp(this.#options,e)||(this.#options[e]=o);this.#options.excludeZero&&0<this.#options.thresholds.length&&0===this.#options.thresholds[0]&&(this.#options.thresholds=this.#options.thresholds.slice(1)),this.#formatRootMargin()}}
//# sourceMappingURL=ScrollObserver.js.map
