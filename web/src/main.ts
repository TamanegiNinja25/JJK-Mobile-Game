// Entry point.
import { LINES } from './rpg/Reruns';
import { confirmDialog } from './ui/Confirm';
import { updates } from './core/Updates';
import { initWebApp } from './core/Platform';
import { loadTownKit } from './render/models/townKit';
import { getAtlas } from './world/atlas';
import { Game } from './Game';
import { skillIcon, itemIcon } from './ui/Icons';
import { SKILLS } from './rpg/skills';
import { ITEMS, makeItem } from './rpg/items';
import { audio } from './audio/Audio';
import { media } from './core/CustomMedia';
import { QUESTS } from './data/story';
import { MAPS, TRAVEL_LIST } from './world/maps';
import { ENEMIES } from './rpg/enemies';
import { CLASSES } from './rpg/classes';
import { samples, SAMPLES, STEPS } from './audio/Samples';
import { customModels, withCustomModel } from './render/models/imported';
import { buildCharacter } from './render/models/characters';
import { wrapHumanoid } from './render/models/model';
import * as THREE from 'three';

function showFatal(msg: string) {
  const d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;background:rgba(80,0,10,.92);color:#fff;font:12px monospace;padding:8px;border-radius:6px;white-space:pre-wrap;max-height:40vh;overflow:auto';
  d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => d.remove(), 12000);
}

window.addEventListener('error', (e) => showFatal('Error: ' + (e.error?.stack ?? e.message)));
window.addEventListener('unhandledrejection', (e) => showFatal('Promise: ' + (e.reason?.stack ?? e.reason)));
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

// the player's own pictures, sounds and 3D models load in the background
void media.init().then(() => customModels.loadAll()).then(() => game.onCustomModels());
initWebApp();
const game = new Game();
(window as any).game = game;
// the street-prop kit is read before the first map is built (a few small local files; never waits long)
void Promise.race([loadTownKit(), new Promise(r => setTimeout(r, 4000))]).then(() => game.start());

// debugging/test hooks
(window as any).__dbg = { atlas: getAtlas, skillIcon, itemIcon, SKILLS, ITEMS, audio, QUESTS, MAPS, TRAVEL_LIST, ENEMIES, CLASSES, makeItem, confirmDialog, updates, LINES, samples, SAMPLES, STEPS, media, customModels,
  mk: (id: string) => withCustomModel(id, wrapHumanoid(buildCharacter(id))), THREE };
