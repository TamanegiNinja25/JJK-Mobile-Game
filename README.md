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

<sub>Latest release · Android 7.0+ · about 1.3 MB · <a href="https://github.com/TamanegiNinja25/JJK-Mobile-Game/releases">all releases</a></sub>

</div>

Play as Yuji, Megumi or Nobara and fight through the story from the Sugisawa High
rooftop to the Shibuya Incident. Combat is real-time with combos, skills, dodges and
Black Flashes, wrapped in a classic Zenonia-style RPG loop: quests, loot, stat points,
skill trees, gear upgrades and boss fights.

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
    <td><img src="docs/screenshots/skills.jpg" alt="Skill tree"><br><sub><b>Skill trees</b> with active skills, passives and an ultimate</sub></td>
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

Requirements: Android 7.0 (API 24) or newer with OpenGL ES 3.0. The game plays in
landscape. If the frame rate stays low, it lowers the graphics quality automatically;
you can also set it under **Settings**.

## Features

### Three sorcerers

| | Style | Skills | Ultimate |
|---|---|---|---|
| **Yuji Itadori** | Close-range brawler with the best Black Flash odds | Divergent Fist · Manji Kick · Cursed Rush · Meteor Slam · Black Flash · Slaughter Demon | King of Curses: Malevolent Shrine |
| **Megumi Fushiguro** | Shikigami summoner and swordsman | Divine Dogs · Nue · Toad · Shadow Step · Max Elephant · Rabbit Escape | Domain Expansion: Chimera Shadow Garden |
| **Nobara Kugisaki** | Mid-range nails, hammer and Resonance | Hairpin · Nail Volley · Resonance · Hammer Smash · Straw Doll Curse · Cursed Nail Rain | Resonance: Thousand Nails |

Each class also has four passives. Every level gives 5 stat points (STR, DEX, VIT, CE)
and 1 skill point, up to level 50.

### The RPG loop

- **Combat:** combo chains, dodge with invulnerability frames, five skill slots, an
  ultimate and two potion slots.
- **Black Flash:** a ×2.5 critical with hit-stop. It fills your domain gauge and grants
  a short "zone" buff.
- **Loot:** four rarities (Common, Graded, Special Grade, Cursed Tool) with random
  bonus stats. Gear covers class weapons, uniforms, charms and shoes.
- **Infusion:** Yaga's workshop upgrades gear from +1 to +10. Higher levels can fail
  and drop a level.
- **Towns and travel:** Shoko sells potions, Maki runs the armory and Mei Mei trades
  materials. Ijichi drives you between unlocked areas.
- **Saves:** three slots with autosave.

### The story

Five chapters, 14 main quests and 11 side quests, across seven maps:

1. **Sugisawa Third High.** A finger, a rooftop curse and a first meeting with Gojo.
2. **Eishu Juvenile Detention Center.** A rescue in the rain, and the Finger Bearer.
3. **Kawasaki.** Nanami, Junpei and Mahito, from the riverbank down into the sewers.
4. **Kyoto Goodwill Event.** Todo asks what your type is, then Hanami invades.
5. **Shibuya Incident.** Veil anchors, Dagon, Jogo and the King of Curses.
   Afterwards there is an optional fight against Mahoraga, who adapts to the damage
   you deal.

### Bosses and domains

Nine bosses, each with its own move set, telegraphs, HP phases and summons. Mahito,
Dagon, Jogo and Sukuna expand their **domains**: everyone inside takes sure-hit damage.
Survive it, or cast your ultimate inside it to start a **domain clash** and break it.
A boss expanding its domain also charges your gauge.

### Look and sound

- Cel-shaded characters with ink outlines, rim light and glowing cursed energy, plus bloom.
- Day and night lighting, dynamic lights and weather: rain, sakura, falling leaves, ash
  and fireflies.
- Trees, roofs and walls fade out when they would hide your character.
- Synthesized sound for every action. Footsteps change with the surface, and every
  hit, skill, shikigami and domain has its own sound.
- A music theme for each area and for bosses, layered over ambience such as rain,
  crickets, city noise and wind.

## Controls

**Touch:** a floating joystick on the left, and action buttons on the right for
attack, five skills, ultimate, dodge, two potions and talk. Menus are at the top right.

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
Actions tab with a tag such as `v1.1.0`); the workflow builds the APK and attaches it
to that release. Pushing a `v*` tag does the same. The release build is signed with
the debug key so it can be sideloaded; use your own keystore before distributing it
elsewhere.

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
  and a shared rim light. A dither shader hides scenery standing between the camera
  and your character.
- Buildings and props are merged or instanced meshes. Terrain blends four canvas
  textures with a painted splat map. Skill icons, item icons and portraits are drawn
  at runtime.

**Procedural audio:** sound effects are synthesized with Web Audio (noise bursts, FM
and a Karplus-Strong koto). Each area's music is a step sequencer that composes
phrases on the fly, layered over ambience loops and a convolution reverb.

**Performance:** there are three quality tiers that set resolution, shadows and bloom,
and the game drops a tier automatically when the frame rate stays low. A fixed pool
of four point lights avoids shader recompiles, and particles are pooled on the GPU.

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
