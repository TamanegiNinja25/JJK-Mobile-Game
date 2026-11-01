// Tells the player when a newer version of the game is out. At most every few hours it asks GitHub for
// the latest release of the game's repository. If that release is newer than this build, the title screen
// shows it, and the button opens the release page, where the new APK is. Nothing is sent but the request
// itself, and if the phone is offline or GitHub doesn't answer, the game carries on and tries again later.

declare const __APP_VERSION__: string;

/** this build's version, written in at build time from package.json */
export const APP_VERSION: string = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';
const REPO = 'TamanegiNinja25/JJK-Mobile-Game';
/** GitHub forwards this to whichever release is newest */
export const RELEASES_URL = `https://github.com/${REPO}/releases/latest`;
const API = `https://api.github.com/repos/${REPO}/releases/latest`;
const KEY = 'cursedChronicles.update';
const EVERY = 6 * 3600 * 1000;

export interface UpdateInfo {
  version: string;
  name: string;
  /** the section headings of the release notes, as a short "what's new" */
  news: string[];
  publishedAt: string;
}

interface Stored { checked: number; latest: UpdateInfo | null; seen?: string }

/** Compares dotted versions ('v1.10.0' > '1.9.2'). */
export function cmpVersion(a: string, b: string) {
  const pa = a.replace(/^v/i, '').split(/[.-]/).map(n => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/i, '').split(/[.-]/).map(n => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length, 3); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d) return Math.sign(d);
  }
  return 0;
}

/** The '### ' headings of a release's notes, cleaned of markdown. */
function headlines(body: string) {
  return body.split('\n').filter(l => /^#{2,4}\s/.test(l))
    .map(l => l.replace(/^#+\s*/, '').replace(/[*_`[\]]/g, '').trim())
    .filter(l => l && !/^install/i.test(l)).slice(0, 6).map(l => l.slice(0, 60));
}

class Updates {
  /** a release newer than this build, if one is known */
  latest: UpdateInfo | null = null;
  status: 'idle' | 'checking' | 'ok' | 'offline' | 'error' = 'idle';
  checked = 0;
  private seen = '';
  private listeners: ((u: UpdateInfo | null) => void)[] = [];
  private pending: Promise<UpdateInfo | null> | null = null;

  constructor() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Stored | null;
      if (s) {
        this.checked = +s.checked || 0;
        this.seen = String(s.seen ?? '');
        // a release found on an earlier launch still counts offline, unless this build has caught up
        if (s.latest?.version && cmpVersion(s.latest.version, APP_VERSION) > 0) this.latest = s.latest;
      }
    } catch { /* storage unavailable: check from scratch */ }
  }

  onChange(fn: (u: UpdateInfo | null) => void) { this.listeners.push(fn); }

  /** True until the player has been shown this version's notice once. */
  get unseen() { return !!this.latest && this.seen !== this.latest.version; }

  markSeen() {
    if (!this.latest) return;
    this.seen = this.latest.version;
    this.store();
  }

  /** Asks GitHub for the newest release; without `force`, only if the last answer is a few hours old. */
  check(force = false): Promise<UpdateInfo | null> {
    if (this.pending) return this.pending;
    if (!force && Date.now() - this.checked < EVERY && Date.now() >= this.checked) return Promise.resolve(this.latest);
    if (typeof fetch !== 'function') return Promise.resolve(this.latest);
    this.status = 'checking';
    this.pending = this.fetchLatest().finally(() => { this.pending = null; });
    return this.pending;
  }

  private async fetchLatest() {
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => ctl?.abort(), 9000);
    try {
      const r = await fetch(API, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store', signal: ctl?.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json() as { tag_name?: unknown; name?: unknown; body?: unknown; published_at?: unknown; draft?: unknown; prerelease?: unknown };
      const version = String(j.tag_name ?? '').replace(/^v/i, '');
      if (!/^\d+(\.\d+){1,3}$/.test(version)) throw new Error('no version');
      const info: UpdateInfo = {
        version,
        name: String(j.name ?? 'v' + version).slice(0, 80),
        news: headlines(String(j.body ?? '')),
        publishedAt: String(j.published_at ?? ''),
      };
      this.latest = cmpVersion(version, APP_VERSION) > 0 && !j.draft && !j.prerelease ? info : null;
      this.status = 'ok';
      this.checked = Date.now();
    } catch {
      this.status = typeof navigator !== 'undefined' && navigator.onLine === false ? 'offline' : 'error';
      // try again in a few minutes rather than at the next launch
      this.checked = Date.now() - EVERY + 10 * 60 * 1000;
    } finally {
      clearTimeout(timer);
    }
    this.store();
    for (const fn of this.listeners) { try { fn(this.latest); } catch { /* a listener's failure isn't the check's */ } }
    return this.latest;
  }

  private store() {
    try { localStorage.setItem(KEY, JSON.stringify({ checked: this.checked, latest: this.latest, seen: this.seen } satisfies Stored)); } catch { /* storage unavailable */ }
  }
}

export const updates = new Updates();

/** Opens a page of the game's repository in the phone's browser (the game's own view never leaves the game). */
export function openReleasePage(url = RELEASES_URL) {
  const bridge = (window as unknown as { CCAndroid?: { openUrl?: (u: string) => boolean } }).CCAndroid;
  if (bridge?.openUrl) {
    try { if (bridge.openUrl(url) !== false) return true; } catch { /* fall back to the browser way */ }
  }
  // with 'noopener' a browser returns null even when the page opened, so success is "it didn't throw"
  try { window.open(url, '_blank', 'noopener'); return true; } catch { return false; }
}

/** How long ago something happened, for "checked 5 min ago". */
export function ago(t: number) {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.floor(h / 24)} days ago`;
}
