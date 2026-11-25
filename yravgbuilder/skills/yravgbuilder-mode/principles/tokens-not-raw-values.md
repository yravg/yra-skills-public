# Tokens, not raw values

**When:** any colour, size, radius, spacing, font or duration is set.

Use the project's tokens. A look change goes into the token or design stylesheet, not into JSX.

Rules:
- No raw hex, rgb or px in component CSS where a token exists. Canvas, SVG, PDF and Excel code may keep raw values.
- Two token vocabularies: map once in a bridge block; never mix them in one component.
- Global tokens, fonts and the accent are the owner's. Ask before you change them.
