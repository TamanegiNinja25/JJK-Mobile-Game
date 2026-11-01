// The player's own pictures and sounds, picked from their phone and kept on it (IndexedDB). Nothing here
// ships with the game: it lets someone dress up their copy with art or clips they already have. A
// picture replaces a character's portrait and dialogue art; a sound replaces one of the big moments'
// effects; a song replaces the music of one kind of place.

export const ART_SLOTS: { id: string; label: string }[] = [
  { id: 'yuji', label: 'Yuji Itadori' }, { id: 'megumi', label: 'Megumi Fushiguro' }, { id: 'nobara', label: 'Nobara Kugisaki' },
  { id: 'gojo', label: 'Satoru Gojo' }, { id: 'sukuna', label: 'Ryomen Sukuna' }, { id: 'sukunaYuji', label: 'Sukuna (Yuji\'s body)' },
  { id: 'sukunaMegumi', label: 'Sukuna (Megumi\'s body)' }, { id: 'heianSukuna', label: 'Heian Sukuna' }, { id: 'moduloYuji', label: 'Modulo Yuji' },
  { id: 'nanami', label: 'Kento Nanami' }, { id: 'maki', label: 'Maki Zen\'in' }, { id: 'panda', label: 'Panda' }, { id: 'inumaki', label: 'Toge Inumaki' },
  { id: 'yaga', label: 'Masamichi Yaga' }, { id: 'shoko', label: 'Shoko Ieiri' }, { id: 'ijichi', label: 'Kiyotaka Ijichi' }, { id: 'todo', label: 'Aoi Todo' },
  { id: 'yuta', label: 'Yuta Okkotsu' }, { id: 'meimei', label: 'Mei Mei' }, { id: 'nitta', label: 'Akari Nitta' }, { id: 'mahito', label: 'Mahito' },
  { id: 'jogo', label: 'Jogo' }, { id: 'hanami', label: 'Hanami' }, { id: 'dagon', label: 'Dagon' }, { id: 'choso', label: 'Choso' },
  { id: 'kenjaku', label: 'Kenjaku' }, { id: 'naoya', label: 'Naoya Zen\'in' }, { id: 'hakari', label: 'Kinji Hakari' }, { id: 'higuruma', label: 'Hiromi Higuruma' },
  { id: 'kashimo', label: 'Hajime Kashimo' }, { id: 'ishigori', label: 'Ryu Ishigori' }, { id: 'uraume', label: 'Uraume' }, { id: 'toji', label: 'Toji Fushiguro' },
  { id: 'geto', label: 'Suguru Geto' }, { id: 'tengen', label: 'Tengen' },
];

/** Sound effects a player can swap: the game's effect name and how the menu calls it. */
export const SOUND_SLOTS: { id: string; label: string }[] = [
  { id: 'domain', label: 'Domain Expansion' }, { id: 'blackflash', label: 'Black Flash' }, { id: 'dismantle', label: 'Dismantle / Cleave' },
  { id: 'roar', label: 'A boss appears' }, { id: 'bossDie', label: 'Boss exorcised' }, { id: 'levelup', label: 'Level up' }, { id: 'questDone', label: 'Quest complete' },
];

/** Music a player can swap, by kind of place. */
export const MUSIC_SLOTS: { id: string; label: string }[] = [
  { id: 'title', label: 'Title screen' }, { id: 'town', label: 'Jujutsu High' }, { id: 'field', label: 'Missions and open areas' },
  { id: 'boss', label: 'Boss fights' }, { id: 'domain', label: 'Domain Expansion' },
];

/** Which music slot a zone theme falls under. */
export function musicSlot(theme: string) {
  if (theme === 'title' || theme === 'domain') return theme;
  if (theme === 'boss' || theme === 'finalBoss') return 'boss';
  if (theme === 'hub') return 'town';
  return 'field';
}

const DB_NAME = 'cursedChronicles.media';
const STORE = 'media';

