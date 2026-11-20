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

/**
 * Saves a text file the game made (a backup): into Downloads or the share sheet on Android, the share sheet on
 * iPhone and iPad (Save to Files), or an ordinary download in a desktop browser. Resolves to where it went.
 */
export async function saveTextFile(name: string, text: string): Promise<'downloads' | 'shared' | 'downloaded' | ''> {
  const bridge = (window as unknown as { CCAndroid?: { saveText?: (n: string, t: string) => string } }).CCAndroid;
  if (bridge?.saveText) {
    try { return (bridge.saveText(name, text) as 'downloads' | 'shared' | '') ?? ''; } catch { return ''; }
  }
  const file = typeof File !== 'undefined' ? new File([text], name, { type: 'application/json' }) : null;
  const n = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (file && isIOS && n.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return 'shared'; } catch { /* cancelled: fall back to a download */ }
  }
  try {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'downloaded';
  } catch { return ''; }
}

/** Lets the player pick a text file (a backup) and resolves to its contents, or null if none was picked. */
export function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json,text/plain';
    input.style.display = 'none';
    input.onchange = () => {
      const f = input.files?.[0];
      input.remove();
      if (!f) { resolve(null); return; }
      if (f.size > 8_000_000) { resolve(null); return; }
      f.text().then(resolve, () => resolve(null));
    };
    document.body.appendChild(input);
    input.click();
  });
}

/** A backup file name with today's date, e.g. cursed-chronicles-backup-2026-11-20.json */
export function backupName() {
  const d = new Date(), p = (n: number) => String(n).padStart(2, '0');
  return `cursed-chronicles-backup-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}
