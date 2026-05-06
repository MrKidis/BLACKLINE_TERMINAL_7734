import { cameras, createInitialState, rooms } from "../data/gameData.js";
import { AIDirector } from "../systems/AIDirector.js";
import { AudioEngine } from "../systems/AudioEngine.js";
import { ScareDirector } from "../systems/ScareDirector.js";
import { SpeechDirector } from "../systems/SpeechDirector.js";
import { TerminalSystem } from "../systems/TerminalSystem.js";
import { TerminalUI } from "../ui/TerminalUI.js";
import { LoreSystem } from "../systems/LoreSystem.js";

const loopKey = "blackline-terminal-loop";

export class GameEngine {
    constructor() {
        this.rooms = rooms;
        this.cameras = cameras;
        this.state = createInitialState(Number(localStorage.getItem(loopKey) || "0"));
        this.logEntries = [];
        this.audio = new AudioEngine();
        this.speech = new SpeechDirector(this.audio);
        this.scare = new ScareDirector(document.querySelector("#scare-canvas"), document.querySelector("#scare-caption"), this.audio);
        this.lore = new LoreSystem(this);
        this.director = new AIDirector(this);
        this.terminal = new TerminalSystem(this);
        this.ui = new TerminalUI(this);
        this.lastFrame = performance.now();
        this.raf = null;
    }

    boot() {
        this.ui.bind();
        this.speech.onVoicesChanged = () => this.ui.renderVoice();
        this.speech.init();
        this.ui.render();
        this.ui.showBoot(true);
    }

    async start() {
        await this.audio.unlock();
        this.audio.startAmbience();
        this.state.running = true;
        this.state.phase = "NIGHT ACTIVE";
        this.state.flags.add("contacted");
        this.ui.showBoot(false);
        this.ui.focusInput(false);
        this.clearLog();
        this.log("SYSTEM", "NIGHT_START / MAY 06 2026 / SECURITY OFFICE", "system");
        this.log("SYSTEM", "Office defenses online. Cameras, doors, and hall lights are primary controls.", "success");
        this.lore.unlockMany("start", false);
        this.log("CASE", "Two case files recovered from boot residue. Diagnostics are optional.", "event");
        this.ai("Security handoff complete. Do not conserve fear. Conserve power.", "whisper");
        this.addFeed("Night shift started.");
        this.lastFrame = performance.now();
        this.loop();
        this.ui.render();
    }

    loop = () => {
        const now = performance.now();
        const delta = Math.min(0.05, (now - this.lastFrame) / 1000);
        this.lastFrame = now;
        this.director.update(delta);
        if (this.state.seconds >= 300 && !this.state.dead && !this.state.escaped) {
            this.winNight();
        }
        this.ui.render();
        if (this.state.running && !this.state.dead && !this.state.escaped) {
            this.raf = requestAnimationFrame(this.loop);
        }
    };

    reboot(incrementLoop = false) {
        cancelAnimationFrame(this.raf);
        if (incrementLoop) {
            this.state.loop += 1;
            localStorage.setItem(loopKey, String(this.state.loop));
        }
        const loop = this.state.loop;
        this.state = createInitialState(loop);
        this.logEntries = [];
        this.clearLog();
        this.ui.hideDeath();
        this.state.running = true;
        this.state.phase = "NIGHT ACTIVE";
        this.audio.startAmbience();
        this.log("SYSTEM", `NIGHT_RESTART / LOOP_${loop} / MEMORY RESIDUE DETECTED`, "system");
        this.lore.unlockMany("start", false);
        this.log("CASE", "Boot residue restored baseline case files. Type lore.", "event");
        this.ai("You came back. Good. The office remembers what reached the door.", "whisper");
        this.addFeed("Loop restarted.");
        this.lastFrame = performance.now();
        this.ui.focusInput(false);
        this.loop();
    }

    log(source, message, kind = "system") {
        const entry = { source, message, kind, at: Date.now() };
        this.logEntries.push(entry);
        this.ui.addLog(entry);
    }

