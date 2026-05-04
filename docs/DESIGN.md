# GENESIS: EMBER — Design Document

## File Structure

```
index.html        — HTML shell, start screen
styles.css        — visual styling
constants.mjs     — shared constants: colors, fonts, game states, shop items
game.mjs          — game loop, state, input handling
ui.mjs            — all canvas drawing functions
ember.mjs         — Ember class (one ember, knows only about itself)
allele.mjs        — Allele class (one allele, knows only about itself)
orders.mjs        — order generation, update, and fulfillment logic
tutorial.mjs      — scripted tutorial step machine
germ.mjs          — Germ class
virus.mjs         — Virus class
cursors.mjs       — custom cursor image data
utilities.mjs     — shared utility functions (e.g. distance())
docs/DESIGN.md    — this document
docs/STYLEGUIDE.md
COLLABORATION.md
```

---

## The Allele
**Each allele has three properties:**
- `gene`: which gene it belongs to (e.g., `'baseColor'`, `'saturation'`, `'glow'`)
- `value`: what it expresses (e.g. `'crimson'`, `0.8`)
- `strength`: how strongly it expresses (0.0 to 1.0)

### Strength at birth
- Founding (no parents) → strength is fully random (0–1)
- Inherited (has parents) → parent strength ± up to 0.25, clamped to 0–1
- Explicit (tutorial embers) → color value fixed, strength still random, flicker suppressed to 0

### Guard clauses
- Constructor throws if `gene` is falsy or `value` is null/undefined

### TODO
- [ ] Mutation trigger: if strength drops below 0.1, consider triggering a mutation (undecided)
- [ ] Mode games (fixation, etc.) should use the Founding birth path since explicit alleles are tutorial-only. 

---

## The Ember
### Genes (polygenic traits)
Each ember is diploid, that means every gene has two alleles that blend by strength.

| Gene | Values |
|------|--------|
| `baseColor` | `'crimson'`, `'violet'`, `'gold'`, `'blue'` |
| `size` | `'large'`, `'small'` |
| `saturation` | 0.0 – 1.0 |
| `glow` | 0.0 – 1.0 |

### Flicker gene (epistasis)
- `flickerAlleles` has two alleles, value is 0.0–1.0
- Blended strength: probability of triggering at birth
- If triggered: one random channel (`r`, `g`, or `b`) is zeroed out permanently
- This shows how epistasis, the flicker gene suppresses expression of the color gene
- Everyone carries it, but founding embers get near-zero strength so it stays rare

### Size gene
- Founding values: `'large'` and `'small'` only
- `'medium'` is not a founding value but it emerges through blending across generations
- Large ember → lives longer, longer mating cooldown
- Small ember → lives shorter, shorter mating cooldown

### Birth paths
- **Founding**: random color, random size, random strength on all alleles
- **Born**: inherits one allele per gene from each parent, strength drifts ± 0.25
- **Tutorial/explicit**: color fixed, size random, flicker suppressed to 0

### TODO
- [ ] Saturation and glow are resolved at birth but not yet used in `draw()`, visual effect is still undecided, might introduce it with the microscope? 

---

## Lifecycle
```
born (tiny)
  → growing phase (visual: ember grows to full size over ~10 seconds)
  → mature (age > 10s → can mate)
  → ages
  → dies (lifespan = radius × 5 seconds)
```

### Mating
- Only M + F pairs can mate, and both must be mature with no active cooldown
- Embers snap together for 10 seconds, then separate and spawn offspring
- Offspring spawn from the midpoint between both parents

### Cooldowns after mating
- Female → `radius × 0.85` seconds (~10–17s depending on size)
- Male → `radius × 0.15` seconds (very short)

### Offspring count
| Count | Likelihood |
|-------|------------|
| 0 | 5% (sterile) |
| 1 | 60% |
| 2 | 30% |
| 3 | 5% |

---

## Architecture Principles

- **Fail loudly**: missing required data should throw a visible error, not silently produce wrong values (because Christian says so)
- **Design for extension**: alleles blend by strength rather than using a simple "one allele wins" system. This means co-dominance (both alleles express at once, like blood type AB) and epistasis (one gene suppressing another, like the flicker gene already does) work without rewriting anything. 
- **One responsibility per file**: Allele knows about alleles, Ember knows about one ember, game.mjs knows about the world. Good, plain, old JavaScript.

