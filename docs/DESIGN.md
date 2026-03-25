# GENESIS: EMBER — Design Document

## File Structure

```
index.html    — HTML 
styles.css    — visual styling, maybe add a document for      styleguide later? 
Ember.mjs     — the Ember class (one ember, knows only about itself)
Allele.mjs    — the Allele class (one allele, knows only about itself)
game.js       — game state, manages all embers, runs the loop
DESIGN.md     
```

---

## The Allele

Each allele has three properties:

- `gene` : which gene it belongs to (e.g. `'baseColor'`, `'saturation'`, `'glow'`)
- `value` : what it expresses (e.g. `'crimson'`, `0.8`)
- `strength` : how strongly it expresses (0.0 to 1.0)

### Strength inheritance
- Founding allele → strength is fully random (0–1)
- Inherited allele → parent strength ± up to 0.25, clamped to 0–1

### Mutation trigger
- TODO: if strength drops below 0.1, consider triggering a mutation

### Guard clauses
- TODO: add guard clauses to throw errors if `gene` or `value` are missing because Christian says so

---

## The Ember

### Genes (polygenic traits)
Color is decided by THREE genes working together:

| Gene | Values |
|------|--------|
| `baseColor` | `'crimson'`, `'violet'`, `'gold'`, `'blue'` |
| `saturation` | 0.0 – 1.0 |
| `glow` | 0.0 – 1.0 |

Each gene has two alleles (diploid). Alleles blend by strength — no simple dominant/recessive. This architecture also supports co-dominance and epistasis later without refactoring.

### Flicker gene (epistasis)
- `flickerAlleles` — two alleles, value is 0.0–1.0
- Blended strength = mutation probability at birth
- If triggered: one random channel (`r`, `g`, or `b`) of the ember's blended color is zeroed out permanently
- This is epistasis — the flicker gene suppresses expression of the color gene
- Everyone carries it; high strength = higher chance of color suppression

### Size gene
- Founding values: `'large'` and `'small'` only (defined in `constants.mjs`)
- `'medium'` is **not a founding value** — it emerges naturally through blending
  when a large and small ember breed over generations
- Large ember → lives longer, longer mate cooldown
- Small ember → lives shorter, shorter mate cooldown

### Founding vs born embers
- **Founding ember** — generates its own random alleles internally (`alleles = null`)
- **Born ember** — receives alleles passed in from parents

---

## Lifecycle
```
born (tiny) (not implemented)
  → growing phase (visual: ember grows to its allele-determined size)
  → mature (5 seconds (can be tweaked))
  → can mate
  → ages
  → dies (lifespan decided by size allele)
```

### Mating
- Only M + F pairs can mate
- Both must be mature and "ready"
- Mating is a visible event — embers stick together for ~10 seconds
- Offspring spawn from the female's position
- Offspring start tiny and grow to their allele-determined size

### Cooldowns after mating
- Female → ~1 minute cooldown before mating again
- Male → no cooldown (can mate immediately)

### Offspring count (weighted)
| Count | Likelihood |
|-------|------------|
| 0 | rare (sterile ember — decided at birth by small random chance) |
| 1 | common |
| 2 | common |
| 3 | rare |

- TODO: decide exact sterility percentage

---

## Architecture Principles

- **Fail loudly** — missing required data should throw a visible error, not silently produce wrong values because Christian says so
- **Design for extension** — e.g. blending by strength now means co-dominance and epistasis can be added later without refactoring
- **Placeholder first** — hardcode values until the system that generates them is ready
- **One responsibility per file** — Allele knows about alleles, Ember knows about one ember, game.js knows about the world

---

## TODO

### UI (panels, pop-ups, placement, etc.)
- [x] Add gender to ember info panel
- [x] Add right-side population panel (total count, alleles expressed in population)
- [x] Add population counter UI
- [x] Add gender counter to the UI
- [x] Hightlight around selected Ember
- [x] Extinct allele shown in red in population panel ("violet: extinct")
- [x] Embers and germs should not be able to move behind panels.
- [x] The panel for the individual Ember should follow the Ember (be placed near it). Hidden while dragging and during popups.
- [ ] Consider if changes to cursor should be made (custom), with maybe blue gloves or something. The grab hand is a bit small.
- [x] Decrease flicker ratio + add epistasis popup with game freeze on first flicker event
- [x] Add intro popup when founding embers reach maturity (explain diploid, allele strength, silent alleles, invite player to inspect)
- [x] Fix epistasis popup: bonus card formatting, ember drawn on top of all panels when dragged
- [x] Fix epistasis popup flow: ember info now lands on card 2 after closing the bonus card, not back on card 1
- [ ] Allele extinction popup: notify the player when a color allele goes fully extinct from the population
- [ ] Bottleneck popup: if population drops to ~5 or fewer, those survivors become the founding population — popup follows: "Notice how the population changed? The survivors' genes — by chance — now define everyone."

