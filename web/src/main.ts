// Entry point.
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

// the player's own pictures and sounds load in the background
void media.init();
const game = new Game();
(window as any).game = game;
game.start();

// debugging/test hooks
(window as any).__dbg = { atlas: getAtlas, skillIcon, itemIcon, SKILLS, ITEMS, audio, QUESTS, MAPS, TRAVEL_LIST, ENEMIES, CLASSES, makeItem };
