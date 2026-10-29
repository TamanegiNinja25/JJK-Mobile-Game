# Changelog

All notable changes to Cursed Chronicles. Every release since 1.2.0 installs over the
previous one and keeps your saves.

## 1.4.0 — Open world and the King's return

### New sorcerers you unlock
Four new playable sorcerers, each with their own model, about fifteen techniques, an
ultimate, a weapon line and much higher stats and growth than the first-years. Locked ones
show on the select screen with what unlocks them. Unlocks belong to the phone, not one
save, and saves that already cleared these quests unlock them on the spot.

| Sorcerer | Unlocked by | Ultimate |
|---|---|---|
| **Ryomen Sukuna (Yuji's body)** | Clearing the Shibuya Incident ("King of Curses") | Malevolent Shrine, closed with Open: Fuga |
| **Ryomen Sukuna (Megumi's body)** | Clearing "Shinjuku Showdown" | Mahoraga adapts, then the World-Cutting Slash |
| **Heian Sukuna** | Defeating Sukuna's true form and finishing the story | The full Malevolent Shrine, ending in Divine Flame |
| **Modulo Yuji** | Finishing the story as Yuji, or clearing the new Memories chapter | His own Domain Expansion |

- Start a new game with any unlocked sorcerer, or switch inside a save from
  **Status → Sorcerers** while in Jujutsu High. Each sorcerer keeps their own level,
  attribute points, techniques and weapon. Armour, the bag, yen and quests are shared.
- A sorcerer joining a save for the first time arrives at your current level with their
  points spent and the best weapon of their line.
- The Sukunas and Modulo Yuji speak the story lines of the first-year whose body (or
  past) they share.

### The open world
- **Tokyo Outskirts**: a new region about seven times the size of a story area. Walk out
  of the east gate of Jujutsu High and into forest, a farming village with rice paddies,
  a river with two bridges, a mountain lake and shrine, the abandoned Tamagawa Hospital
  and a special grade "womb tree" in the middle. The curses get stronger the further you
  go from the village (Lv 6 near the school, up to Lv 90 around the tree).
- **Roads between areas**: the outskirts connect on foot to Jujutsu High, Kawasaki and
  Shibuya. Road exits glow gold on the ground and on the maps.
- **Landmarks** (8 in the outskirts, 5 on Sakurajima): the first visit is recorded and
  pays EXP.
- **Sealed caches** (20 hand-placed): each opens once per save, with gear, Cursed
  Fragments and sometimes a Grade 1 Core. The area map counts what you have found.
- **Wandering special grades**: the Smallpox Deity, the Rainbow Dragon and
  Kuchisake-onna. They always match your level, come back a few minutes after they fall,
  and drop boss loot every time.
- **Sakurajima Colony**: a second open region from the Culling Game, a volcanic island
  with a harbour town, ash fields, a lava gorge and a crater.

### New story and bosses
- **Sakurajima (Culling Game):** Maki asks for help when Naoya comes back as a cursed
  spirit. Noritoshi Kamo waits at the harbour. **Naoya's cursed spirit** runs projected
  paths at the speed of sound and expands **Time Cell Moon Palace**, which freezes
  anyone who stands still.
- **Chapter 9 — Memories in the Barrier** (after the ending): Tengen asks you down to the
  Tombs of the Star, beneath Jujutsu High, to lay old memories to rest.
  - **Hidden Inventory:** Toji Fushiguro with the Playful Cloud, the Inverted Spear of
    Heaven (it strips your buffs) and the Chain of a Thousand Miles. He has no cursed
    energy, so domains barely find him, and he vanishes and reappears behind you.
  - **Night Parade of a Hundred Demons:** Jujutsu High on December 24th, 2017. Suguru
    Geto, his curses, the Rainbow Dragon and Maximum: Uzumaki.
  - **The Strongest's Last Lesson:** Gojo left a copy of himself in the barrier. Lapse
    Blue, Reversal Red, Hollow Purple, **Infinity** (only Black Flash or a domain gets
    through) and Unlimited Void.
- 12 new quests, 7 new bosses, 5 new areas, 4 new music themes, and new unique gear from
  every new boss.

### Stability and performance
- Big areas split their scenery into chunks, so trees and rocks off screen are not
  drawn. Draw calls in the outskirts stay level with existing story areas.
- In the open regions, curses far from you sleep, and groups far away empty out and
  refill as you approach. Big areas also paint their ground at a lower resolution, so
  they load faster.
- Toji's vanish hides him properly; world bosses introduce themselves once.

## 1.3.1 — Smoother play

### Fixed
- **The camera no longer shakes for no reason.** Several separate causes:
  - Beside buildings, the camera tilted up to see past a wall and then back down, over and
    over. The check now looks at the full camera offset, reacts only to real buildings (not
    lamps, trees or fences) and waits a moment before tilting back.
  - Every critical hit briefly re-aimed the camera, then snapped it back.
  - The view swung each time your character turned to face a different enemy. It now leads
    in the direction you walk, not the direction you face.
  - The camera jumped when dialogue started or ended.
  - Screen shake is now a smooth, fading wobble instead of random jolts. It has a cap so
    shakes don't stack, and an Off / Light / Full setting under **System → Screen shake**.
- **Dash attacks no longer pass through walls.** At low frame rates a fast dash could skip
  past the middle of a thin wall in a single frame, and the collision check then pushed the
  character out on the far side. Fast movement (dashes, lunges, knockback, enemy charges)
  is now checked in small steps. Crowds and bosses pushing you are checked the same way, so a
  shove can't press you through a wall either.
- **Yaga's infusion quest opens the workshop.** Talking to a shopkeeper with one of their
  quests in progress used to play chatter instead of opening the shop. Now the shop always
  opens and shows the quest step as a hint. This also means Ijichi's travel menu works while
  one of his errands is open.
- **Music stays in step with the game.** Fight, domain and area themes now follow what is
  happening right now, so a boss dying inside your domain no longer brings its fight music
  back afterwards. After a stall (an area loading, the app coming back from the background),
  the music skips ahead instead of playing every missed note at once.
- **Sound effects keep up in big fights.** When dozens of sounds fire within a few frames,
  quiet distant ones are dropped so the audio never falls behind the picture.

### Improved
- **Smoother movement.**
  - Walking eases in and out instead of starting and stopping dead.
  - Enemies steer smoothly instead of snapping between directions.
  - The walk cycle and the standing pose blend into each other.
  - Attacks and skills ease into and out of their poses.
  - Small frame-to-frame timing wobbles are smoothed out.
- **Much less lag when a lot is on screen.**
  - Item and skill icons used to be compressed to PNG on the game's main thread. That ran
    during fights (every loot pickup re-queued the whole bag) and was by far the biggest cost
    in crowded scenes. Icons are now compressed in the background, painted only for gear you
    actually have (shop stock is painted while you're in town), paused during fights, and
    drawn at at most twice screen resolution.
  - Enemies and NPCs that are off-screen are no longer animated or drawn.
  - Floating damage numbers and name labels are drawn once and reused, instead of
    re-drawing outlined text every frame.
  - Loot drops share their meshes and materials.
  - Domain set pieces and a few more effects are prepared while an area loads. Shader
    compile checks no longer force a stall, so the first Malevolent Shrine, Thousand Nails or
    Deadly Sentencing of a session doesn't hitch.

## 1.3.0 — To the Shinjuku Showdown
- The story continues past Shibuya and follows the manga to the end. New chapters:
  - The Death Painting arc at Yasohachi Bridge.
  - Perfect Preparation: Yuta's execution order, then the Zen'in Clan Estate and its cursed
    spirit storehouse.
  - The Culling Game: Tokyo Colony No. 1 and the Sendai Colony.
  - The Shinjuku Showdown.
- Eleven new bosses: Kechizu, Eso, Yuta Okkotsu, Naoya, Higuruma, Kashimo, Ishigori, Uro,
  Uraume, Kenjaku and Sukuna's true form. They bring new mechanics: Higuruma's trial
  confiscates your techniques, Naoya runs 24-frame paths, and Sukuna adapts to you and fires
  the World-Cutting Slash.
- New characters and curses, music for every new area, snow, and unique gear from every boss.
- Characters offer main-story quests before side quests.

## 1.2.0 — Tracking and travel
- Quest tracking with a ground arrow, a minimap marker and a distance readout.
- Travel to any unlocked area from the map, plus a travel gate in every area.
- Mechamaru's Reforge takes gear from +10 to +30.
- The level cap is 100.
- Save codes let you move progress between installs.
- Smoother combat and faster menus.
- Releases are signed with a permanent key, so updates install over the old version.

## 1.1.0 — Interiors and the low-poly look
- Enterable buildings, laid out fresh on every visit.
- A low-poly, faceted art style.
- More skills and new equipment slots.
- A redrawn icon set.
- Sounds timed to footsteps, swings and impacts.
- A Cheats tab.

## 1.0.0 — First release
- Play as Yuji, Megumi or Nobara from Sugisawa High to the Shibuya Incident.
- Real-time combat, quests, loot, skill trees, boss fights and Domain Expansions.
- Everything is generated in code.