---

## TODO
### UI
- [ ] Fullscreen mode (Esc to exit): plan is to call `requestFullscreen()`, listen for `fullscreenchange` event, then update `canvas.width` and `canvas.height` to `window.innerWidth/innerHeight`. UI panels reposition automatically since they calculate from canvas dimensions each frame. Embers near the right boundary will self-correct via the boundary check in `update()`. Esc is handled natively by the browser.
- [ ] Help/info menu reusing tutorial intro cards as reference for returning players
- [ ] Bottleneck popup: if alleles go extinct, we have a popup showing: 
The remaining population now define everyone."
- [ ] Goal indicator on the left side of the screen showing the current goal (e.g. during tutorial: "Reach a population of 50 without any allele going extinct")

### Gameplay
- [ ] Add mutation trigger when strength < 0.1 (unsure about this)
- [ ] Add `fertilityAlleles` — inherited trait that affects offspring count weighting (unsure about this)
- [ ] Albinism: emerges naturally when both allele strengths drift to 0 — ember appears white. Consider detecting and reacting to this event (popup? highlight?)
  - Note: **Melanism** (fully black ember) is theoretically possible but ultrarare — requires albinism *and* the flicker gene triggering on top of it, zeroing the last channel. Odds stack multiplicatively. May never occur in a normal playthrough.
- [ ] Second petri dish (maybe): a migration event where 3–5 random embers are sent to a smaller sub-canvas in the corner, founding an isolated colony.

---

## Campaign Structure

The start screen has a keyword input field. Entering a keyword launches a specific teacher-directed mode. If no keyword is entered, the game starts in open play.

### All modes — shared structure
1. Tutorial runs first (skippable)
2. When the first virus outbreak ends (resolved or fully burned through), a transition popup appears: "Tutorial complete. You left the dish overnight, and came back to find... only 10 embers had survived. These are now your founding population. Your goal is to: [goal description]." (dip to black, cinematic text)
3. The tutorial population is cleared. ~10 new random embers spawn (Founding birth path — see The Allele). This demonstrates the founder effect.

### Open play
No specific goal. The transition popup ends with "Your goal is to: keep them alive."

### Modes (not yet implemented)
Planned modes:

| Goal | What it teaches |
|------|-----------------|
| Achieve fixation (all embers carry the same color allele) | You are the selector; diversity is the default |
| Maintain 20 or more embers of each allele present in your founding population | Diversity is fragile; you work with what the founder effect gave you |
| Reach 50 embers carrying a game-designated allele from your founding pool, without losing the other founding alleles | Directed selection has trade-offs; you are constrained by your starting conditions |

### TODO
- Decide keyword names for each mode
- Implement mode detection on start screen
- Implement transition popup and population reset
- Decide win/lose conditions per mode
- Decide exact number of founding embers (~10 is the current thinking)

---

## Collection System (Test Tube)

