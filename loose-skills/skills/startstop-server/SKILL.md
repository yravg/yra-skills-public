---
name: startstop-server
description: >-
  Use when a folder has no start/stop bats and the app must bind a specific
  address (127.0.0.2, 127.0.0.12, a LAN IP), when creating those bats from
  scratch, when two copies must share the same TCP port, when netstat kill must
  match host:port not :port, or when the user says startstop-server, APP_HOST,
  bind address, or 127.0.0.xxx. Missing bats is the main case, not a reason to
  skip. Normal unique-port localhost apps are startstop-port.
---

# startstop-server

**Identity is `APP_HOST:APP_PORT`.** Missing start/stop bats → **create the pair now** with both variables. Existing bats → change `APP_HOST` / `APP_PORT` only. Use this only when two folders must share the **same port**, or the user named a bind IP. Otherwise `startstop-port` and a new port.

Windows treats all of `127.0.0.0/8` as loopback, so `127.0.0.1:3334` and `127.0.0.2:3334` can both listen. `findstr :3334` still matches **both**. Kill and listen-check must include the host.

## Create or update

| What you see | Do |
|--------------|----|
| No start/stop bats | **CREATE** both from `startstop-port` templates, with `APP_HOST` + `host:port` match (below). |
| Only one of the pair | Create the missing one. |
| Pair exists | **UPDATE** `APP_HOST` and `APP_PORT` + lockstep. Do not rewrite a working script. |
| User said startstop-server / bind 127.0.0.x / same port as the other copy | Create or update. Do not skip because files are missing. |

## CREATE (no bats yet)

1. Confirm they need a bind IP (same port as a sibling folder, or a named LAN IP). If they just need a local app, switch to `startstop-port`.
2. Pick `APP_HOST` (e.g. `127.0.0.2` if `127.0.0.1` is the other copy) and `APP_PORT` (same as the sibling, or the port the app already uses).
3. Detect the start command the same way as `startstop-port` (package.json / docker / python / html / stub).
4. Write `start.bat` **and** `stop.bat` (or `Start_<App>.bat` / `Stop_<App>.bat` if they asked for named launchers). Hidden vs foreground: same rule as `startstop-port`.
5. Server must `listen(APP_PORT, APP_HOST)`. launch.json `url` is `http://%APP_HOST%:%APP_PORT%/`, never `localhost` if host is not `127.0.0.1`.
6. Run the bats. Confirm `netstat` shows **this** host, and the sibling on the other `127.0.0.x:sameport` is untouched.

## When to use which

| Situation | Skill |
|-----------|--------|
| Unique port, `http://127.0.0.1:N/` — including first-time create | `startstop-port` |
| Same port, two snapshot folders — including first-time create | **this skill** |
| LAN access from another machine | this skill — bind the LAN IP, not `0.0.0.0` unless asked |

## Hard rules

1. `set "APP_HOST=127.0.0.2"` and `set "APP_PORT=3334"` at the top of **both** bats. Same pair in the server listen call and launch.json `url`.
2. Kill PID file first (`taskkill /F /T /PID`), then `findstr /C:"%APP_HOST%:%APP_PORT% "` LISTENING — **not** `:%APP_PORT%`.
3. `EnableDelayedExpansion`. Wait `ping -n 2 127.0.0.1 >nul` after kill.
4. Always write **start and stop together**.
5. Verify by running the bats (clean start, start-while-running, stop, stop-when-idle).

## Kill / listen match

```bat
findstr /C:"%APP_HOST%:%APP_PORT% " | findstr LISTENING
```

`netstat` looks like `TCP    127.0.0.2:3334    0.0.0.0:0    LISTENING    1234`.

## Start (diff from startstop-port)

Copy the full Start/Stop templates from `startstop-port`. Change only host, match string, listen bind, and URL:

```bat
set "APP_HOST=127.0.0.2"
set "APP_PORT=3334"
set "PID_FILE=.local-server.pid"
set "LOG_FILE=server.log"

rem PID kill (same as startstop-port), then:
for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr /C:"%APP_HOST%:%APP_PORT% " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
ping -n 2 127.0.0.1 >nul

rem Launch must pass BOTH, e.g. node server.js %APP_PORT% %APP_HOST%
rem Listen check and start URL: http://%APP_HOST%:%APP_PORT%/
```

## YRLocalMonitor

Keep the monitor on `127.0.0.1:17892` (`startstop-port`). A **managed** folder with no bats that needs a bind IP: write `start.bat` / `stop.bat` here with `APP_HOST`, or use the monitor's generator then add `APP_HOST`. Listener scan already accepts `127.0.0.\d+`.

## Common mistakes

| Excuse | Reality |
|--------|---------|
| "No bats, skill is only for updates" | CREATE the pair with `APP_HOST` + `APP_PORT` |
| "Kill by port, host is just the URL" | Kills the sibling on `127.0.0.1:sameport` |
| "Use 127.0.0.12 instead of changing 3333→3334" | Port change is the default; bind IP is for same-port clones |
| "start http://localhost:PORT" | Hits `127.0.0.1`, not `127.0.0.2` |
| "findstr :PORT is close enough" | That is the clash this skill exists to prevent |
| "Start.bat only" | Always write start **and** stop |
