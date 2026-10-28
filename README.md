<div align="center">

<img src="docs/icon.png" width="128" alt="Cursed Chronicles icon">

# Cursed Chronicles

**呪術年代記 — a Zenonia-style action RPG for Android, set in the world of Jujutsu Kaisen**

[![Latest release](https://img.shields.io/github/v/release/TamanegiNinja25/JJK-Mobile-Game?label=release&color=8A2BE2)](https://github.com/TamanegiNinja25/JJK-Mobile-Game/releases/latest)
[![Build APK](https://github.com/TamanegiNinja25/JJK-Mobile-Game/actions/workflows/build-apk.yml/badge.svg)](https://github.com/TamanegiNinja25/JJK-Mobile-Game/actions/workflows/build-apk.yml)
![Android 7.0+](https://img.shields.io/badge/Android-7.0%2B-3DDC84?logo=android&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![three.js](https://img.shields.io/badge/three.js-r185-000000?logo=threedotjs&logoColor=white)
![Offline](https://img.shields.io/badge/runs-100%25%20offline-8A2BE2)

<img src="docs/screenshots/title.jpg" width="820" alt="Title screen">

### [⬇ Download CursedChronicles.apk](https://github.com/TamanegiNinja25/JJK-Mobile-Game/releases/latest/download/CursedChronicles.apk)

<sub>Latest release · Android 7.0+ · about 1.6 MB · <a href="https://github.com/TamanegiNinja25/JJK-Mobile-Game/releases">all releases</a> · <a href="CHANGELOG.md">changelog</a></sub>

</div>

Play as Yuji, Megumi or Nobara and fight through the story from the Sugisawa High
rooftop, through the Shibuya Incident and the Culling Game, to the Shinjuku Showdown. Combat is real-time with combos, skills, dodges and
Black Flashes, wrapped in a classic Zenonia-style RPG loop: quests, loot, stat points,
skill trees, gear upgrades and boss fights. Schools, cinemas and stations can be
entered, and their halls are laid out fresh every time you walk in.

Every model, building, texture, icon, portrait, music track and sound effect is
generated in code. The game ships no art or audio files, so the APK is under 2 MB
and runs without an internet connection.

> [!NOTE]
> This is an unofficial, non-commercial fan game. It is not affiliated with or
> endorsed by Gege Akutami, Shueisha or MAPPA. Jujutsu Kaisen and its characters
> belong to their respective owners.

## Contents

- [Screenshots](#screenshots)
- [Download](#download)
- [Features](#features)
- [Controls](#controls)
- [Building from source](#building-from-source)
- [How it works](#how-it-works)
- [Project layout](#project-layout)
- [License](#license)

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/class-select.jpg" alt="Class select"><br><sub><b>Choose your sorcerer</b>: three classes, each with its own skill tree</sub></td>
    <td width="50%"><img src="docs/screenshots/jujutsu-high.jpg" alt="Jujutsu High"><br><sub><b>Tokyo Jujutsu High</b>: the hub, with shops, quests and fast travel</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/interior.jpg" alt="Sugisawa High corridors"><br><sub><b>Enterable buildings</b>: Sugisawa High's corridors, rebuilt on every visit</sub></td>
    <td><img src="docs/screenshots/cinema.jpg" alt="Kawasaki cinema"><br><sub><b>The Kawasaki cinema</b>, where Mahito's victims were found</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/combat-megumi.jpg" alt="Megumi in combat"><br><sub><b>Megumi</b> fights alongside his shikigami</sub></td>
    <td><img src="docs/screenshots/combat-yuji.jpg" alt="Yuji in combat"><br><sub><b>Yuji</b> brawls through the Eishu detention yard</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/kyoto.jpg" alt="Kyoto forest"><br><sub><b>Kyoto Goodwill Event</b>: the forest where Hanami hides</sub></td>
    <td><img src="docs/screenshots/dialogue.jpg" alt="Dialogue"><br><sub><b>Story dialogue</b> with portraits, voice blips and choices</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/boss.jpg" alt="Sukuna boss fight"><br><sub><b>Boss fights</b> with telegraphed attacks and phases</sub></td>
    <td><img src="docs/screenshots/domain.jpg" alt="Malevolent Shrine"><br><sub><b>Domain Expansion</b>: sure-hit damage until you break it</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/domain-clash.jpg" alt="Domain clash"><br><sub><b>Domain clash</b>: cast your ultimate inside an enemy domain to shatter it</sub></td>
    <td><img src="docs/screenshots/choso.jpg" alt="Choso boss fight"><br><sub><b>Choso</b> guards the Prison Realm on Shibuya Station's B5F platform</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/skills.jpg" alt="Skills menu"><br><sub><b>Skills</b>: actives, buffs, passives, reactions and an ultimate, with a quick bar</sub></td>
    <td><img src="docs/screenshots/bag.jpg" alt="Bag"><br><sub><b>Bag</b>: six equipment slots, items grouped by category</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/tracking.jpg" alt="Quest tracking"><br><sub><b>Quest tracking</b>: a ground arrow, the tracker and a minimap ◆ lead to the objective</sub></td>
    <td><img src="docs/screenshots/map.jpg" alt="World map"><br><sub><b>Map</b>: tap an area to travel; ⛩ travel points, ▣ enterable buildings, ◆ objective</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/eso.jpg" alt="Eso at Yasohachi Bridge"><br><sub><b>Death Painting</b>: Eso's Rot Technique on the banks of Yasohachi Bridge</sub></td>
    <td><img src="docs/screenshots/naoya.jpg" alt="Naoya Zen'in"><br><sub><b>Naoya Zen'in</b> plans his 24-frame path, then runs it. Step off the lines</sub></td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/higuruma.jpg" alt="Deadly Sentencing"><br><sub><b>Deadly Sentencing</b>: lose Higuruma's trial and your techniques are confiscated</sub></td>
    <td><img src="docs/screenshots/sukuna-true.jpg" alt="Sukuna's true form"><br><sub><b>Shinjuku Showdown</b>: Sukuna's true form, World-Cutting Slash inside the Shrine</sub></td>
  </tr>
  <tr>
    <td colspan="2" align="center"><img src="docs/screenshots/reforge.jpg" alt="Mechamaru's reforge" width="50%"><br><sub><b>Mechamaru's Reforge</b>: +10 gear on to +30, every stat change explained</sub></td>
  </tr>
</table>

## Download

1. Download [**CursedChronicles.apk**](https://github.com/TamanegiNinja25/JJK-Mobile-Game/releases/latest/download/CursedChronicles.apk) from the
   [latest release](https://github.com/TamanegiNinja25/JJK-Mobile-Game/releases/latest).
   Every successful
   [build](https://github.com/TamanegiNinja25/JJK-Mobile-Game/actions/workflows/build-apk.yml)
   also has the APKs under its **CursedChronicles-apk** artifact.
2. On your phone, allow **Install unknown apps** for your browser or file manager, then
   open the APK.

**Updating:** from v1.2.0 on, every release is signed with the same key, so a new APK
(such as 1.3.1 over 1.3.0) installs straight over the old one and keeps your saves. What
changed in each version is in [CHANGELOG.md](CHANGELOG.md). Versions 1.0.0 and 1.1.0 were
each signed with a one-off key, so moving from those needs one uninstall first. Before
uninstalling anything, you can keep your progress with **System → Copy Save Code** (from
1.2.0 on) and paste it back under **Transfer Save** on the title screen.

Requirements: Android 7.0 (API 24) or newer with OpenGL ES 3.0. The game plays in
landscape. If the frame rate stays low, it lowers the graphics quality automatically;
you can also set it under **System**, along with camera distance and screen shake
(Off / Light / Full).

## Features

### Three sorcerers

| | Style | Signature skills | Ultimate |
|---|---|---|---|
| **Yuji Itadori** | Close-range brawler with the best Black Flash odds | Divergent Fist · Manji Kick · Black Flash · Piercing Blood · Supernova · Dismantle | King of Curses: Malevolent Shrine |
| **Megumi Fushiguro** | Shikigami summoner and swordsman | Divine Dogs · Nue · Max Elephant · Great Serpent · Piercing Ox · Divine Dog: Totality | Domain Expansion: Chimera Shadow Garden |
| **Nobara Kugisaki** | Mid-range nails, hammer and Resonance | Hairpin · Resonance · Straw Doll Curse · Nail Lance · Chain Resonance · Blood Resonance | Resonance: Thousand Nails |

Each class has about twenty techniques of five kinds:

- **Active:** attacks, summons and movement skills on the quick bar.
- **Buff:** timed boosts such as Cursed Energy Surge, Round Deer or Steady Aim.
- **Passive:** always-on bonuses.
- **Reaction:** triggers by itself when you are hit, land a kill or drop to low HP
  (Counter Stance, Loyal Hounds, Final Nail and more).
- **Ultimate:** spends a full domain gauge.

Every level gives 10 stat points (STR, DEX, VIT, CE) and 1 skill point, up to level 100.
After the main story, curses everywhere grow with you, and Awakened (Lv 55) and
Sovereign (Lv 80) gear starts dropping.

### The RPG loop

- **Combat:** combo chains, dodge with invulnerability frames, five skill slots, an
  ultimate and two potion slots.
- **Black Flash:** a ×2.5 critical with hit-stop. It fills your domain gauge and grants
  a short "zone" buff.
- **Loot:** four rarities (Common, Graded, Special Grade, Cursed Tool) with random
  bonus stats. Gear fills six slots: weapon, headgear, uniform, charm, accessory and
  shoes. The bag and the shops group items by category.
- **Infusion:** Yaga's workshop upgrades gear from +1 to +10. Higher levels can fail
  and drop a level.
- **Reforge:** Mechamaru, by the storehouse at Jujutsu High, takes +10 gear on to +30.
  Each step adds one tuned bonus for that slot (a weapon cycles Attack %, Crit Rate,
  Crit Damage, Skill Power and Black Flash), with bigger milestones at +20 and +30. The
  screen shows every stat before and after, with what each stat does.
- **Quest tracking:** pick any active quest in the log (or tap the tracker to cycle) and
  it follows you on the HUD. A gold arrow on the ground, a ◆ on the minimap and a
  distance readout point at the objective, or at the door, exit or travel gate that
  leads to it.
- **Towns and travel:** Shoko sells potions, Maki runs the armory and Mei Mei trades
  materials. Travel from the **Map** tab by tapping an area, or walk into the cyan
  travel gate in each area. The map marks every area's travel point, its enterable
  buildings and where your tracked quest leads; **This Area** shows the current map
  with doors, gates, NPCs and the objective.
- **Saves:** three slots with autosave. Older saves are upgraded automatically, and
  **Copy Save Code** / **Transfer Save** move a save between installs or phones.
- **Cheats tab:** god mode, infinite cursed energy, one-hit kills, no cooldowns, extra
  speed, double EXP, all areas unlocked, plus one-tap level-ups, gear, items and quest
  completion. Toggles are saved per slot.

### Enterable buildings

Sugisawa High, the Jujutsu High dorm, Eishu's admin block, the Kawasaki cinema,
Shibuya Station and the Zen'in clan's cursed spirit storehouse each have a lit doorway. Inside, the floor plan is generated on every
visit: a random network of halls and rooms with a few loops, themed furniture
(classrooms, cells, screening rooms, platforms, tatami bedrooms, storehouse crates) and cutaway walls on
the camera side. The story beat for each building sits in the room farthest from the
door. Some rooms hide sealed caches with yen and gear, and the minimap starts dark and
fills in as you explore.

### The story

Eight chapters, with 31 main quests and 20 side quests across twelve areas and six
interiors. The main line follows the manga from the first finger to the Shinjuku
Showdown:

1. **Sugisawa Third High.** Yuji's grandfather's last words, the Occult Research Club
   seniors who broke the seal, and the finger Yuji swallows.
2. **Eishu Juvenile Detention Center.** A rescue in the rain, the Finger Bearer,
   Sukuna's binding vow, and Tadashi Okazaki's name tag for his mother.
3. **Kawasaki.** Nanami, Screen 3 of the cinema, Junpei and Mahito, and movie training
   with Yaga's cursed dolls while Yuji is "dead".
4. **Kyoto Goodwill Event and Death Painting.** Todo asks what your type is, then Hanami
   invades. After that, students start dying after crossing **Yasohachi Bridge**, and the
   Death Painting brothers Kechizu and Eso are on the riverbank.
5. **Shibuya Incident.** Veil anchors, the Prison Realm on B5F guarded by Choso (who
   wants revenge for his brothers), then Dagon, Jogo and the King of Curses.
6. **Perfect Preparation.** The higher-ups send Yuta Okkotsu to carry out an execution
   in the ruins of Shibuya. Then Maki goes home to the **Zen'in Clan Estate**: Mai's
   last gift in the cursed spirit storehouse, the Hei corps and Naoya. Side stories:
   Mahoraga, and a Soul Resonance rematch with Mahito that ends with Kenjaku.
7. **The Culling Game.** Inside **Tokyo Colony No. 1** you meet Hakari, stand trial
   before Higuruma and fight Kashimo. In the **Sendai Colony** you join Yuta against
   Kurourushi's swarm, Ryu Ishigori's Granite Blast and Takako Uro.
8. **Shinjuku Showdown.** Gojo returns from the Prison Realm and goes to face Sukuna
   alone. What follows is Uraume, Kenjaku and, finally, Sukuna in his four-armed
   Heian form.

Gojo is absent while he is sealed, and Megumi while Sukuna holds his body. Old saves
pick up where they left off: a save already in Shibuya counts the new Death Painting
chapter as done.

### Bosses and domains

21 bosses, each with its own move set, telegraphs, HP phases and summons. Mahito,
Dagon, Jogo, Sukuna and Kenjaku expand their **domains**: everyone inside takes sure-hit
damage. Survive it, or cast your ultimate inside it to start a **domain clash** and break
it. A boss expanding its domain also charges your gauge.

Some of the later bosses play by their own rules:

- **Naoya** draws his whole 24-frame path before he moves. Step off the lines.
- **Higuruma**'s Deadly Sentencing puts you on trial. Clash before the verdict, or your
  techniques are confiscated and his gavel becomes the Executioner's Sword.
- **Uro** folds the sky around herself, and projectiles slide off it.
- **Uraume**'s Frost Calm slows everything it touches.
- **Sukuna's true form** turns Mahoraga's wheel, adapting to whatever you use most, and
  telegraphs a World-Cutting Slash across the whole arena.

### Look and sound

- Low-poly, faceted models: every surface is lit as flat planes on a 4-band cel ramp,
  while faces stay smooth. Ink outlines, rim light, glowing cursed energy and bloom.
- Characters carry their trademarks: Gojo's blindfold, Nanami's goggles and
  leopard-print tie, Maki's glasses and polearm, Inumaki's zipped collar, Todo's scar,
  Choso's blood stripe, Yuta's white uniform and katana, Higuruma's gavel, Kashimo's staff,
  and Sukuna's four arms and second face in his true form.
- Day and night lighting, dynamic lights and weather: rain, sakura, falling leaves, ash,
  embers, fireflies and snow.
- Trees, roofs and walls fade out when they would hide your character.
- Synthesized sound for every action, timed to the animation: footsteps land on each
  foot plant and change with the surface, swings sound on the wind-up and hits on the
  contact frame, for players, curses, shikigami and bosses alike.
- A music theme for each area and for bosses, layered over ambience such as rain,
  crickets, city noise and wind.

## Controls

**Touch:** a floating joystick on the left, and action buttons on the right for
attack, five skills, ultimate, dodge, two potions and talk. Menus are at the top right;
the Cheats tab is in the main menu. Walk into a lit doorway to enter or leave a building.

**Keyboard** (in a browser, or on a phone with a keyboard):

| Key | Action |
|---|---|
| <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / arrows | Move |
| <kbd>J</kbd> / <kbd>Space</kbd> | Attack (combo) |
| <kbd>1</kbd>–<kbd>5</kbd> | Skills |
| <kbd>R</kbd> | Ultimate |
| <kbd>Shift</kbd> | Dodge |
| <kbd>Q</kbd> / <kbd>E</kbd> | HP / CE potion |
| <kbd>F</kbd> / <kbd>Enter</kbd> | Talk, advance dialogue |
| <kbd>1</kbd>–<kbd>9</kbd> in dialogue | Pick a choice |
| <kbd>I</kbd> <kbd>K</kbd> <kbd>L</kbd> <kbd>M</kbd> <kbd>C</kbd> | Bag, skills, quests, map, status |
| <kbd>Esc</kbd> | Close menu / open the system menu |

On Android, **Back** closes menus. Press it twice quickly to quit.

## Building from source

You need Node.js 22 to build the game, and JDK 17 plus the Android SDK
(compileSdk 35) for the APK.

```bash
git clone https://github.com/TamanegiNinja25/JJK-Mobile-Game.git
cd JJK-Mobile-Game/web
npm ci
npm run typecheck
npm run build             # bundles the game into android/app/src/main/assets/www/

cd ../android
./gradlew assembleDebug   # APK lands in app/build/outputs/apk/debug/
```

The built bundle is committed, so Android Studio can open `android/` and run the app
without Node.

To work on the game in a desktop browser, run `npm run serve` in `web/` and open
<http://localhost:8080>. It rebuilds on save, with source maps.

**CI:** [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml)
type-checks, bundles and builds debug and release APKs on every push and pull request.
To ship a version, publish a release on GitHub (or run **Build APK** by hand from the
Actions tab with a tag such as `v1.3.0`); the workflow builds the APK and attaches it
to that release. Pushing a `v*` tag does the same.

**Signing:** Android only installs an APK as an update when it carries the same
signature as the installed one, so every build is signed with one permanent key kept
in two repository secrets: `CC_KEYSTORE_B64` (the keystore, base64-encoded) and
`CC_KEYSTORE_PASSWORD`. Release builds refuse to publish without them. Ordinary builds
without the secrets still work but fall back to a throwaway debug key. Locally, point
`CC_KEYSTORE` and `CC_KEYSTORE_PASSWORD` at the keystore to sign the same way.

## How it works

The game is a TypeScript and [three.js](https://threejs.org) app, bundled by esbuild
into one script. A small Java app shows it in a full-screen `WebView`. It serves the
files from the APK's assets over a virtual `https://appassets.androidplatform.net`
origin, so WebGL, Web Audio and `localStorage` saves behave as in a normal browser,
offline. There are no third-party Android dependencies.

**Procedural art**
- Characters and curses are built from primitives by `RigBuilder`. Each becomes one
  rigid-skinned mesh with a shared skeleton, animated by a procedural animator with
  attack, cast and reaction poses for each move.
- Materials use a 4-band toon ramp and per-vertex glow, with inverted-hull outlines
  and a shared rim light. Parts are built with few segments and lit with per-face
  normals for the low-poly look; a copy of the smooth normal drives the outline hull so
  ink lines stay unbroken. A dither shader hides scenery standing between the camera
  and your character.
- Interiors come from `src/world/interiors.ts`: a seeded spanning tree over a grid of
  rooms, extra links for loops, breadth-first distance to pick the story room, then
  walls, doors, furniture, lights and spawners per cell.
- Buildings and props are merged or instanced meshes. Terrain blends four canvas
  textures with a painted splat map. Skill icons, item icons and portraits are drawn
  at runtime.

**Procedural audio:** sound effects are synthesized with Web Audio (noise bursts, FM
and a Karplus-Strong koto). Each area's music is a step sequencer that composes
phrases on the fly, layered over ambience loops and a convolution reverb.

**Performance:** there are three quality tiers that set resolution, shadows and bloom,
and the game drops a tier automatically when the frame rate stays low. A fixed pool
of four point lights avoids shader recompiles, and particles are pooled on the GPU.
Compiled shaders are kept for the whole session, and every effect shader is
pre-compiled while an area loads, so no slash, bolt or domain compiles mid-fight.
Enemy and shikigami models reuse their built geometry on respawn, and icons are
painted once in idle time before menus need them.

## Project layout

```
web/                    the game (TypeScript + three.js)
  src/core/             input, math, noise
  src/render/           renderer, toon shaders, rigs, models, effects, weather, textures
  src/audio/            synthesized SFX, music sequencer, ambience
  src/rpg/              stats, classes, skills, items, enemies, player state
  src/world/            maps, map builder, collision, world simulation
  src/entities/         player, enemies, bosses, summons, projectiles, NPCs
  src/ui/               HUD, menus, dialogue, icons, portraits
  src/data/story.ts     quests and dialogue
  static/               index.html and the UI stylesheet
android/                WebView host app (Java)
docs/                   icon and screenshots for this README
.github/workflows/      APK build and release
```

## License

The game's source code is released into the public domain under the
[Unlicense](LICENSE). Jujutsu Kaisen, its characters and its story belong to Gege
Akutami, Shueisha and MAPPA. That license covers only the original code in this
repository, not the franchise.
