// The System tab: saving, save codes and backups, language, difficulty, controls, graphics, camera, sound and
// conversations.
import type { Game } from '../Game';
import { confirmDialog } from './Confirm';
import { backupName, saveTextFile } from '../core/Platform';
import { renderRecords, RecView } from './recordsTab';
import { ACHIEVEMENTS, fmtTime, records, rushBoss, rushPool, startRush } from '../rpg/Records';
import { DIFFICULTY } from '../core/Difficulty';
import { setLang } from '../core/i18n';
import { haptic } from '../core/Haptics';
import { LINES, LINE_BY_ID, QuestLine, RERUN_GOAL, lineReward, masteryReward } from '../rpg/Reruns';
import { drawAreaPreview, mapTextScale } from './AreaPreview';
import { copyText, el, escapeHtml, formatNum } from '../core/util';
import { itemIcon, skillIcon } from './Icons';
import { ENEMIES, GRADE_NAME } from '../rpg/enemies';
import { BG } from './Portraits';
import { ITEMS, RARITY_COLOR, RARITY_NAME, itemName, itemStats, formatStat, isGear, sellPrice, enhanceCost, makeItem, ItemBase, uniquesForLevel, SLOT_ORDER, SLOT_NAMES, KIND_NAME, CATEGORIES, sortItems, REFORGE_MAX, reforgeCost, reforgeStep, STAT_DESC, classRewardItem } from '../rpg/items';
import { Attr, ClassId, ItemInstance, ItemKind, Slot, StatKey, PCT_KEYS, STAT_LABEL } from '../rpg/types';
import { SKILLS, classSkills, SKILL_TYPES, SkillDef } from '../rpg/skills';
import { CLASSES, LEVEL_CAP, expToNext } from '../rpg/classes';
import { unlockedClasses } from '../rpg/Unlocks';
import { QUESTS, QUEST_BY_ID, NPC_SHORT } from '../data/story';
import { MAPS, TRAVEL_LIST, travelUnlocked } from '../world/maps';
import { getAtlas } from '../world/atlas';
import { audio } from '../audio/Audio';
import { music } from '../audio/Music';
import { INV_SIZE, objCount, PlayerState } from '../rpg/PlayerState';
import { voice, voiceFor } from '../audio/Voice';
import { DAILY_BOSSES, SIG_CHANCE, SIG_SEALS, dailyCleared, dailyLevel, dailyRoster, msToReset, setDailyPick } from '../rpg/Daily';
import { CHEAT_TOGGLES, CHEAT_ACTIONS, cheatOn, toggleCheat, runCheat } from '../rpg/Cheats';

