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
        this.state.phase = "RECOVERY LINE";
        this.state.flags.add("contacted");
        this.ui.showBoot(false);
        this.ui.focusInput();
        this.clearLog();
        this.log("SYSTEM", "SESSION_START / MAY 06 2026 / RECOVERY_TECH_4", "system");
        this.log("SYSTEM", "Real audio bank loaded. Terminal defenses online.", "success");
        this.lore.unlockMany("start", false);
        this.log("CASE", "Two case files recovered from boot residue. Type lore.", "event");
        this.ai("Hello? Say nothing kind until you know which voice is mine. Type help. Then cameras.", "whisper");
        this.addFeed("Recovery line connected.");
        this.lastFrame = performance.now();
        this.loop();
        this.ui.render();
    }

    loop = () => {
        const now = performance.now();
        const delta = Math.min(0.05, (now - this.lastFrame) / 1000);
        this.lastFrame = now;
        this.director.update(delta);
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
        this.state.phase = "REBOOTED";
        this.audio.startAmbience();
        this.log("SYSTEM", `SESSION_REBOOT / LOOP_${loop} / MEMORY RESIDUE DETECTED`, "system");
        this.lore.unlockMany("start", false);
        this.log("CASE", "Boot residue restored baseline case files. Type lore.", "event");
        this.ai("You came back. Good. The line hates when you learn.", "whisper");
        this.addFeed("Loop restarted.");
        this.lastFrame = performance.now();
        this.ui.focusInput();
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
        } else if (this.state.seconds >= 180 && !this.state.finalChoice) {
            this.kill("Six AM arrived, but outside did not.", "shaft", "TIMEOUT");
        }
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
