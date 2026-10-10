/**
 * The page's motion, armed from <head> (inlined once in the root layout), so
 * it works before and without hydration, on every width.
 *
 * - Header: data-scrolled on the header once the page leaves the top (the
 *   frosted bar, and the home header leaving the photograph). <html
 *   data-motion> says this script runs; only then may the home header lie
 *   transparent over the photograph (with scripting off it stays solid).
 * - Entrances: .tkh-reveal (the element) and .tkh-reveal-stagger (its
 *   children, in turn) fade and rise as they enter the screen. Fail-open by
 *   construction: an element is only ever hidden after the observer has
 *   reported it BELOW the screen (it gets data-rv, and data-in in the same
 *   callback when it is on screen), so nothing on screen at first paint is
 *   hidden; positions come from the observer, never a forced layout, and nothing is hidden at all without scripts, without
 *   IntersectionObserver, or under reduced motion. One observer for the whole
 *   page; transform and opacity only (composited, no layout).
 *
 * Elements are collected at DOMContentLoaded, then by a MutationObserver that
 * scans only when nodes were added (client navigations). ES5 on purpose.
 */
export const MOTION_JS = `(function(){try{
var d=document.documentElement,hdr=null,raf=0;
function hs(){raf=0;if(!hdr||!hdr.isConnected)hdr=document.querySelector("[data-site-header]");if(!hdr)return;if(window.scrollY>8)hdr.setAttribute("data-scrolled","");else hdr.removeAttribute("data-scrolled")}
function soon(){if(!raf)raf=requestAnimationFrame(hs)}
window.addEventListener("scroll",soon,{passive:true});
d.setAttribute("data-motion","");
if(!("IntersectionObserver" in window))return;
if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var io=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){var e=es[i],t=e.target,seen=e.isIntersecting||e.boundingClientRect.top<0;if(!t.hasAttribute("data-rv")){t.setAttribute("data-rv","");if(seen){t.setAttribute("data-in","1");io.unobserve(t)}}else if(seen){t.setAttribute("data-in","2");io.unobserve(t)}}},{rootMargin:"0px 0px -6% 0px"});
function scan(){soon();var l=document.querySelectorAll(".tkh-reveal:not([data-io]),.tkh-reveal-stagger:not([data-io])");for(var k=0;k<l.length;k++){l[k].setAttribute("data-io","");io.observe(l[k])}}
function added(r){for(var k=0;k<r.length;k++){if(r[k].addedNodes.length){scan();return}}}
function watch(){scan();new MutationObserver(added).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch);else watch();
}catch(e){}})();`;
