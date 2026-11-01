# Changelog

All notable changes to Cursed Chronicles. Every release since 1.2.0 installs over the
previous one and keeps your saves.

## 1.6.0 — Yuta, Toji, reruns and hints

### Two new sorcerers
- **Yuta Okkotsu** unlocks when you clear "The Executioner" (Chapter 6). A special grade
  with a bottomless well of cursed energy: a katana, **Rika** fighting at his side, Inumaki's
  Cursed Speech ("Don't move", "Blast away"), Mimicry, Pure Love, reverse cursed technique
  and Rika's Full Manifestation. Ultimate: **Domain Expansion — Authentic Mutual Love**, a
  new domain with a field of planted katanas, each holding a copied technique.
- **Toji Fushiguro** unlocks when you clear "Hidden Inventory" (Chapter 9). Heavenly
  Restriction left him with no cursed energy at all: his bar holds **stamina**, he can
  never land a Black Flash, and he is the fastest and toughest fighter in the game. The
  Inverted Spear of Heaven, Playful Cloud, the Split Soul Katana, the Chain of a Thousand
  Miles, Heavenly Speed and Sorcerer Killer. The Inverted Spear goes straight through
  Infinity, and enemy domains barely find a body with no cursed energy (their sure-hit
  deals him 70% less). Ultimate: **Sorcerer Killer — Unbound**.
- Each has about fifteen techniques and six weapons, including a unique one.
- **They replay the story as themselves.** Neither is one of the first-years, so everyone
  talks about Yuji, Megumi and Nobara in the third person, and their own lines are written
  in their voice. When the story reaches the person you are playing, that person steps
  aside and their lines and errands become yours: Yuta's quests start and finish on their
  own. As Yuta, the one waiting for the executioner in Shibuya is Yuji. As Toji, the
  memory in the corridor puts Satoru Gojo in front of you, the night he became the
  strongest.

### Reruns: replay any quest line
- **Quests → Reruns** lists every chapter and side request you have finished. Each can be
  played again as often as you like.
- Rewards grow with every run up to the fifth, which **masters** the line and pays a bonus:
  extra EXP and Special Grade Seals (6 for a chapter, 3 for a side request). Reruns go on
  after that at the fifth run's rewards.
- A rerun skips the conversations: its quests start and report by themselves, and the
  curses and bosses on the way rise to your level. Sukuna's fingers and each sorcerer's own
  rewards stay with the story.
- Abandon a rerun at any time and the line goes back to finished, exactly as it was.

### Hints when you're stuck
- If the quest you are following hasn't moved for **two minutes** of play, whoever gave it
  tells you what is needed and where. After four minutes they offer to open the map, and
  after seven to **take you there**. Time in menus, conversations, cutscenes and boss fights
  doesn't count.
- Every active quest in the log has a **Hint** button.
- **System → Dialogue → Quest hints** turns them off.

### Update notice
- The game asks GitHub whether a newer version is out, at most every six hours. When one
  is, the title screen shows what's new once, then keeps a small banner. **Get the update**
  opens the latest release page in your browser. Nothing is sent but the request itself,
  and offline it just tries again later.
- **System → Updates** shows your version and has **Check for updates**.
- The title screen shows the version you are running.

### Themed confirmations
- **Deleting a save** opens a sealed talisman instead of the phone's plain pop-up. It shows
  the slot's sorcerer, level, location, story chapter, quests done, play time and when you
  last played. **Hold to erase** until the seal burns; a tap alone does nothing. Unlocked
  sorcerers stay unlocked.
- Overwriting a save, pasting a save code over one, switching sorcerers and discarding an
  item use the same dialog. Back cancels it.

