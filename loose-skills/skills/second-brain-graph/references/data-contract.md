# Data contract and backend recipes

## Endpoint
`GET /api/graph?layer=<id>&focus=<id>&hops=1&hubs=0`
- no `focus` → whole layer `{nodes, edges, layer, projectLabel?, hint?}`
- `focus` → star `{focus, nodes, edges}`; first node has `focus:true`.

## Node fields
| field | required | used by |
|---|---|---|
| id | yes | identity, edges, `show(id)` |
| label | yes | drawn text (pane strips `Table|Letter|Exhibit X — ` prefix) |
| title | no | hover tip, search |
| kind | yes | Kinds chips, Departments colouring, link-list groups, `openGraphNode` switch |
| group | yes | Folders colouring, legend |
| degree | yes | hub detection, radius, rings layout |
| color | no | kept on semantic themes (Canopy) |
| focus / via | star only | centre pin; `in` = outer ring dimmed |
| note, cop_id, letter_id, wi_id | no | routing hints copied to `<a data-*>` |

Ids for non-note entities are namespaced: `cop:COP-012`, `letter:OUT-045`, `wi:WI-003`, `contract:article:7.2`. Notes use the note name (Obsidian style, unique per vault).

## Layers used in the source project
| layer | nodes | edges |
|---|---|---|
| vault | every Markdown note (group = top folder) | wikilinks, degree = links + backlinks |
| project | COPs (group = COP folder), letters (In/Out/WIP), WIs, contract hubs from citations | COP→letter refs (filename regex), COP↔WI related, entity→contract cite |
| letters | letters only | letter→COP/WI mentions |
| wis | WIs only | WI→COP/letter |

## Building a star for a live entity
```python
g = star_around({"id":"wi:WI-003","label":"WI-003","kind":"wi","group":"WIs"},
                [{"id":"cop:COP-012","label":"COP-012","kind":"cop","group":"COPs"},
                 *parse_cites(wi_text, hub_note)])
g = merge_live_neighbors(g, letters, mentions=lambda r,f: "WI-003" in r["text"],
                         to_node=lambda r: {"id":f"letter:{r['id']}","label":r["subject"],"kind":"letter","group":r["dir"]})
```
`merge_live_neighbors` caps at 40 and marks additions `via:"in"` so a letter that merely mentions the focus does not look like a first-class link.

## Contract hubs
Citations (`Article 7.2`, `Exhibit B`, `Annex 3`) become `contract:*` nodes whose `note` field points at the vault note for that clause (`hub_note(kind, ident)` lookup: exhibit letter → note name, article → article note, else overview note). `openGraphNode` opens that note. The hubs checkbox on the map adds/removes these nodes because they connect almost everything.

## Chat context
`WikiVault.expand(names, hops=1)` returns the preset notes plus their wikilink neighbours. The chat builder feeds that list into the prompt, so the same links that draw the graph also decide what the model reads. See the `lettercop-memory-vault` skill.
