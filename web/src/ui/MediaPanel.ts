// The player's own pictures, sounds and 3D models. Since 1.7.9 this lives in Settings on the title screen
// (the main menu), not in the in-game System tab. The panel renders into any container and handles its
// own taps: choosing files from the phone, trying a sound, resetting a slot. A model is read straight
// away and worn by the characters it belongs to the next time they appear.

import type { Game } from '../Game';
import { media, ART_SLOTS, SOUND_SLOTS, MUSIC_SLOTS } from '../core/CustomMedia';
import { customModels, MODEL_MAX_BYTES } from '../render/models/imported';
import { audio } from '../audio/Audio';
import { escapeHtml } from '../core/util';

export class MediaPanel {
  private art = 'yuji';
  private model = 'yuji';
  /** the last result, shown at the top of the panel (toasts sit under the title screen) */
  private msg: { text: string; warn: boolean } | null = null;

  constructor(private game: Game, private host: HTMLElement, private onBack: () => void) {}

  render() {
    const list = this.host.querySelector('.shop-list') as HTMLElement | null;
    const scroll = list?.scrollTop ?? 0;
    this.host.innerHTML = this.html();
    const next = this.host.querySelector('.shop-list') as HTMLElement | null;
    if (next) next.scrollTop = scroll;
    this.bind();
  }

  private say(text: string, warn = false) {
    this.msg = { text, warn };
    this.game.toast(text, warn ? 'warn' : 'good', warn ? 3 : 1.8);
  }

  private html() {
    const opt = ART_SLOTS.map(a => `<option value="${a.id}" ${a.id === this.art ? 'selected' : ''}>${escapeHtml(a.label)}${media.has('art:' + a.id) ? ' ★' : ''}</option>`).join('');
    const pic = this.game.portraits.get(this.art);
    const has = media.has('art:' + this.art);
    const row = (key: string, label: string, test: boolean) => `<div class="shop-row"><div class="sr-info"><b>${escapeHtml(label)}</b><small>${media.has(key) ? 'Your file' : 'Built-in'}</small></div>
      ${test && media.has(key) ? `<button class="btn small" data-act="mediatest" data-key="${key}">Play</button>` : ''}
      <button class="btn small primary" data-pick="${key}" data-accept="audio/*">Choose…</button>
      ${media.has(key) ? `<button class="btn small" data-act="mediaclear" data-key="${key}">Reset</button>` : ''}</div>`;
    const off = !media.available ? '<div class="cheat-note">Storage for your own files isn\'t available on this device.</div>' : '';
    // 3D models: any character with a humanoid body (Dagon's isn't)
    const mid = this.model, mHas = media.has('model:' + mid);
    const mopt = ART_SLOTS.filter(a => a.id !== 'dagon').map(a => `<option value="${a.id}" ${a.id === mid ? 'selected' : ''}>${escapeHtml(a.label)}${media.has('model:' + a.id) ? ' ★' : ''}</option>`).join('');
    const mInfo = customModels.info(mid), mErr = customModels.errors.get(mid);
    const mStatus = customModels.loading(mid) ? 'Reading the model…'
      : mErr ? `<span class="warn">${escapeHtml(mErr)}</span>`
      : mInfo ? escapeHtml(mInfo.summary) + (mInfo.triangles > 150000 ? '<br><span class="warn">That is a heavy model for a phone: the game may slow down where it appears.</span>' : '')
      : 'Built-in model.';
    const models = `<div class="panel-title">3D character models</div>
        <div class="media-art"><div class="media-pic" style="background-image:url(${this.game.portraits.get(mid)})"></div>
          <div class="media-art-ctrl"><select class="media-msel">${mopt}</select>
          <div class="hint">${mStatus}</div>
          <div><button class="btn small primary" data-pick="model:${mid}" data-accept=".glb,.gltf,.vrm,.fbx,.zip,.bin,.png,.jpg,.jpeg,.webp" data-multiple="1">Choose model…</button>${mHas ? `<button class="btn small" data-act="mediaclear" data-key="model:${mid}">Reset</button>` : ''}</div></div></div>
        <div class="help">GLB / glTF, VRM or FBX, or the .zip a model download comes in (a glTF with separate textures can be picked together with them). A rigged humanoid (Mixamo, VRoid/VRM, Unity, Blender, MMD, Daz, Character Creator) moves with the game's own animations for every attack and skill, and its own idle, walk and run clips play when it has them. A model without a skeleton is shown as a statue. Up to ${Math.round(MODEL_MAX_BYTES / 1048576)} MB.</div>`;
    const note = this.msg ? `<div class="media-msg ${this.msg.warn ? 'warn' : ''}">${escapeHtml(this.msg.text)}</div>` : '';
    return `<div class="shop media"><div class="shop-head"><div><div class="id-name">Your Pictures, Sounds &amp; Models</div>
      <div class="id-sub">Pick pictures, audio and 3D models from your phone to use in your copy of the game. They stay on this phone and are never shared. Only use files you have the right to use.</div></div></div>${off}${note}
      <div class="shop-list">
        ${models}
        <div class="panel-title">Character pictures</div>
        <div class="media-art"><div class="media-pic" style="background-image:url(${pic})"></div>
          <div class="media-art-ctrl"><select class="media-sel">${opt}</select>
          <div class="hint">Replaces this character's portrait and dialogue art.</div>
          <div><button class="btn small primary" data-pick="art:${this.art}" data-accept="image/*">Choose picture…</button>${has ? `<button class="btn small" data-act="mediaclear" data-key="art:${this.art}">Reset</button>` : ''}</div></div></div>
        <div class="panel-title">Sound effects</div>
        <div class="help">Short clips (a punch, a step) can play over each other; longer ones (a shout, a jingle) aren't cut off by the next.</div>
        ${(['Big moments', 'Combat', 'World and menus'] as const).map(gp => `<div class="set-label">${gp}</div>${SOUND_SLOTS.filter(sl => sl.group === gp).map(sl => row('sfx:' + sl.id, sl.label, true)).join('')}`).join('')}
        <div class="panel-title">Music</div>${MUSIC_SLOTS.map(sl => row('music:' + sl.id, sl.label, false)).join('')}
      </div>
      <button class="tbtn back" data-act="mediaback">Back</button></div>`;
  }