### Gameplay
- [x] Build `game.mjs` loop
- [x] Build `index.html` + start screen
- [x] Design mating / reproduction system
- [x] Detect color fixation (all embers same color) → trigger lose condition
- [x] Cooldown timer on just-mated
- [x] Add guard clauses to `Allele` constructor
- [ ] Add mutation trigger when strength < 0.1
- [ ] Decide sterility percentage
- [ ] Add `fertilityAlleles` — inherited trait that affects offspring count weighting
- [x] Mating cooldown tied to radius (larger = longer cooldown)
- [ ] Albinism: emerges naturally when both allele strengths drift to 0 — ember appears white. Consider detecting and reacting to this event (popup? highlight?)
  - Note: **Melanism** (fully black ember) is theoretically possible but ultrarare — requires albinism *and* the flicker gene triggering on top of it, zeroing the last channel. Odds stack multiplicatively. May never occur in a normal playthrough.
- [ ] Win conditions:
    - [ ] Achievements (20 of each)
    - [ ] Collect identical samples (20 identical Embers)
    - [ ] Get fixation (1 round)
    - [ ] Every color allele must survive for x amount of time
- [ ] Collect Embers for later study
- [ ] Second petri dish (maybe): a migration event where 3–5 random embers are sent to a smaller sub-canvas in the corner, founding an isolated colony. Player can toggle between the two populations and compare how they diverge. Teaches founder effect independently of bottleneck.
- [ ] Divide gameplay into "parts" — each part has its own goals to teach the player something new:
    - [ ] Part 1: introduces the Embers and the KEY GOAL (how to win)
    - [ ] Part 2: introduces the alleles and how to read the UI
    - [ ] Part 3: introduces mating
    - [ ] Part 4: introduces the gene flicker (epistasis)
    - [ ] Part 5: introduces Germs (and explains what they do)

### Embers
- [x] Build `draw()` method on Ember
- [x] Build `update()` method on Ember
- [x] Size alleles resolve to radius — blended by strength
- [x] Lifespan tied to radius (larger = longer)
- [x] Speed tied to radius (smaller = faster)
- [x] Add `flickerAlleles` — epistatic gene that suppresses one rgb channel at birth
- [x] Add mating visual (embers stick together briefly)
  - [x] Embers snap edge-to-edge on mating (`matingWith` property)
  - [x] Wiggle animation while mating (male wiggles, female stays still)
  - [x] `matingTimer` counts to 600 ticks, then spawns offspring
  - [x] Embers separate after mating
- [ ] Implement saturation and glow in `draw()` — alleles are resolved at birth, visual effect TBD
- [x] Separate genders visually: females are rounded squares, males are circles
- [x] Delta time refactor — all timers and speeds are now seconds-based, frame-rate independent

### Germs
- [x] Germs: large, black, spiky entities (layered rotating triangles) that the player accidentally introduces by handling the petri dish too much.
  - [x] Spawn at the cursor position (the contaminating "finger")
  - [x] Move around the canvas like embers, bounce off walls, have their own lifespan
  - [x] On contact with an ember: continuously drain that ember's remaining lifespan (ember flickers in opacity while being damaged)
  - [x] Damage is equal for all embers — no allele advantage. Survivors are determined by luck, not fitness.
  - [x] Player can squish them (instant kill in squish mode)
  - [x] Trigger system: inactive until `lifetimeEmberCount >= 100` (after intro popup). After that, each canvas click increments `clicksSinceLastGerm`. Spawn threshold is randomised between 15–40 clicks each time. On trigger: spawn 3–10 Germs at cursor.
  - [x] Increase speed and damage on germs
  - [ ] Planned: germs (and other calamities) should target specific alleles — a germ that only damages embers carrying a specific color allele. This teaches vulnerability of low diversity: a diverse population survives, a fixed/bottlenecked one gets wiped out. Core mechanic for eugenics learning outcome.
  - [ ] Consider: germ size (`radius`) could scale damage dealt — bigger germ = more drain per frame. Currently all germs drain equally regardless of size.

