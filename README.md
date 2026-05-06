# BLACKLINE_NIGHTSHIFT

Original fixed-camera night-shift horror game with a modular browser engine, full security-office view, live surveillance tablet, door/light/power loop, moving threat entities, scary male UK browser TTS, real downloaded horror audio, animated canvas jumpscares, and 6 AM survival.

## Run

Use any static server from the repo root:

```powershell
python -m http.server 8787 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:8787/index.html
```

## GitHub Pages

The static site is published to the `gh-pages` branch. In GitHub, enable Pages with:

- Source: `Deploy from a branch`
- Branch: `gh-pages`
- Folder: `/ (root)`

After GitHub finishes publishing, the game URL is:

```text
https://mrkidis.github.io/BLACKLINE_TERMINAL_7734/
```

## Core Loop

- Survive from 12 AM to 6 AM.
- Use `Space` to raise/lower the camera tablet.
- Use `1`-`5` or the camera buttons to switch feeds.
- Use `A`/`D` for left/right doors and `Q`/`E` for left/right hall lights.
- Cameras can stall entities briefly; doors stop hallway attacks; every defense drains power.

## Engine Layout

- `src/core/GameEngine.js` owns game state, loop, office controls, night survival, and system wiring.
- `src/systems/TerminalSystem.js` remains as an optional diagnostics parser.
- `src/systems/LoreSystem.js` unlocks case files, tape transcripts, and trace evidence.
- `src/systems/AIDirector.js` moves threats, creates random events, and drives FNAF-style pressure.
- `src/systems/AudioEngine.js` loads and plays real downloaded ambience and scare sounds.
- `src/systems/SpeechDirector.js` locks to the Google British English male voice when the browser exposes it. If the browser does not expose that voice, it forces lower-pitch `en-GB` speech so the game does not go silent.
- `src/systems/ScareDirector.js` draws animated jumpscares on canvas.
- `src/ui/TerminalUI.js` renders the office, HUD, controls, camera tablet, objectives, diagnostics, and voice controls.
- `src/data/cameraScenes.js` defines camera-room geometry, entity positions, and surveillance contact behavior.
- `docs/AUDIO_CREDITS.md` documents every bundled audio source and license.

