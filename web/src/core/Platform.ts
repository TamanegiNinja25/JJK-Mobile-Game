// Where the game is running: inside the Android app, or as a web page (the home-screen web app on
// iPhone and iPad, hosted on GitHub Pages). The web build keeps an offline copy of itself through a
// service worker and asks the browser to keep its saves.

/** the GitHub Pages address of the web app (the iPhone/iPad version) */
export const WEB_APP_URL = 'https://tamanegininja25.github.io/JJK-Mobile-Game/';

const nav = typeof navigator !== 'undefined' ? navigator : null;

/** Running inside the Android app (its WebView exposes the CCAndroid bridge). */
export const isAndroidApp = typeof window !== 'undefined' && !!(window as unknown as { CCAndroid?: unknown }).CCAndroid;

/** iPhone, iPad (iPadOS reports itself as a Mac with a touch screen) or iPod. */
export const isIOS = !!nav && (/iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1));

/** Started from the home screen rather than a browser tab. */
export function isStandalone() {
  try {
    return !!(nav as unknown as { standalone?: boolean })?.standalone || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
  } catch { return false; }
}

let reg: ServiceWorkerRegistration | null = null;
/** set once a newer copy of the web app has been downloaded and is waiting for a restart */
export let webUpdateReady = false;
const updateListeners: (() => void)[] = [];
export function onWebUpdate(fn: () => void) { updateListeners.push(fn); }

/** Web build only: keep an offline copy, ask for lasting storage, and notice new versions. */
export function initWebApp() {
  if (isAndroidApp || !nav) return;
  // the saves live in this site's storage: ask the browser not to clear it when space runs low
  try { void nav.storage?.persist?.(); } catch { /* not offered */ }
  const sw = nav.serviceWorker;
  // https only (GitHub Pages); a local test server can opt in with ?sw=1
  const ok = location.protocol === 'https:' || /[?&]sw=1/.test(location.search);
  if (!sw || !ok) return;
  const hadController = !!sw.controller;
  sw.addEventListener('controllerchange', () => {
    // the first install takes over silently; a later one is a new version
    if (!hadController) return;
    webUpdateReady = true;
    for (const fn of updateListeners) { try { fn(); } catch { /* a listener's failure isn't ours */ } }
  });
  window.addEventListener('load', () => {
    sw.register('sw.js').then((r) => { reg = r; }).catch(() => { /* runs online only, which is fine */ });
  });
}

/** Ask for a newer copy of the web app now (the update check found a release). */
export function checkWebUpdate() { try { void reg?.update(); } catch { /* offline */ } }
