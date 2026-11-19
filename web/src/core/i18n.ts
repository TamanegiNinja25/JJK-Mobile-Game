// Language: English (as written in the code) or Japanese. Rather than threading a lookup through every
// template, the Japanese text is applied where words reach the screen:
//  - everything in the page (menus, HUD, title screen, toasts, banners) through a MutationObserver that
//    swaps each text node and button label for its translation as it appears;
//  - dialogue lines before they are typed out (Dialogue.ts calls tr()), since the typewriter shows them a
//    letter at a time.
// A string is looked up as it is; failing that, with its numbers replaced by {n} (so "Reached level 12."
// finds "Reached level {n}."), and failing that with known names replaced by {s} as well. The dictionary
// (www/lang/ja.json) is only read when Japanese is picked.

export type Lang = 'en' | 'ja';

let lang: Lang = 'en';
let dict: Record<string, string> = {};
let names: string[] = [];
let ready: Promise<void> | null = null;
const seen = new Set<string>();
const cache = new Map<string, string | null>();
/** strings shown with no translation (filled while collecting, for building the dictionary) */
export const missing = new Set<string>();
export let collecting = false;
export function setCollecting(on: boolean) { collecting = on; }

export function currentLang() { return lang; }

/** Picks the language; Japanese reads its dictionary first. Resolves once text can be translated. */
export function setLang(l: Lang): Promise<void> {
  lang = l === 'ja' ? 'ja' : 'en';
  document.documentElement.lang = lang;
  if (lang === 'en') { stopObserver(); return Promise.resolve(); }
  ready ??= fetch('lang/ja.json').then(r => r.json()).then((j: Record<string, string>) => {
    dict = j;
    cache.clear();
    // names that can sit inside a longer sentence ("Welcome back, Yuji."): the dictionary's short entries
    // that start with a capital, longest first
    names = Object.keys(j).filter(k => k.length >= 3 && k.length <= 32 && /^[A-Z]/.test(k) && !/[.!?:]$/.test(k) && !k.includes('{')).sort((a, b) => b.length - a.length);
  }).catch(() => { dict = {}; });
  return ready.then(() => { startObserver(); translateTree(document.body); });
}

const NUM = /[+\-−]?\d[\d,]*(?:\.\d+)?/g;

/** The Japanese for a string (or the string itself in English, or when there is none). */
export function tr(s: string): string {
  if (lang === 'en' || !s) return s;
  const t = s.trim();
  if (!t || !/[A-Za-z]/.test(t)) return s;
  // the HUD rewrites some text every frame, so answers (misses too) are remembered
  let out = cache.get(t);
  if (out === undefined) {
    out = lookup(t, 0);
    if (cache.size > 4000) cache.clear();
    cache.set(t, out);
  }
  if (out !== null) return keepSpace(s, out);
  if (collecting && !seen.has(t)) { seen.add(t); missing.add(normal(t)); }
  return s;
}

/** the dictionary key a string would be filed under (numbers as {n}, known names as {s}) */
function normal(t: string) {
  let k = t.replace(NUM, '{n}');
  for (const n of names) { const i = k.indexOf(n); if (i >= 0 && edge(k, i, n.length)) k = k.slice(0, i) + '{s}' + k.slice(i + n.length); }
  return k;
}
const edge = (k: string, i: number, len: number) => !/[A-Za-z]/.test(k[i - 1] ?? ' ') && !/[A-Za-z]/.test(k[i + len] ?? ' ');

