# BLACKLINE_TERMINAL_7734

Psychological horror terminal game prototype with a modular browser game engine, real downloaded horror audio, local AI director, camera pressure, terminal commands, scary browser TTS, animated jumpscares, and escape/reboot loops.

## Run

Use any static server from the repo root:

```powershell
python -m http.server 8787 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8787/index.html
```

## Core Loop

- Use `help`, `scan`, `cameras`, and `cam <id>` to learn the facility.
- Use `seal <room>`, `unseal <room>`, `lights`, `hide`, and `breathe` to survive entity pressure.
- Recover anchors with `decrypt prime 13`, `call 7734`, `decrypt camera 0417`, and `remember i am awake`.
- Reach the elevator, run `open exit`, then `cut line`.

## Engine Layout

- `src/core/GameEngine.js` owns game state, loop, failure, escape, and system wiring.
- `src/systems/TerminalSystem.js` parses commands and applies game rules.
- `src/systems/AIDirector.js` moves threats, creates random events, and drives FNAF-style pressure.
- `src/systems/AudioEngine.js` loads and plays real downloaded ambience and scare sounds.
- `src/systems/SpeechDirector.js` locks to Google British English when the browser exposes it. If the browser does not expose that voice, it forces `en-GB` speech so the game does not go silent.
- `src/systems/ScareDirector.js` draws animated jumpscares on canvas.
- `src/ui/TerminalUI.js` renders the terminal, HUD, camera feed, objectives, and voice controls.
- `docs/AUDIO_CREDITS.md` documents every bundled audio source and license.

## GitHub

This local checkout currently has no remote configured. Add a remote for `BLACKLINE_TERMINAL_7734`, then push:

```powershell
git remote add origin https://github.com/<owner>/BLACKLINE_TERMINAL_7734.git
git push -u origin master
```