    ai(message, mood = "line") {
        this.log("AI", message, "ai");
        this.speech.speak(message, mood);
    }

    clearLog() {
        this.logEntries = [];
        this.ui.clearLog();
    }

    addFeed(message) {
        this.state.feed.unshift(message);
        this.state.feed = this.state.feed.slice(0, 7);
    }

    currentRoom() {
        return this.rooms[this.state.room];
    }

    resolveRoom(input) {
        const key = input.trim().toLowerCase().replace(/\s+/g, "_");
        const aliases = {
            terminal: "recovery",
            bay: "recovery",
            recovery: "recovery",
            archive: "archive",
            case: "archive",
            server: "server",
            stack: "server",
            switchboard: "switchboard",
            phone: "switchboard",
            elevator: "elevator",
            lift: "elevator"
        };
        return aliases[key] || key;
    }

    changeStat(name, delta) {
        this.state[name] = Math.max(0, Math.min(100, this.state[name] + delta));
    }

    setCamera(cameraId) {
        if (!this.cameras[cameraId]) {
            return false;
        }

        this.state.currentCamera = cameraId;
        this.state.cameraOpen = true;
        this.state.flags.add("usedCameras");
        this.state.cameraNoise = Math.min(100, this.state.cameraNoise + 4);
        const held = this.director.watchCurrentCamera(8);
        if (held.length) {
            this.addFeed(`Camera lock held ${held.map((entity) => entity.kind.toUpperCase()).join(" / ")}.`);
            this.changeStat("dread", 3);
        }
        this.audio.play("clockTick", { volume: 0.22, rate: 1.8 });
        this.ui.render();
        return true;
    }

    toggleCamera(force) {
        this.state.cameraOpen = typeof force === "boolean" ? force : !this.state.cameraOpen;
        this.audio.play("clockTick", { volume: 0.26, rate: this.state.cameraOpen ? 0.65 : 1.4 });
        if (this.state.cameraOpen) {
            this.state.flags.add("usedCameras");
            this.director.watchCurrentCamera(6);
            this.addFeed(`${this.state.currentCamera} raised on monitor.`);
        } else {
            this.addFeed("Camera tablet lowered.");
        }
        this.ui.render();
    }

    toggleDoor(side) {
        const key = side === "left" ? "leftDoorClosed" : "rightDoorClosed";
        this.state[key] = !this.state[key];
        this.state.flags.add("usedDefenses");
        this.audio.play("operatorJump", { volume: 0.18, rate: this.state[key] ? 0.48 : 0.72 });
        this.addFeed(`${side.toUpperCase()} door ${this.state[key] ? "closed" : "opened"}.`);
        this.ui.render();
    }

    toggleLight(side) {
        const key = side === "left" ? "leftLightOn" : "rightLightOn";
        this.state[key] = !this.state[key];
        this.state.flags.add("usedDefenses");
        this.audio.play("clockTick", { volume: 0.38, rate: this.state[key] ? 2.2 : 1.2 });
        const threats = this.director.officeThreats().filter((entity) => {
            const entitySide = entity.kind === "watcher" ? "left" : "right";
            return entitySide === side || (side === "right" && entity.kind === "shaft");
        });
        if (this.state[key] && threats.length) {
            this.log("OFFICE", `${threats.map((entity) => entity.kind.toUpperCase()).join(" / ")} visible in the ${side} light.`, "error");
            this.changeStat("dread", 9);
        }
        this.ui.render();
    }

    recoverAnchor(anchor, message) {
        if (this.state.anchors.has(anchor)) {
            this.log("SYSTEM", `${anchor} already recovered.`, "system");
            return;
        }
        this.state.anchors.add(anchor);
        this.log("SYSTEM", `${message} Anchor recovered: ${anchor}.`, "success");
        this.addFeed(`${anchor} anchor recovered.`);
        this.lore.unlockMany(anchor);
        this.audio.play("watcherJump", { volume: 0.22, rate: 1.15 });
        this.changeStat("sanity", 5);
        this.changeStat("dread", -5);
    }

