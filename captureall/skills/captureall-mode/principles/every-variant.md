# Every variant

**When:** planning a capture of a site, page or component.

Capture each theme (light, dark, brand skins), style (for example classic and clean), viewport (phone 360, tablet 768, desktop 1280 or wider) and motion setting (normal and reduced) the target offers. One view hides half the design and most of the bugs.

Rules:
- Find how the target stores each setting first: localStorage keys, a data attribute on html, a cookie, a query string, or only its own toggle. Set it the same way.
- Verify the variant really applied: a root attribute or a token value differs between variants. If not, the capture is a duplicate; fix the setter.
- Name variants `<theme>-<style>_<viewport>` so files sort together.
- Count the matrix before starting: pages × variants × viewports. Above 2000 captures, pause and ask.
