---
name: refero
description: >-
  Search Refero for shipped websites, iOS apps, design styles, screens, and
  flows. Use when the user runs /refero or asks for design references, visual
  direction, UI patterns, or real product examples.
disable-model-invocation: true
---

# Refero

Call the Refero MCP. If this session already exposes `refero_*` tools, use those. Otherwise run `scripts/refero.py` in this skill directory. Do not invent references.

```text
python scripts/refero.py call <tool> "<json>"
```

Token comes from `REFERO_MCP_TOKEN`, else the Refero server in `~/.cursor/mcp.json`. Never print it.

## Which tool

- Look, type, color, layout: `refero_search_styles`, then `refero_get_style` (`style_id` or `style_ids`, max 10, prefer 3–4).
- Concrete UI: `refero_search_screens` with `platform` `web` or `ios`, then `refero_get_screen`.
- More like one screen: `refero_get_similar_screens`.
- Need the pixels: `refero_get_screen_image` (`image_size` `thumbnail` or `full`).
- A journey: `refero_search_flows` with `platform`, then `refero_get_flow` (`flow_id` is a number).
- Find a product: `refero_search_site` or `refero_search_app`. Reuse the name in later queries. The catalog id is not a screen filter.

`query` is at least 2 characters. `response_format` is `md` (default) or `json`. Next page is `page`.

Screens are UUIDs. Do not pass `limit`, `offset`, `image_size`, or `include_similar` to search. Do not use `*_tool` names or `get_design_guidance`.

Search more than one angle. Styles are ingredients, not a template to copy.

## Output

Cite title plus `url` or `refero_url`, and the pattern you are taking.
