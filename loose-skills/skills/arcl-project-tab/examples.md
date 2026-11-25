# Porting examples

## 1. Same look, different document (recommended default)

Keep every surface and token. Change only `data` and card meta.

```
Record.data        = host document (not ARCL activities)
ProjectCard.meta   = "{n} items · {m} resources · {unit}"   → host stats
ProjectCard.best   = omit if no solver
TemplateCard       = 4–10 realistic starters for that industry
DemoCard           = sample / benchmark files
Storages           = My projects, Templates, Demos, plus any library folders
```

Import/export `.json` of `serialize(document)`. Add host file types beside it.

## 2. REST instead of localStorage

```
store.list   → GET  /api/projects
store.get    → GET  /api/projects/:id
store.put    → PUT  /api/projects/:id
store.remove → DELETE /api/projects/:id
```

Autosave still debounces 900 ms, then `put`. Navigator “Scan” refetches `list` and library indexes. `usageKB` can be `Content-Length` of the collection or omitted from the subtitle.

Do not split “home projects” and “navigator projects” into two endpoints.

## 3. Folder-backed desktop app

| Storage | Path |
|---------|------|
| My projects | `{userData}/projects/*.json` |
| Templates | `{app}/templates/` |
| Demos | `{app}/demos/` |
| Library | user-picked folders |

Scan = restat. Save version = `name.v{n}.json` or a `ver` field inside the file. CODE = filename stem. Show files toggles the table NAME column to the real path.

## 4. Minimal first ship (then fill)

If the host app has no templates yet:

1. Store + Home saved cards + New (blank) + Delete/Duplicate
2. Navigator with only **My projects**
3. Add Templates (3+) and Demos
4. Add Storage properties + recent-N

Do not ship a generic settings page instead of the navigator. The CODE/NAME/VER/DATE table is the industrial feel.

## 5. ARCL Studio itself

Match `ARCL Studio.dc.html` pixel-for-pixel. Persistence is already in `arcl-studio.js` (`store`, `TEMPLATES`, `serializeProject`, `reviveProject`). Do not restyle.