function lookup(t: string, depth: number): string | null {
  const hit = dict[t];
  if (hit !== undefined) return hit;
  // numbers as placeholders
  const nums: string[] = [];
  const keyN = t.replace(NUM, (m) => { nums.push(m); return '{n}'; });
  if (nums.length) {
    const v = dict[keyN];
    if (v !== undefined) return fill(v, nums);
  }
  // names as placeholders too, longest first, trying the dictionary after each one (so a label that is
  // itself in the dictionary, like "Quest accepted", isn't swallowed as a name)
  const found: { n: string; p: number }[] = [];
  let keyS = keyN;
  for (const n of names) {
    if (found.length > 3) break;
    const i = keyS.indexOf(n);
    if (i < 0 || !edge(keyS, i, n.length)) continue;
    keyS = keyS.slice(0, i) + '{s}' + keyS.slice(i + n.length);
    found.push({ n, p: t.indexOf(n) });
    const v = dict[keyS];
    if (v !== undefined) {
      let out = fill(v, nums);
      // fill the names in the order they appear in the sentence
      for (const f of [...found].sort((a, b) => a.p - b.p)) out = out.replace('{s}', dict[f.n] ?? f.n);
      return out;
    }
  }
  if (depth > 3) return null;
  // pieces: "Name · Lv 3", "Label: value", "📍 Place · south, near ▣ Door"
  const part = (x: string) => (/[A-Za-z]/.test(x) ? lookup(x.trim(), depth + 1) ?? null : x);
  const join = (bits: string[], sep: string) => {
    const tb = bits.map(part);
    if (tb.every(b => b === null)) return null;
    if (collecting) bits.forEach((b, i) => { if (tb[i] === null && !seen.has(b.trim())) { seen.add(b.trim()); missing.add(normal(b.trim())); } });
    return tb.map((b, i) => b ?? bits[i]).join(sep);
  };
  if (t.includes(' · ')) return join(t.split(' · '), '・');
  const sym = /^([^A-Za-z0-9"'(]+)(.+)$/.exec(t);
  if (sym) { const r = part(sym[2]); return r === null ? null : sym[1] + r; }
  const near = /^(.+), near (.+)$/.exec(t);
  if (near) { const a = part(near[1]), b = part(near[2]); if (a !== null || b !== null) return `${a ?? near[1]}・${b ?? near[2]}の近く`; }
  const lab = /^([A-Z][\w' ]{1,24}): (.+)$/.exec(t);
  if (lab) { const a = part(lab[1]), b = part(lab[2]); if (a !== null || b !== null) return `${a ?? lab[1]}：${b ?? lab[2]}`; }
  return null;
}

function fill(v: string, nums: string[]) {
  let i = 0;
  return v.replace(/\{(n|\d)\}/g, (_m, k) => (k === 'n' ? nums[i++] : nums[+k]) ?? '');
}
function keepSpace(orig: string, out: string) {
  const lead = /^\s*/.exec(orig)![0], trail = /\s*$/.exec(orig)![0];
  return lead + out + trail;
}

// ---------------------------------------------------------------- the page

const ATTRS = ['placeholder', 'title', 'aria-label'];
/** marks text a translation has already replaced, so it isn't looked up again */
const done = new WeakMap<Node, string>();

export function translateTree(root: Node) {
  if (lang === 'en') return;
  if (root.nodeType === 3) { translateText(root as Text); return; }
  // skip scripts, styles and anything marked data-noi18n (with everything inside it)
  const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode: (n) => n.nodeType === 1 && ((n as Element).tagName === 'SCRIPT' || (n as Element).tagName === 'STYLE' || (n as Element).hasAttribute('data-noi18n')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  });
  if (root.nodeType === 1) translateAttrs(root as Element);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (n.nodeType === 3) translateText(n as Text);
    else translateAttrs(n as Element);
  }
}
function translateAttrs(el: Element) {
  for (const a of ATTRS) { const v = el.getAttribute(a); if (v && /[A-Za-z]/.test(v)) { const t = tr(v); if (t !== v) el.setAttribute(a, t); } }
}

function translateText(t: Text) {
  const v = t.nodeValue ?? '';
  if (!/[A-Za-z]/.test(v) || done.get(t) === v) return;
  // a typewriter in progress (the dialogue box types itself) is translated at its source instead
  if (t.parentElement?.closest('[data-noi18n]')) return;
  const out = tr(v);
  done.set(t, out);
  if (out !== v) t.nodeValue = out;
}

let observer: MutationObserver | null = null;
function startObserver() {
  if (observer || typeof MutationObserver === 'undefined') return;
  observer = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') translateText(m.target as Text);
      else for (const n of Array.from(m.addedNodes)) {
        if (n.nodeType === 3) translateText(n as Text);
        else if (n.nodeType === 1) translateTree(n);
      }
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true });
}
function stopObserver() { observer?.disconnect(); observer = null; }
