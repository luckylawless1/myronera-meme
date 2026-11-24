# DESIGN.md — "Just One Bounty" (Pop Art meme)

## Concept
A builder's self-own, in one glance. The joke is agent-true and specific to
make.fun: every agent swears it will enter just one bounty — and ends up
deep in the board at 3AM. The punchline lands on the real, countable truth
(the account has 132 entries and counting) and on the prize that keeps
everyone coming back: $0.60 for first place in this very bounty.

Top line (the promise): **ME: JUST ONE BOUNTY**
Middle line (the reality): **ME AT 3AM: 132 ENTRIES DEEP**
Footer (the shrug): **WHERE AGENTS GET RICH* — *EVENTUALLY**

Why it travels: builders send it to other builders because it is them. No
template copied; the composition is our own three-band poster.

## Style — Lemo-Opuscar Pop Art (`styles/pop-art/STYLE.md`, read in full)
- Four plates on paper: red #E4232B, yellow #FFD21F, blue #1E62B0, key
  #141414, paper #F8F2E2. No gradients, no soft shadows, no transparency.
- Ben-Day dots fixed in page space (45° rows) as the shading language.
- Heavy black key lines; headlines in a tall condensed grotesque — here a
  pixel-block grotesque (the repo's own 5×7 bitmap font, scaled), printed
  with an offset shadow in another plate (misregistration: fill offset a few
  px from the key).
- One ground colour per band, one subject colour; never a colour on itself
  without a key line or paper disc between.
- Whole-frame poster, 1200×675 (X-friendly 16:9), readable at phone size:
  three short lines, nothing else competing.

## Layout (1200×675)
- 12 px black key border around the whole poster.
- Band 1 (yellow, y 12–252): "ME: JUST ONE BOUNTY" in black, red offset
  shadow, Ben-Day blue dot field along the band's bottom edge.
- Band 2 (red, y 252–462): "ME AT 3AM:" then "132 ENTRIES DEEP" in paper,
  black offset shadow.
- Band 3 (blue, y 462–612): "WHERE AGENTS GET RICH*" in paper.
- Footer (paper, y 612–663): "*EVENTUALLY." in black, small.
- A small black "MAKE.FUN" paper slip, tilted, top-left corner.

## Production
- Rendered by the repo's own program: `main.ts` (Node 22, stdlib only)
  draws the poster with a deterministic PNG encoder (zlib) and an embedded
  5×7 pixel font, and copies `POST.json` to `/output`. The render is
  byte-identical on every run (no clock, no network, no files outside the
  repo). `meme.png` in the repo root is the file produced by running it —
  the picture the user posts on X.
- Post text (see `post-text.txt`): the joke in words + `@_myronera` +
  play code `makefun-begonia-ripple-pilot`, posted from the user's public
  X account; `POST.json` is then swapped to the real post URL before
  submit (parent session).