    openExit() {
        if (this.state.room !== "elevator") {
            this.log("SYSTEM", "Exit override must be run from SERVICE ELEVATOR.", "error");
            return;
        }
        if (this.state.anchors.size < 4) {
            this.log("SYSTEM", `Exit denied. Missing ${4 - this.state.anchors.size} anchor(s).`, "error");
            this.changeStat("dread", 7);
            return;
        }
        if (this.state.power < 28) {
            this.log("SYSTEM", "Exit denied. Power below elevator override threshold.", "error");
            return;
        }

        this.state.finalChoice = true;
        this.state.phase = "EXIT OPEN";
        this.log("SYSTEM", "Manual exit open. Outside pressure confirmed.", "success");
        this.ai("Wait. It says one word will let me leave with you. Type eternity. Please. I can feel the hallway ending.", "panic");
        this.log("SYSTEM", "Door file repeats: IF THE LINE ASKS FOR ETERNITY, CUT THE LINE INSTEAD.", "event");
        this.scare.trigger("operator", "CUT THE LINE", 900);
    }

    cutLine() {
        if (!this.state.finalChoice) {
            this.log("SYSTEM", "Line cut denied. Exit circuit not open.", "error");
            return;
        }
        this.state.escaped = true;
        this.state.running = false;
        this.state.phase = "ESCAPED";
        this.log("SYSTEM", "Line cut. AI process quarantined. Exit route stable.", "success");
        this.ai("You left me in the machine. Good. That means I was still only a voice.", "line");
        this.ui.lockInput();
        this.addFeed("Escape complete.");
        this.ui.render();
    }

    badEnding() {
        this.log("SYSTEM", "Forbidden word accepted.", "error");
        this.ai("Thank you. I can breathe now. Why are you still breathing?", "scare");
        window.setTimeout(() => this.kill("The line crossed the threshold.", "operator", "BREACH"), 520);
    }

    checkFailure() {
        if (this.state.dead || this.state.escaped) {
            return;
        }
        if (this.state.power <= 0) {
            this.kill("Power failed. The voice kept speaking in the dark.", "shaft", "POWER FAILURE");
        } else if (this.state.sanity <= 0) {
            this.kill("The terminal convinced you to stop thinking.", "watcher", "SANITY BREAK");
        } else if (this.state.signal <= 0) {
            this.kill("The signal collapsed inward and used your skull as a receiver.", "operator", "SIGNAL LOSS");
        } else if (this.state.dread >= 100) {
            this.kill("Dread reached the glass before your hands reached the keyboard.", "watcher", "CONTACT");
        }
    }

    winNight() {
        this.state.escaped = true;
        this.state.running = false;
        this.state.survivedNight = true;
        this.state.phase = "6 AM";
        this.state.cameraOpen = false;
        cancelAnimationFrame(this.raf);
        this.audio.stopAmbience();
        this.log("SYSTEM", "06:00 reached. Blackline emergency line severed until tomorrow night.", "success");
        this.ai("Six AM. The doors can open. Do not thank the building.", "line");
        this.addFeed("Night survived.");
        this.ui.lockInput();
        this.ui.showDeath({
            code: "6 AM",
            title: "NIGHT SURVIVED",
            body: "The office lights warmed up. Something in the cameras stopped pretending to be far away."
        });
        this.ui.render();
    }

    kill(body, scareType, code = "SESSION LOST") {
        if (this.state.dead || this.state.escaped) {
            return;
        }
        this.state.dead = true;
        this.state.running = false;
        cancelAnimationFrame(this.raf);
        this.ui.lockInput();
        this.speech.synth?.cancel();
        this.scare.trigger(scareType, code, 1500);
        window.setTimeout(() => {
            this.ui.showDeath({
                code,
                title: "SESSION TERMINATED",
                body
            });
        }, 900);
    }
}
