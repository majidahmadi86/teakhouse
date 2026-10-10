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
 *   construction: an element is only ever hidden after this script has
 *   measured it BELOW the screen (it gets data-rv, and data-in at the same
 *   moment when it is already on screen), so nothing on screen at first paint
 *   is hidden, and nothing is hidden at all without scripts, without
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
var io=new IntersectionObserver(function(es){for(var i=0;i<es.length;i++){var e=es[i];if(e.isIntersecting||e.boundingClientRect.top<0){e.target.setAttribute("data-in","2");io.unobserve(e.target)}}},{rootMargin:"0px 0px -6% 0px"});
function scan(){hs();var l=document.querySelectorAll(".tkh-reveal:not([data-rv]),.tkh-reveal-stagger:not([data-rv])"),h=window.innerHeight;for(var k=0;k<l.length;k++){var el=l[k],r=el.getBoundingClientRect();el.setAttribute("data-rv","");if(r.top<h&&(r.bottom>0||r.height===0))el.setAttribute("data-in","1");else io.observe(el)}}
function added(r){for(var k=0;k<r.length;k++){if(r[k].addedNodes.length){scan();return}}}
function watch(){scan();new MutationObserver(added).observe(document.body,{childList:true,subtree:true})}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch);else watch();
}catch(e){}})();`;
