/**
 * The booking bar's whole behaviour, as one small classic script · no React.
 *
 * Every StaySearch (components/stay/StaySearch.tsx) is a real GET form to
 * /book with two native date inputs and a guests select. This script, inlined
 * once in the root layout's <head>, makes it pleasant without making it a
 * hydrated island:
 *
 * - default dates (tomorrow to the day after, on the hotel's clock) are filled
 *   in on the CLIENT, so a static page never freezes a date; each form calls
 *   window.__tkhStay(form) from a tiny inline script right after itself, so
 *   the dates are there at first paint
 * - the visible date labels are the inputs' values in the page language
 *   (formatDay's "Wed 8 Oct", via Intl), written to a data attribute and drawn
 *   by CSS, so React never sees a text node change and nothing re-renders
 * - check-out always stays after check-in; past dates are refused, and the
 *   nights between them are drawn too ("2 nights", the page language's
 *   plural forms from data-forms, chosen with Intl.PluralRules)
 * - once the range calendar island is up (<html data-cal-ready>,
 *   components/stay/StayCalendarHost) a click on a date field opens that
 *   calendar instead of the browser's own picker
 * - a click on a date opens the native picker
 * - forms added later by client-side navigation are picked up by a
 *   MutationObserver (React does not run inline scripts it inserts). It
 *   starts at DOMContentLoaded, not during parsing: the HTML's own forms are
 *   already handled inline, and watching the parser cost 250 to 800 ms of
 *   main thread per page at Lighthouse's 4x CPU throttle. It only scans
 *   when nodes were added
 * - it fires `tkh:stay` on the form, which the room page's totals listen to
 * - any date input marked data-min-today (the reservation and contact forms)
 *   gets today as its minimum, and data-default-today as its value when it is
 *   empty or past, so a static form never offers yesterday. The default is
 *   applied once per input: the observer runs on every DOM change, and a date
 *   the guest typed must stay what they typed (the native min then refuses a
 *   past one with the browser's own message)
 *
 * With scripting off the native inputs are shown instead of the labels (the
 * <noscript> style in app/layout), so the labels track the real inputs either
 * way. Written as ES5 on purpose: it runs before any bundle, in any browser.
 */
export const STAY_CORE_JS = `(function(){
if(window.__tkhStay)return;
var TZ="Asia/Bangkok";
function today(){try{return new Intl.DateTimeFormat("en-CA",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}catch(e){return new Date().toISOString().slice(0,10)}}
function add(iso,n){var p=iso.split("-");return new Date(Date.UTC(+p[0],+p[1]-1,+p[2]+n,12)).toISOString().slice(0,10)}
var F={};
function lab(iso,tag){if(!iso)return"";var f=F[tag];if(!f){try{f=new Intl.DateTimeFormat(tag,{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"})}catch(e){f=new Intl.DateTimeFormat("en-GB",{weekday:"short",day:"numeric",month:"short",timeZone:"UTC"})}F[tag]=f}var p=iso.split("-");var s=f.format(new Date(Date.UTC(+p[0],+p[1]-1,+p[2],12)));return tag==="en-GB"?s.split(",").join(""):s}
function diff(a,b){var p=a.split("-"),q=b.split("-");return Math.round((Date.UTC(+q[0],+q[1]-1,+q[2])-Date.UTC(+p[0],+p[1]-1,+p[2]))/864e5)}
var P={};
function nights(el,tag,n){var f;try{f=JSON.parse(el.getAttribute("data-forms")||"{}")}catch(e){f={}}var r="other";try{var pr=P[tag]||(P[tag]=new Intl.PluralRules(tag));r=pr.select(n)}catch(e){}var t=f[r]||f.other||"{n}";var num=String(n);try{num=new Intl.NumberFormat(tag).format(n)}catch(e){}return t.split("{n}").join(num)}
function sync(form){
if(!form||!form.querySelector)return;
var tag=form.getAttribute("data-intl")||"en-GB";
var i=form.querySelector('input[name="in"]'),o=form.querySelector('input[name="out"]');
if(!i||!o)return;
var t=today();
i.min=t;
if(!i.value||i.value<t)i.value=add(t,1);
if(!o.value||o.value<=i.value)o.value=add(i.value,1);
o.min=add(i.value,1);
if(diff(i.value,o.value)>30)o.value=add(i.value,30);
var a=form.querySelector('[data-stay-text="in"]'),b=form.querySelector('[data-stay-text="out"]'),c=form.querySelector("[data-stay-nights]");
if(a)a.setAttribute("data-v",lab(i.value,tag));
if(b)b.setAttribute("data-v",lab(o.value,tag));
if(c)c.setAttribute("data-v",nights(c,tag,diff(i.value,o.value)));
form.setAttribute("data-ready","");
try{form.dispatchEvent(new CustomEvent("tkh:stay",{bubbles:true}))}catch(e){}
}
window.__tkhStay=sync;
document.addEventListener("change",function(e){var x=e.target;var f=x&&x.closest&&x.closest("[data-stay-search]");if(f)sync(f)});
document.addEventListener("click",function(e){if(document.documentElement.hasAttribute("data-cal-ready"))return;var x=e.target;if(x&&x.matches&&x.matches("[data-stay-search] input[type=date]")&&x.showPicker){try{x.showPicker()}catch(r){}}});
function days(){var t=today();var d=document.querySelectorAll("input[data-min-today]");for(var k=0;k<d.length;k++){var x=d[k];if(!x.min||x.min<t)x.min=t;if(x.__tkhDay)continue;x.__tkhDay=1;if(x.hasAttribute("data-default-today")&&(!x.value||x.value<t))x.value=t}}
function scan(){var l=document.querySelectorAll("[data-stay-search]:not([data-ready])");for(var k=0;k<l.length;k++)sync(l[k]);days()}
function added(r){for(var k=0;k<r.length;k++){if(r[k].addedNodes.length){scan();return}}}
function watch(){scan();try{new MutationObserver(added).observe(document.documentElement,{childList:true,subtree:true})}catch(e){}}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",watch);else watch();
})();`;

/** Called right after each form in the HTML, so its dates exist at first paint. */
export const STAY_FORM_JS =
  "window.__tkhStay&&window.__tkhStay(document.currentScript&&document.currentScript.previousElementSibling)";

/** With scripting off: show the native inputs, hide the drawn labels. */
export const STAY_NOSCRIPT_CSS =
  ".stay-date{position:static!important;opacity:1!important;width:100%!important;height:auto!important;font-size:14px}.stay-text{display:none!important}.stay-cap{display:block!important}";
