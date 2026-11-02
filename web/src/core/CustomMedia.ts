// The player's own pictures, sounds and 3D models, picked from their phone and kept on it (IndexedDB).
// Nothing here ships with the game: it lets someone dress up their copy with art, clips or models they
// already have. A picture replaces a character's portrait and dialogue art; a sound replaces one of the
// game's effects; a song replaces the music of one kind of place; a 3D model replaces how a character
// looks (render/models/imported.ts reads it and makes the game's animation drive it).

/** One file of a picked 3D model (a model can come with separate textures or a .bin). */
export interface ModelFile { name: string; data: ArrayBuffer }

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

/** Sound effects a player can swap: the game's effect name, how the menu calls it, and its group. */
export const SOUND_SLOTS: { id: string; label: string; group: 'Big moments' | 'Combat' | 'World and menus' }[] = [
  { id: 'domain', label: 'Domain Expansion', group: 'Big moments' }, { id: 'blackflash', label: 'Black Flash', group: 'Big moments' },
  { id: 'dismantle', label: 'Dismantle / Cleave', group: 'Big moments' }, { id: 'roar', label: 'A boss appears', group: 'Big moments' },
  { id: 'bossDie', label: 'Boss exorcised', group: 'Big moments' }, { id: 'levelup', label: 'Level up', group: 'Big moments' },
  { id: 'questDone', label: 'Quest complete', group: 'Big moments' }, { id: 'questAccept', label: 'Quest accepted', group: 'Big moments' },
  { id: 'punch', label: 'Punch', group: 'Combat' }, { id: 'kick', label: 'Kick', group: 'Combat' }, { id: 'hit', label: 'A blow lands', group: 'Combat' },
  { id: 'crit', label: 'Critical hit', group: 'Combat' }, { id: 'slash', label: 'Blade slash', group: 'Combat' }, { id: 'swing', label: 'Swing (whoosh)', group: 'Combat' },
  { id: 'swingHeavy', label: 'Heavy swing', group: 'Combat' }, { id: 'dash', label: 'Dash / dodge', group: 'Combat' }, { id: 'block', label: 'Block', group: 'Combat' },
  { id: 'hurt', label: 'You get hurt', group: 'Combat' }, { id: 'curseDie', label: 'Curse exorcised', group: 'Combat' }, { id: 'heal', label: 'Healing', group: 'Combat' },
  { id: 'step', label: 'Footsteps', group: 'World and menus' }, { id: 'land', label: 'Landing', group: 'World and menus' }, { id: 'door', label: 'Door', group: 'World and menus' },
  { id: 'portal', label: 'Travel gate', group: 'World and menus' }, { id: 'pickup', label: 'Item picked up', group: 'World and menus' }, { id: 'coin', label: 'Coins', group: 'World and menus' },
  { id: 'equip', label: 'Equip', group: 'World and menus' }, { id: 'click', label: 'Menu tap', group: 'World and menus' }, { id: 'open', label: 'Menu opens', group: 'World and menus' },
  { id: 'close', label: 'Menu closes', group: 'World and menus' }, { id: 'error', label: 'Not allowed', group: 'World and menus' }, { id: 'save', label: 'Game saved', group: 'World and menus' },
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
  /** character id -> the files of their 3D model, as picked */
  private models = new Map<string, { name: string; files: ModelFile[] }>();
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
        else if (k.startsWith('model:') && v && Array.isArray(v.files)) this.models.set(k.slice(6), { name: String(v.name ?? 'model'), files: v.files });
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

  /**
   * Store a 3D model for a character: one file (.glb, .vrm, .fbx, a .zip of a glTF) or a glTF with its
   * .bin and textures picked together. `max` is the size limit in bytes.
   */
  async setModel(id: string, files: File[], max: number) {
    const size = files.reduce((n, f) => n + f.size, 0);
    if (size > max) throw new Error(`That is ${Math.round(size / 1048576)} MB; models can be up to ${Math.round(max / 1048576)} MB. Try a lighter version (fewer polygons, smaller textures).`);
    const rec = { name: files.map(f => f.name).join(', ').slice(0, 120), files: await Promise.all(files.map(async f => ({ name: f.name, data: await f.arrayBuffer() }))) };
    try {
      await this.put('model:' + id, rec);
    } catch (e) {
      const quota = /quota|space|full/i.test(String((e as Error)?.name) + String((e as Error)?.message));
      throw new Error(!this.db ? 'Storage for your own files isn\'t available on this device.'
        : quota ? 'There isn\'t room on this phone for that model. Free some space, or try a lighter version of it.' : 'That model couldn\'t be saved on this phone.');
    }
    this.models.set(id, rec);
    this.changed();
  }

  model(id: string) { return this.models.get(id) ?? null; }
  modelIds() { return [...this.models.keys()]; }

  async remove(key: string) {
    await this.del(key);
    if (key.startsWith('model:')) this.models.delete(key.slice(6));
    if (key.startsWith('art:')) this.images.delete(key.slice(4));
    this.raw.delete(key);
    this.buffers.delete(key);
    this.changed();
  }

  has(key: string) { return key.startsWith('art:') ? this.images.has(key.slice(4)) : key.startsWith('model:') ? this.models.has(key.slice(6)) : this.raw.has(key); }

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
