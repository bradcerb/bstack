# Render identity

## Sub-features
- Chart PNGs byte-identical to the approved v4 design.
- Template output for the example model matches its golden.

## How to get to it (user POV)
Not user visible until it breaks: the email would look different.

## Driving it with verify.sh
Not driven here. `npm run golden` in the render kit runs in its CI; compare `SHA256SUMS` in evidence across runs by hand.

## Gotchas
Fonts and resvg are pinned. Upgrading either changes chart bytes; update goldens with `npm run golden -- --write` only after looking at the PNGs.
