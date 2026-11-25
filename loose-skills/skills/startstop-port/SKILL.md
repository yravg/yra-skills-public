---
name: startstop-port
description: >-
  Use when a project folder has no start.bat / stop.bat / Start_*.bat /
  Stop_*.bat, when the user asks to add, create, or generate a start/stop
  launcher from scratch, when creating or updating those bats, changing a
  localhost port, editing launch.json port, fixing silent start / empty log /
  log lock, or says startstop-port, APP_PORT, taskkill by port, or .pid file.
  Missing bats is the main case, not a reason to skip. Default for 127.0.0.1.
  Same-port clones on 127.0.0.x are startstop-server.
---

# startstop-port

**Identity is the TCP port on `127.0.0.1`.** Missing start/stop bats → **create the pair now**. Existing bats → change one `APP_PORT` and lockstep siblings. Do not invent a `127.0.0.x` bind (that is `startstop-server`).

## Create or update

| What you see | Do |
|--------------|----|
| No `start.bat` / `stop.bat` / `Start_*.bat` / `Stop_*.bat` / `start.cmd` / `start.ps1` | **CREATE** both files from the templates below. This is the main job. |
| Only start or only stop | Create the missing one so the pair matches. |
| Pair exists, user wants a new port or a bugfix | **UPDATE** the one `APP_PORT` line + lockstep files. Do not rewrite a working script. |
| User said startstop / add launcher / this folder needs start-stop | Create or update. Do not ask permission to write the bats. |

Do not skip because “there is nothing to update.” No bats **is** the work.

## CREATE (folder has no bats)

Do this in order. Keep it small: two bat files, plus a port in the server/config only if it already has one.

1. **Detect the start command** (first match wins):

   | Evidence | Command | Mode |
   |----------|---------|------|
   | `package.json` scripts `dev` / `start` / `serve` / `preview` | `npm run <that>` | foreground |
   | `docker-compose.yml` / `compose.yaml` | `docker compose up` | foreground |
   | `manage.py` | `python manage.py runserver` | foreground |
   | `app.py` / `main.py` / `momt-server.js` / other HTTP server | that file, pass port if it accepts one | **hidden + log** |
   | `*.html` only | `python -m http.server %APP_PORT%` | hidden + log |
   | nothing | `echo No start command detected. Edit this start.bat. & pause` | still write **both** bats |

2. **Pick `APP_PORT`.** Read vite/next config, `defaults.json`, server default, `.claude/launch.json`, `.vscode/launch.json`. If none: choose an unused port (check `netstat` LISTENING). Avoid shared defaults unless that is truly the app's port: 3000, 3001, 4173, 5173, 5174, 8000, 8080. Prefer a new port over a new loopback IP.

