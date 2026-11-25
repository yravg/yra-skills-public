# Tokens, not raw values

**When:** you write or fix any colour, size, radius, shadow or font in a screen.

Use the project's design tokens. A raw hex or pixel value is a defect unless no token exists.

Rules:
- Find the token file first (for a canvas, its shared CSS variables; for an app, its tokens file). Reuse a token before you add one.
- A missing token is added once in the token file, never inline in a board or component.
- Blend states from tokens (for example `color-mix` of two tokens), not from a new hex.
- Global tokens belong to the owner: propose a change, do not apply it.
