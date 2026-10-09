/**
 * The decode-gated unveil (A2: "below the fold, a dominant-colour ground plus
 * a designed clip-path unveil that starts only after img.decode() resolves,
 * so no half-loaded image is ever shown").
 *
 * Inlined once in the root layout's <head>. It marks <html> ready only when it
 * can do the whole job (motion welcome, no error); only then does CSS clip the
 * images of .tkh-unveil pictures (components/Picture). Each one is watched;
 * when it is near or above the viewport (a jump past it counts, so nothing
 * scrolled over stays hidden) its image is decoded, and only then does the
 * reveal start. Its image is fetched now if lazy loading
 * skipped it. A decode that fails, or takes longer than six seconds, reveals
 * anyway, so nothing can stay hidden. With scripting
 * off, or under reduced motion, the attribute is never set and every image
 * simply shows. Written as ES5: it runs before any bundle. Pictures are
 * collected at DOMContentLoaded and then by an observer that scans only when
 * nodes were added (client navigations); watching the parser itself cost
 * hundreds of milliseconds of main thread at Lighthouse's CPU throttle.
 */
export const UNVEIL_JS = `(function(){try{
if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var pending=[];var raf=0;
function reveal(p){var done=false;function go(){if(done)return;done=true;p.setAttribute("data-shown","")}var img=p.querySelector("img");if(img&&img.loading==="lazy")img.loading="eager";if(img&&img.decode){img.decode().then(go,go)}else{go()}setTimeout(go,6000)}
function check(){raf=0;var h=window.innerHeight+200;for(var k=pending.length-1;k>=0;k--){var p=pending[k];if(p.getBoundingClientRect().top<h){pending.splice(k,1);reveal(p)}}}
function soon(){if(!raf)raf=requestAnimationFrame(check)}
function scan(){var l=document.querySelectorAll(".tkh-unveil:not([data-watch])");for(var k=0;k<l.length;k++){l[k].setAttribute("data-watch","");pending.push(l[k])}if(l.length)soon()}
function added(r){for(var k=0;k<r.length;k++){if(r[k].addedNodes.length){scan();return}}}
function watch(){scan();new MutationObserver(added).observe(document.documentElement,{childList:true,subtree:true})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch);else watch();
window.addEventListener("scroll",soon,{passive:true});window.addEventListener("resize",soon);
document.documentElement.setAttribute("data-unveil-ready","");
}catch(e){document.documentElement.removeAttribute("data-unveil-ready")}})();`;