class MediaStore {
  private db: IDBDatabase | null = null;
  /** character id -> picture (data URL) */
  images = new Map<string, string>();
  /** 'sfx:<name>' / 'music:<slot>' -> the file as stored, and decoded once audio is running */
  private raw = new Map<string, ArrayBuffer>();
  private buffers = new Map<string, AudioBuffer>();
  private ctx: BaseAudioContext | null = null;
  /** bumped on every change, so caches built from these files know to refresh */
  version = 0;
  onChange: (() => void) | null = null;

  async init() {
    if (typeof indexedDB === 'undefined') return;
    try {
      this.db = await new Promise<IDBDatabase>((res, rej) => {
        const r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE);
        r.onsuccess = () => res(r.result);
        r.onerror = () => rej(r.error);
      });
      const all = await this.tx<[string, any][]>('readonly', (st, done) => {
        const out: [string, any][] = [];
        const cur = st.openCursor();
        cur.onsuccess = () => { const c = cur.result; if (c) { out.push([String(c.key), c.value]); c.continue(); } else done(out); };
      });
      for (const [k, v] of all) {
        if (k.startsWith('art:') && typeof v === 'string') this.images.set(k.slice(4), v);
        else if (v instanceof ArrayBuffer) this.raw.set(k, v);
      }
      this.version++;
    } catch { this.db = null; }
  }

  private tx<T>(mode: IDBTransactionMode, fn: (st: IDBObjectStore, done: (v: T) => void) => void): Promise<T> {
    return new Promise((res, rej) => {
      if (!this.db) { rej(new Error('no storage')); return; }
      const t = this.db.transaction(STORE, mode);
      t.onerror = () => rej(t.error);
      fn(t.objectStore(STORE), res);
    });
  }

  private put(key: string, value: unknown) { return this.tx<void>('readwrite', (st, done) => { st.put(value, key).onsuccess = () => done(); }); }
  private del(key: string) { return this.tx<void>('readwrite', (st, done) => { st.delete(key).onsuccess = () => done(); }); }

  get available() { return !!this.db; }

  /** Store a picture for a character, shrunk to at most 720 px so it stays light. */
  async setImage(id: string, file: File) {
    const url = await new Promise<string>((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = () => rej(fr.error); fr.readAsDataURL(file); });
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('not an image')); i.src = url; });
    const k = Math.min(1, 720 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    const out = c.toDataURL('image/jpeg', 0.86);
    await this.put('art:' + id, out);
    this.images.set(id, out);
    this.changed();
  }

  /** Store a sound effect ('sfx:<name>') or song ('music:<slot>'). */
  async setSound(key: string, file: File) {
    if (file.size > 12 * 1024 * 1024) throw new Error('That file is over 12 MB. Try a shorter clip.');
    const buf = await file.arrayBuffer();
    if (this.ctx) this.buffers.set(key, await this.ctx.decodeAudioData(buf.slice(0)));
    await this.put(key, buf);
    this.raw.set(key, buf);
    this.changed();
  }

  async remove(key: string) {
    await this.del(key);
    if (key.startsWith('art:')) this.images.delete(key.slice(4));
    this.raw.delete(key);
    this.buffers.delete(key);
    this.changed();
  }

  has(key: string) { return key.startsWith('art:') ? this.images.has(key.slice(4)) : this.raw.has(key); }

  /** Decode stored sounds once the audio context exists (it needs a tap first on phones). */
  async attach(ctx: BaseAudioContext) {
    this.ctx = ctx;
    for (const [k, v] of this.raw) {
      if (this.buffers.has(k)) continue;
      try { this.buffers.set(k, await ctx.decodeAudioData(v.slice(0))); } catch { /* a file the phone can't play is skipped */ }
    }
  }

  buffer(key: string) { return this.buffers.get(key) ?? null; }

  private changed() { this.version++; this.onChange?.(); }
}

export const media = new MediaStore();