3. **Names.** YRLocalMonitor scans `start.bat` / `stop.bat` — use those in a normal project folder. Use `Start_<App>.bat` / `Stop_<App>.bat` only when the user wants a named launcher (this app's own copy, not the generic pair).

4. **Write both files** from the templates. Hidden mode = Start template (log + `Start-Process` Hidden). Foreground = same kill-order + PID write, then the command in this window (no Hidden, no `>> log`). Python hidden: `set PYTHONUNBUFFERED=1`.

5. **Lockstep.** If the server hard-codes a port, set it to `APP_PORT` (or pass it as argv). If `.claude/launch.json` or `.vscode/launch.json` exists, set `port` / `runtimeArgs` / `url`. Do not create launch.json unless the user asked or that folder already exists.

6. **Verify by running the bats** (table at the bottom). Creating without running them is not done.

## Port vs server

| Need | Skill |
|------|--------|
| Unique port, `http://127.0.0.1:N/` | **this skill** (default, including first-time create) |
| Two copies on the **same** port | `startstop-server` |

## Hard rules

1. One `set "APP_PORT=N"` at the top of **each** bat. No raw port numbers in `findstr` or URLs.
2. Kill **PID file first** (`taskkill /F /T /PID`), then port fallback. Port-only kill leaves an instance that moved port; its parent `cmd` keeps `*.log` open; next start dies with an **empty log and no error**.
3. `setlocal EnableExtensions EnableDelayedExpansion` — required for `set /p` + `!old_pid!`.
4. Wait after kill: `ping -n 2 127.0.0.1 >nul` (log-handle release).
5. Never `taskkill` a shared default port unless the process command line contains this folder, or the user confirmed.
6. Always write **start and stop together**.

## Kill order (Start and Stop)

```
1. If .local-server.pid exists → digits only → taskkill /F /T /PID → del pid file
2. Fallback: LISTENING on :%APP_PORT% → taskkill /F /PID
   (path-match first if the port is shared)
3. ping -n 2 127.0.0.1 >nul
```

PID file only covers instances **this** Start wrote. An old window from before these bats must be Stopped once by hand.

## Lockstep (create and update)

- `start.bat` / `Start_*.bat` — `APP_PORT`
- `stop.bat` / `Stop_*.bat` — `APP_PORT`
- server default if it has one (`defaults.json`, `app.py`, `momt-server.js`)
- existing `.claude/launch.json` / `.vscode/launch.json`

One comment at the top of each bat lists the siblings.

## Start template (hidden local server + log)

Foreground `npm run dev`: same kill-order + PID write, then the command in this window.

```bat
@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

rem Unique port for this folder. Change this line only, then the siblings
rem listed here: stop.bat, defaults.json / server default, .claude\launch.json
set "APP_PORT=3334"
set "PID_FILE=.local-server.pid"
set "LOG_FILE=server.log"

if exist "%PID_FILE%" (
    set "old_pid="
    set /p "old_pid="<"%PID_FILE%"
    for /f "delims=0123456789" %%a in ("!old_pid!") do set "old_pid="
    if defined old_pid taskkill /F /T /PID !old_pid! >nul 2>&1
    del /Q "%PID_FILE%" >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr /R /C:":%APP_PORT% .*LISTENING"') do taskkill /F /PID %%a >nul 2>&1
ping -n 2 127.0.0.1 >nul

powershell -NoProfile -ExecutionPolicy Bypass -Command "$wd=(Get-Location).Path; $cmd='node server.js %APP_PORT% >> %LOG_FILE% 2>&1'; $p=Start-Process -FilePath $env:ComSpec -ArgumentList @('/d','/s','/c',$cmd) -WorkingDirectory $wd -WindowStyle Hidden -PassThru; Set-Content -LiteralPath (Join-Path $wd '%PID_FILE%') -Value $p.Id -Encoding ASCII"

ping -n 3 127.0.0.1 >nul
for /L %%i in (1,1,10) do (
    netstat -ano -p tcp | findstr /R /C:":%APP_PORT% .*LISTENING" >nul
    if not errorlevel 1 goto ready
    if not %%i==10 ping -n 2 127.0.0.1 >nul
)
echo Failed on port %APP_PORT%. If %LOG_FILE% is empty, an old instance still has the log locked — run stop.bat.
if exist "%LOG_FILE%" powershell -NoProfile -Command "Get-Content -LiteralPath '%LOG_FILE%' -Tail 10"
pause
exit /b 1
:ready
start "" "http://127.0.0.1:%APP_PORT%/"
echo Running at http://127.0.0.1:%APP_PORT%/
exit /b 0
```

Swap `node server.js %APP_PORT%` for this folder's command. If the app reads port from config, keep `APP_PORT` equal to that config.

## Stop template

```bat
@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"
set "APP_PORT=3334"
set "PID_FILE=.local-server.pid"
set "stopped=0"

if exist "%PID_FILE%" (
    set "server_pid="
    set /p "server_pid="<"%PID_FILE%"
    for /f "delims=0123456789" %%a in ("!server_pid!") do set "server_pid="
    if defined server_pid (
        taskkill /F /T /PID !server_pid! >nul 2>&1
        if not errorlevel 1 set "stopped=1"
    )
    del /Q "%PID_FILE%" >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano -p tcp ^| findstr /R /C:":%APP_PORT% .*LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    if not errorlevel 1 set "stopped=1"
)

if "!stopped!"=="1" (echo Stopped port %APP_PORT%.) else (echo Port %APP_PORT% is not running.)
exit /b 0
```

## YRLocalMonitor

- This app's launcher: `Start_YRLocalMonitor.bat` / `Stop_YRLocalMonitor.bat` (`127.0.0.1:17892` = `defaults.json`). `run.bat` = foreground debug.
- Bats **this app generates** for other folders: `start.bat` / `stop.bat` via `yrlocalmonitor/bats.py` (PID first, path-match on shared ports). Prefer that generator when working inside YRLocalMonitor; in any other folder, write the files yourself from this skill.
- Do not bind `0.0.0.0`.

## Common mistakes

| Excuse | Reality |
|--------|---------|
| "No bats yet, nothing to do / only update existing" | CREATE the pair from the templates |
| "Ask if they want bats" | They asked for startstop — write them |
| "Start.bat only" | Always write start **and** stop |
| "Just taskkill the port" | Old instance on another port locks the log |
| "Hard-code the port in findstr and launch.json" | One variable + lockstep |
| "Skip the ping after kill" | Next `>> log` fails silently |
| "No EnableDelayedExpansion" | PID read is empty |
| "taskkill /F without /T" | Parent `cmd` keeps the log open |
| "Bind 127.0.0.12 to avoid a clash" | Change the **port** unless they must keep the same port |

## Verify (run the bats)

| Case | Expect |
|------|--------|
| Clean start | Listening on `127.0.0.1:PORT`, pid written, exit 0 |
| Start while running | Old PID killed, new listener, HTTP 200 |
| Stop | No listener, pid file gone, exit 0 |
| Stop when idle | "not running", no error |