export function renderSystem(game: Game) {
  const s = game.settings;
  const sl = (id: string, label: string, v: number) => `<label class="set"><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(v * 100)}" data-set="${id}"></label>`;
  const q = (v: string, l: string) => `<button class="chip ${s.quality === v ? 'on' : ''}" data-act="quality" data-q="${v}">${l}</button>`;
  const z = (v: number, l: string) => `<button class="chip ${s.zoom === v ? 'on' : ''}" data-act="zoom" data-z="${v}">${l}</button>`;
  const sh = (v: number, l: string) => `<button class="chip ${s.shake === v ? 'on' : ''}" data-act="shake" data-v="${v}">${l}</button>`;
  const ch = (key: 'voice' | 'textSpeed' | 'cutscenes' | 'hints' | 'barks' | 'sfxStyle' | 'difficulty' | 'vibration' | 'uiScale' | 'fxStyle' | 'calm' | 'textSize', v: string | number, l: string) => `<button class="chip ${(s as any)[key] === v ? 'on' : ''}" data-act="setchip" data-k="${key}" data-v="${v}">${l}</button>`;
  return `<div class="system">
    <div class="sys-col">
      <div class="panel-title">Game</div>
      <button class="btn primary wide" data-act="save">Save Game</button>
      <button class="btn wide" data-act="title">Save &amp; Return to Title</button>
      <button class="btn wide" data-act="exportsave">Copy Save Code</button><button class="btn wide" data-act="backupfile">Save backup file</button>
      <div class="help">The save code keeps your progress if you reinstall or change phones. Paste it under <b>Transfer Save</b> on the title screen.</div>
      <div class="help">Your own pictures, sounds and 3D models, and the update check, are in <b>Settings</b> on the title screen (<b>Save &amp; Return to Title</b>).</div>
      <div class="panel-title">Language · 言語</div>
      <div class="chips" data-noi18n><button class="chip ${s.lang !== 'ja' ? 'on' : ''}" data-act="lang" data-v="en">English</button><button class="chip ${s.lang === 'ja' ? 'on' : ''}" data-act="lang" data-v="ja">日本語</button></div>
      <div class="panel-title">Difficulty</div>
      <div class="chips">${ch('difficulty', 'easy', 'Easy')}${ch('difficulty', 'normal', 'Normal')}${ch('difficulty', 'hard', 'Hard')}</div>
      <div class="help">${DIFFICULTY[s.difficulty]?.about ?? ''} Curses already on the map keep their health until they respawn.</div>
      <div class="panel-title">Controls</div>
      <div class="set-label">Control size</div>
      <div class="chips">${ch('uiScale', 'auto', 'Auto')}${ch('uiScale', 0.9, 'Small')}${ch('uiScale', 1, 'Normal')}${ch('uiScale', 1.2, 'Large')}${ch('uiScale', 1.4, 'Huge')}</div>
      <div class="set-label">Vibration</div>
      <div class="chips">${ch('vibration', 'on', 'On')}${ch('vibration', 'off', 'Off')}</div>
      <div class="set-label">Text size</div>
      <div class="chips">${ch('textSize', 1, 'Normal')}${ch('textSize', 1.15, 'Large')}${ch('textSize', 1.3, 'Larger')}</div>
      <div class="set-label">Reduce flashing</div>
      <div class="chips">${ch('calm', 'off', 'Off')}${ch('calm', 'on', 'On')}</div>
      <div class="help">Auto makes the buttons larger on tablets. Vibration buzzes the phone (Android) and a controller's rumble.<br>Controller: left stick moves · A attack/talk · B dodge · X, Y, LB, RB, LT skills · RT ultimate · L3/R3 potions · Start menu · Select map. In conversations A advances and B skips back.</div>
      <div class="help">Touch: drag the left half of the screen to move. Tap or hold <b>攻</b> to attack (it becomes <b>話</b> to talk). Skills sit around it, <b>回避</b> dodges, the gold-rimmed button is your Ultimate.<br>Keyboard: WASD move · J/Space attack · 1–5 skills · R ultimate · Shift dodge · Q/E potions · F talk · I/K/L/M menus · Esc close.</div>
    </div>
    <div class="sys-col">
      <div class="panel-title">Audio</div>
      ${sl('music', 'Music', s.music)}${sl('sfx', 'Effects', s.sfx)}${sl('amb', 'Ambience', s.amb)}
      <div class="set-label">Sound effects</div>
      <div class="chips">${ch('sfxStyle', 'recorded', 'Recorded')}${ch('sfxStyle', 'synth', 'Synthesised')}</div>
      <div class="help">Recorded: real hits, footsteps, blades, coins and menu clicks (Kenney's free CC0 sound packs) layered with the game's own synthesised sounds. Cursed techniques are always synthesised. Any sound can be swapped for your own in <b>Settings</b> on the title screen.</div>
      <div class="panel-title">Graphics</div>
      <div class="chips">${q('low', 'Low')}${q('medium', 'Medium')}${q('high', 'High')}</div>
      <div class="panel-title">Camera</div>
      <div class="chips">${z(0.8, 'Near')}${z(1, 'Normal')}${z(1.25, 'Far')}</div>
      <div class="set-label">Effects</div>
      <div class="chips">${ch('fxStyle', 'toon', 'Toon')}${ch('fxStyle', 'pixel', 'Pixel')}</div>
      <div class="panel-title">Screen shake</div>
      <div class="chips">${sh(0, 'Off')}${sh(0.5, 'Light')}${sh(1, 'Full')}</div>
      <div class="panel-title">Dialogue</div>
      <div class="set-label">Voices</div>
      <div class="chips">${ch('voice', 'gen', 'Character voices')}${ch('voice', 'tts', 'Spoken (phone TTS)')}${ch('voice', 'off', 'Blips')}</div>
      ${sl('voiceVol', 'Voice volume', s.voiceVol)}
      <div class="set-label">Combat voices</div>
      <div class="chips">${ch('barks', 'on', 'On')}${ch('barks', 'off', 'Off')}</div>
      <div class="set-label">Text speed</div>
      <div class="chips">${ch('textSpeed', 0.6, 'Slow')}${ch('textSpeed', 1, 'Normal')}${ch('textSpeed', 1.7, 'Fast')}</div>
      <div class="set-label">Cutscenes</div>
      <div class="chips">${ch('cutscenes', 'full', 'Full')}${ch('cutscenes', 'short', 'Short')}${ch('cutscenes', 'off', 'Off')}</div>
      <div class="set-label">Quest hints</div>
      <div class="chips">${ch('hints', 'on', 'When I\'m stuck')}${ch('hints', 'off', 'Off')}</div>
      <div class="help">Spoken voices use your phone's text-to-speech engine; if it isn't available the character voices are used. Tap AUTO in a conversation to let lines advance by themselves, or SKIP to fast-forward.</div>
      <div class="credits">Cursed Chronicles is an unofficial, non-commercial fan game inspired by Jujutsu Kaisen and Zenonia. Characters, music and cursed-technique sounds are procedurally generated. Recorded sound effects: Kenney (www.kenney.nl), ognomo and SquigglyFish (itch.io), CC0. Street props: PSX Japanese Town Kit Free by heyheythere - https://heyheythere.itch.io/psx-japanese-town-kit-free - CC BY 4.0. Effects: PVFX Foundry by nerijs (itch.io), CC0. Jujutsu Kaisen © Gege Akutami / Shueisha.</div>
    </div>
  </div>`;
}