  private bind() {
    const h = this.host;
    const sel = h.querySelector('.media-sel') as HTMLSelectElement | null;
    sel?.addEventListener('change', () => { this.art = sel.value; this.msg = null; this.render(); });
    const msel = h.querySelector('.media-msel') as HTMLSelectElement | null;
    msel?.addEventListener('change', () => { this.model = msel.value; this.msg = null; this.render(); });
    h.onclick = (e) => {
      const t = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
      if (!t) return;
      const key = t.dataset.key ?? '';
      switch (t.dataset.act) {
        case 'mediaback': audio.play('click'); this.onBack(); return;
        case 'mediatest':
          if (key === 'sfx:step') audio.step('stone');
          else if (key.startsWith('sfx:')) audio.play(key.slice(4));
          return;
        case 'mediaclear':
          void media.remove(key).then(() => {
            if (key.startsWith('model:')) { const id = key.slice(6); customModels.forget(id); this.game.world.refreshModels(id); this.game.ui.hud?.refreshPortrait(); }
            audio.play('tab');
            this.msg = { text: 'Back to the built-in one.', warn: false };
            this.render();
          });
          return;
      }
    };
    for (const b of Array.from(h.querySelectorAll('[data-pick]')) as HTMLElement[]) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = b.dataset.pick!;
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = b.dataset.accept!;
        inp.multiple = !!b.dataset.multiple;
        // kept in the page while the phone's picker is open (some WebViews ignore detached inputs)
        inp.style.cssText = 'position:fixed;left:-9999px;opacity:0';
        document.body.appendChild(inp);
        // a cancelled picker never fires change: tidy up once the game has focus again
        window.addEventListener('focus', () => setTimeout(() => inp.remove(), 2000), { once: true });
        inp.onchange = async () => {
          const files = Array.from(inp.files ?? []);
          const f = files[0];
          inp.remove();
          if (!f) return;
          try {
            if (key.startsWith('model:')) await this.useModel(key.slice(6), files);
            else {
              if (key.startsWith('art:')) await media.setImage(key.slice(4), f);
              else await media.setSound(key, f);
              audio.play('equip');
              this.say('Saved on this phone.');
            }
          } catch (err) {
            audio.play('error');
            this.say((err as Error).message || 'That file could not be used.', true);
          }
          this.render();
        };
        inp.click();
      });
    }
  }

  /** Stores and reads a 3D model for character `id`, then puts it on whoever is that character right now. */
  private async useModel(id: string, files: File[]) {
    await media.setModel(id, files, MODEL_MAX_BYTES);
    const job = customModels.load(id);
    this.msg = null;
    this.render();
    const t = await job;
    if (!t) {
      const why = customModels.errors.get(id) ?? 'That model could not be read.';
      await media.remove('model:' + id);
      throw new Error(why);
    }
    this.game.world.refreshModels(id);
    this.game.ui.hud?.refreshPortrait();
    audio.play('equip');
    const name = ART_SLOTS.find(a => a.id === id)?.label ?? id;
    this.say(t.rigged ? `${name} now wears your model.` : `${name} now uses your model (no skeleton found, so it stands like a statue).`);
  }
}
