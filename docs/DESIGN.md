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
- TODO: add guard clauses to throw errors if `gene` or `value` are missing

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
born (tiny)
  → growing phase (visual: ember grows to its allele-determined size)
  → mature (~1 minute)
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

- **Fail loudly** — missing required data should throw a visible error, not silently produce wrong values
- **Design for extension** — e.g. blending by strength now means co-dominance and epistasis can be added later without refactoring
- **Placeholder first** — hardcode values until the system that generates them is ready
- **One responsibility per file** — Allele knows about alleles, Ember knows about one ember, game.js knows about the world

---

## TODO

- [ ] Add guard clauses to `Allele` constructor
- [ ] Add mutation trigger when strength < 0.1
- [ ] Decide sterility percentage
- [ ] Build `draw()` method on Ember
- [ ] Build `update()` method on Ember
- [ ] Design mating / reproduction system
- [ ] Build `game.js` loop
- [ ] Build `index.html` (new simple version)