A test tube is drawn on the right-hand panel area (where embers can't travel). The player drags embers into it to collect them.

- Collected embers are permanently removed from the dish
- The tube can be emptied, but emptied embers are gone — not returned to the dish
- Used to fulfill Orders

---

## Orders

Random short-term missions that arrive during gameplay. Each order specifies:
- A count (e.g., "3 embers")
- An allele criteria (e.g., "one gold allele + one blue allele, male")

Completing an order earns research credits. Orders are framed as external scientific requests ("A researcher has requested samples matching the following criteria...").

---

## Shop

Accessible via a `[ shop ]` button. Spend research credits on consumables and tools.

| Item | Description | Cost |
|------|-------------|------|
| Antibiotic spray | Instantly clears all germs | 75 |
| Gloves refill | +3 glove uses | 150 |
| Hormonal drops | Halves mating cooldown for 30 seconds | 200 |
| Microscope | Shows allele overlay on all embers. Permanent unlock | 1200 |

### TODO
- Microscope: show additional gene info in the ember info panel when active (genes present but not otherwise visible, like saturation and glow)
- Microscope unlock should persist across browser sessions via localStorage

---

## Persistence (localStorage)

Research credits, shop unlocks, and completed achievements persist across browser sessions via localStorage.

Currently in use: `genesis_initials`, `genesis_medium`.

### Tutorial (separate from real game)

**Design:**
- Tutorial is a scripted scene, not the real game with hints overlaid
- Separate `tutorial.mjs` file, a step machine the game loop checks
- Embers have handcrafted alleles (guaranteed colors/genders), not random
- Embers are immortal during Phase 1 so the player isn't rushed
- Real game begins after a transition popup (see Campaign Structure)

**Phase 1: Find and mate:**
- Small founding population with guaranteed allele coverage
- Task: find a male with at least one blue allele and a female with at least one gold allele, drag them together to mate
- Finding the right ember implicitly teaches the info panel; dragging teaches the mating mechanic
- Step advances automatically when the correct pair mates

**Phase 2: Grow the population:**
- Embers can now age and die (lifespan active)
- Task: grow population to 50 without losing all alleles from any one color
- Germs can spawn, introducing calamity risk naturally

**TODO:**
- [ ] Tag specific tutorial embers so step completion can be detected
- [ ] Hook tutorial step checks into the game loop
- [ ] Tutorial directive UI: show current task to the player on screen

### Embers

**TODO:**
- [ ] Implement saturation and glow in `draw()` (visual effect undecided)
- [ ] Age tint: blend ember color toward white based on `age / lifespan` ratio

### Germs

**TODO:**
- [ ] Germs should target specific alleles (teaches vulnerability of low diversity)
- [ ] Germ size could scale damage dealt
- [ ] Germs should slow down when passing over an ember

### Viruses

**TODO:**
- [ ] Teach low diversity vulnerability more explicitly: a fixed population gets wiped, a diverse one loses only carriers of that allele

---

## Design Decisions & Development History

[x] UI: panels, popups, and placements:
The right-side population panel, the ember info panel, the gender counter, population counter, and allele extinction indicators were all built and changed along the way. The ember info panel was changed to follow the selected ember rather than sitting in a fixed position at the top, because playtesting showed it wasn't visible. The "player hand" was first introduced by changing the mouse-cursor to a grab-hand, but as the game evolved, the need for a custom cursor became evident (the players didn't "see" the hand, so a much bigger hand was made with simple SVG lines. The current version of the game uses hand drawn SVGs which are set to a noticeable size with more explanatory colors. It changed colors when a glove is applied, even though this design can still be improved, especially for e.g., colorblind people)

A series of popups were introduced to teach the player, like an intro popup at founding maturity to explain diploid genetics, and epistasis popup on first flicker event with game freezing, germs and gloves popups on the first germ breakout, when an allele extinction occurred etc. Some were kept, while others were put on hold (like the epistasis).

One idea was tried and thrown, like a circular petri dish background. It looked very cool, but the playable area became too small, so it was abandoned.

[x] Gameplay: Core loop, mating, and lifecycle:
The game loop, the start screen, and the mating system were built from scratch. Mating cooldowns are tied to ember radius (larger embers wait longer). Offspring count is weighted with 5% being sterile, 60% gives one offspring, 30% gives two offsprings and 5% gives three. Originally timers were tick-based on frames, but this made the game speed unstable because it was linked to the frame rate. It was changed to use delta time instead so the game would run consistent regardless of the frame rate. Guard clauses were added to the Allele constructor because I scored less on an exam some years ago when I didn't include error-handlers.

[x] Germs and viruses:
Germs are spiky entities that are made to look sinister. They spawn at the cursor when the player clicks too many times on the screen. The germs drain embers lifespan on contact. They can be removed by squishing, and later also by antibiotic spray bought in the store.
Viruses are a separate system of tiny, swarming dots, which targets specific alleles. They spread when embers gets too close to eachother and kills all infected embers after 30 seconds. Unlike germs, viruses cannot be squished (but embers infected can, which was a dynamic not intentionally designed!).

[x] Tutorial:
The tutorial is a scripted scene which is separate from the real game. It spawns handcrafted embers with guaranteed allele coverage and suppressed flicker. The first part tasks the player to find and mate a specific pair, and the second part introduces aging, death, germs and viruses.

[x] Pause behavior:
Originally pausing froze the game but still allowed the player to drag embers around, which was an unintended way to cheat. It was fixed by intercepting mousedown while paused: any click anywhere on the canvas unpauses and does nothing else, so no ember can be picked up while the game is frozen.