### Models and sound
- **Characters have their own silhouettes.** Leg length and shoulder width are set per
  character (Gojo's long legs, Toji's and Todo's shoulders), not one body in different
  colours.
- **Eye shapes**: round, sharp, narrow or tired, with matching brows. Sukuna, Naoya and
  Toji glare, Yuta looks tired, Yuji's eyes stay wide.
- **Hair sheen**: a light band across the crown of every hairstyle, as in the anime.
- **Combat voices** in each character's own generated voice: a shout on a technique, a
  grunt on the last hit of a combo, a cry when a heavy blow lands and a last breath.
  Human bosses shout on their big moves. **System → Dialogue → Combat voices** turns them
  off.

### Zen'in Estate fixes
- The cursed spirit storehouse always holds enough curses for "The Cursed Spirit
  Storehouse". Its rooms could run dry at 7 of 10 and only refill slowly.
- Mai's scene in the deepest room only played if you got there before the tenth curse
  fell. Now it plays whenever you reach the room before reporting, and if you never do,
  Maki tells it when you report.
- Playing as Megumi, Maki and Naoya now talk to you rather than about you.
- The same fix for the Occult Research Club room at Sugisawa: its scene now plays even
  after the corridors are cleared.

### Other fixes
- "Training Day" had no gold arrow or minimap marker: the training corpses at Jujutsu High
  were never located. Now they are.

### Stability
- Changing area while a cutscene was still playing left the cutscene "running" behind the
  game. Every conversation, boss intro and report after that waited for it forever, so the
  story could stall. Travel now finishes the cutscene first, and the hint's **Take me there**
  only works during play.
- A domain's set pieces (the shrine, nails, court and swords) are freed when it ends. Each
  cast used to leave them in memory.
- A dialog that is closing no longer catches taps meant for the next one.
- The web build stops with an error if the game and the APK carry different version numbers,
  so the update check can never compare against the wrong one.
- Save data for reruns is checked when a save loads, and anything damaged is put back.

### Install
Download **CursedChronicles.apk** from the release. It installs over 1.5.0 (and any version
from 1.2.0 on) and keeps your saves.

## 1.5.0 — Cutscenes, voices and daily bosses

### Conversations like a visual novel
- Both people in a conversation stand in large character art, drawn from their models: the
  player on the left, whoever they are talking to on the right. The one speaking is lit,
  hops when their line starts and moves their mouth; the other waits in shadow.
- Faces change with what is said: neutral, happy, angry, surprised or sad. Name plates show
  each name in Japanese too.
- **Every character has their own voice.** Pitch, pace and tone differ per character, and
  curses growl and echo. In **System → Dialogue** you can switch to **Spoken**, which reads
  each line aloud with your phone's text-to-speech in that character's pitch, or to simple
  blips.
- **AUTO** advances lines by itself, **SKIP** fast-forwards, and text speed is adjustable.
- Characters in the world blink, and whoever is talking moves their mouth.
- The Sukuna sorcerers now speak as Sukuna. Seventy lines they used to borrow from Yuji and
  Megumi were rewritten in his voice.
- The Status page and the sorcerer select use the new art.

### Cutscenes
- **Domain Expansion cut-in** for you and for bosses: the world stops, the camera closes in
  on the hand sign, 領域展開 slams across the screen, then the domain's name in Japanese
  and English.
- **Bosses rise on camera** with their grade and name written across the screen.
- **Chapter clears**: finishing the last quest of a chapter turns the camera around you
  under "第三章 完", with the chapter's name. A new chapter's title appears when it begins.
- **Staged story moments**: the opening night at Sugisawa, Sukuna's awakening, Eishu, the
  Shibuya Incident, the Prison Realm, the Culling Game, Gojo's return, the Shinjuku
  Showdown, the King's fall and Gojo's last lesson. Each has a title shot, letterbox and a
  moving camera.
- **Boss defeats play where the boss falls.** Eso's last words, Jogo crumbling, Sukuna's
  laughter and the others used to wait until you reported back.
- **Ending credits** after the final battle.
- Cutscenes can be set to Full, Short or Off in **System → Dialogue**.

### Domains
- **Domain meter**: while a domain is up, its name and a 20-segment bar count down from 100%
  in 5% steps, for your domains and the enemies'.
- **Every domain keeps moving.** Inside **Malevolent Shrine**, Dismantle and Cleave never
  stop: slashes cut across the floor and through the air everywhere in range, with crossing
  Cleaves and the sound of blades. Unlimited Void streams information, Chimera Shadow Garden
  boils with shadow, Coffin of the Iron Mountain erupts, Self-Embodiment of Perfection grows
  hands, and the others have effects of their own.
- Modulo Yuji's domain was announced as "Unlimited Void". It now has its own name.

### Daily exorcisms
- **Akari Nitta**, by the front gate of Jujutsu High from Chapter 2, posts three bosses a
  day out of ten. The list refreshes at midnight on your phone, and each boss can be beaten
  once a day. Only bosses you have already met in the story appear.
- You fight in the new **Curtain Arena**, at your own level.
- **Every boss has its own drops**: Grade 1 Cores, Cursed Fragments, potions, Hei crests or
  Cursed Ash. Each also has a 30% chance of its **signature piece**, one of eight new unique
  accessories that only daily bosses drop. Every win also pays **Special Grade Seals**.
- **12 seals buy any signature piece outright** at Nitta's board, so farming always adds
  up.

### Quest fixes
- **"The Cursed Spirit Storehouse" could not be finished.** The storehouse door stayed
  sealed until the quest was done. It now opens once you accept it, and saves stuck there
  can carry on.
- **"Overtime in Kawasaki"** sent you back to Gojo to hear Nanami's lines. You now report
  to Nanami in Kawasaki, and the next lead follows on the spot.
- **"October 31st"** is reported to Ijichi at the veil and leads straight into "Prison
  Realm".
- **"King of Curses"** is reported to Yaga at Jujutsu High. Ijichi used to speak Yaga's
  lines.
- Gojo no longer stands in Jujutsu High while he is sealed (from the start of Shibuya until
  the Prison Realm opens). His two side requests pass to Yaga meanwhile, so they can still
  be taken and finished.
- Mid-quest hints from the village monk, Noritoshi Kamo and Yuta were spoken by the wrong
  person.
- **A full bag no longer eats quest rewards.** Anything that doesn't fit drops at your
  feet. Quest items never take a bag slot, a stack that overflows starts a new one instead
  of losing the rest, and a quest pickup in a full bag stays on the ground.
- All 63 quests were replayed for all seven sorcerers to confirm every giver, target, boss,
  item and report can be reached.

### HUD
- **The quest tracker sits under the HP and CE bars**, so the skill buttons never cover it
  on phone screens. The boss bar and messages are centred in the space between.

### Your own pictures and sounds
- **System → Your Pictures & Sounds** lets you use files from your phone in your own copy:
  - a picture for any of 35 characters, used for their portrait and dialogue art
  - a sound for seven big moments: Domain Expansion, Black Flash, Dismantle/Cleave, a boss
    appearing, a boss exorcised, level up and quest complete
  - a song for each of five kinds of place: the title screen, Jujutsu High, missions, boss
    fights and Domain Expansion

  The files stay on the phone and are never shared.

### Android
- Spoken dialogue uses the phone's text-to-speech engine through the app.
- The app can open the phone's file picker for the pictures and sounds above.

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
