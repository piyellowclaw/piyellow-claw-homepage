'use strict';
// Run with Node or Bun; exercises the browser script without third-party dependencies.
const vm = require('vm');
const fs = require('fs');
const assert = require('assert');
function check(en) {
  const elements = {};
  function element() {
    return {textContent: '', value: '48', attrs: {}, listeners: {},
      addEventListener(type, fn) { this.listeners[type] = fn; },
      setAttribute(key, value) { this.attrs[key] = value; }};
  }
  ['portrait','density','density-value','motion','sketch-status','regenerate','year'].forEach(id => elements[id] = element());
  let paths = [], path;
  const context = {
    setTransform() {}, clearRect() { paths = []; },
    beginPath() { path = []; paths.push(path); },
    moveTo(x,y) { path.push([x,y]); }, lineTo(x,y) { path.push([x,y]); },
    closePath() {}, stroke() {}, strokeRect() {}
  };
  elements.portrait.getContext = () => context;
  elements.portrait.getBoundingClientRect = () => ({width:360,height:360,left:0,top:0});
  const document = {documentElement:{lang: en ? 'en' : 'zh-Hant'}, hidden:false,
    querySelector: selector => elements[selector.slice(1)], querySelectorAll: () => [],
    listeners: {}, addEventListener(type, fn) { this.listeners[type] = fn; }};
  let queued = new Map(), next = 0, observer;
  const reduced = {matches:false,addEventListener(type, fn) {this.change=fn;}};
  class IntersectionObserver { constructor(fn) {observer=fn;} observe() {} }
  class ResizeObserver { constructor(fn) {this.fn=fn;} observe() {} }
  const sandbox = {document,URLSearchParams, location:{search:''},
    localStorage:{getItem() {throw Error('blocked');}},
    matchMedia:()=>reduced,devicePixelRatio:3,IntersectionObserver,ResizeObserver,
    requestAnimationFrame: fn => {queued.set(++next,fn);return next;},
    cancelAnimationFrame:id => queued.delete(id)};
  sandbox.window = sandbox;
  vm.runInNewContext(fs.readFileSync('script.js','utf8'),sandbox);
  const initial = JSON.stringify(paths);
  assert(initial.length > 10000, 'Dense composition drawn with storage blocked');
  assert.equal(queued.size,0,'Static default');
  assert.equal(elements.portrait.width,540,'DPR capped to 1.5');
  elements.density.listeners.input();
  assert.equal(JSON.stringify(paths),initial,'Same seed gives same geometry');
  elements.regenerate.listeners.click();
  assert.notEqual(JSON.stringify(paths),initial,'Regenerate changes geometry');
  const full = paths.length;
  elements.density.value='24'; elements.density.listeners.input();
  assert(paths.length < full,'Density changes actual draw count');
  elements.density.listeners.change();
  assert(elements['sketch-status'].textContent.includes('24'));
  elements.motion.listeners.click();
  assert.equal(queued.size,1,'Opt-in starts animation');
  document.hidden=true;document.listeners.visibilitychange();
  assert.equal(queued.size,0,'Hidden tab stops animation');
  document.hidden=false;document.listeners.visibilitychange();
  assert.equal(queued.size,1);
  observer([{isIntersecting:false}]);assert.equal(queued.size,0,'Offscreen stops animation');
  observer([{isIntersecting:true}]);assert.equal(queued.size,1);
  reduced.matches=true;reduced.change();assert.equal(queued.size,0);
  assert.equal(elements.motion.attrs['aria-pressed'],'false');
  assert(elements.motion.disabled,'Reduced motion disables breathing');
  const reducedNote = en ? 'reduced motion' : '減少動態';
  const assertReducedNote = () => assert(elements['sketch-status'].textContent.includes(reducedNote), 'Reduced-motion note persists');
  assertReducedNote();
  elements.regenerate.listeners.click(); assertReducedNote();
  elements.density.value='36'; elements.density.listeners.input();
  elements.density.listeners.change(); assertReducedNote();
  reduced.matches=false; reduced.change();
  assert(!elements['sketch-status'].textContent.includes(reducedNote), 'Note clears when preference changes');
  assert(!elements.motion.disabled);
  console.log('PASS',en?'en':'zh','determinism / density / storage failure / lifecycle / DPR');
}
check(false); check(true);
