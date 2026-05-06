import { cameras, objectiveText } from "../data/gameData.js";

const selectors = {
    log: "#terminal-log",
    form: "#terminal-form",
    input: "#terminal-input",
    start: "#start-button",
    boot: "#boot-screen",
    death: "#death-screen",
    deathCode: "#death-code",
    deathTitle: "#death-title",
    deathBody: "#death-body",
    restart: "#restart-button",
    phase: "#phase-label",
    clock: "#clock-label",
    voice: "#voice-label",
    loop: "#loop-label",
    powerMeter: "#power-meter",
    sanityMeter: "#sanity-meter",
    signalMeter: "#signal-meter",
    dreadMeter: "#dread-meter",
    powerValue: "#power-value",
    sanityValue: "#sanity-value",
    signalValue: "#signal-value",
    dreadValue: "#dread-value",
    map: "#map-grid",
    objectives: "#objective-list",
    voiceSelect: "#voice-select",
    voiceStatus: "#voice-status",
    ttsToggle: "#tts-toggle",
    ambienceToggle: "#ambience-toggle",
    cameraLabel: "#camera-label",
    entityLabel: "#entity-label",
    cameraText: "#camera-text",
    cameraGhost: "#camera-ghost",
    inventory: "#inventory-list",
    feed: "#event-feed"
};

export class TerminalUI {
    constructor(engine) {
        this.engine = engine;
        this.els = Object.fromEntries(Object.entries(selectors).map(([key, selector]) => [key, document.querySelector(selector)]));
        this.historyIndex = 0;
        this.voiceSignature = "";
    }

    bind() {
        this.els.start.addEventListener("click", () => this.engine.start());
        this.els.restart.addEventListener("click", () => this.engine.reboot(true));

        this.els.form.addEventListener("submit", (event) => {
            event.preventDefault();
            const value = this.els.input.value;
            this.els.input.value = "";
            this.engine.terminal.execute(value);
        });

        this.els.input.addEventListener("keydown", (event) => {
            const history = this.engine.state.commandHistory;
            if (event.key === "ArrowUp") {
                event.preventDefault();
                this.historyIndex = Math.max(0, this.historyIndex - 1);
                this.els.input.value = history[this.historyIndex] || "";
            }
            if (event.key === "ArrowDown") {
                event.preventDefault();
                this.historyIndex = Math.min(history.length, this.historyIndex + 1);
                this.els.input.value = history[this.historyIndex] || "";
            }
            if (event.key === "Tab") {
                event.preventDefault();
                this.autocomplete();
            }
        });

        this.els.ttsToggle.addEventListener("change", () => {
            this.engine.speech.setEnabled(this.els.ttsToggle.checked);
            this.render();
        });

        this.els.ambienceToggle.addEventListener("change", () => {
            this.engine.audio.setAmbienceEnabled(this.els.ambienceToggle.checked);
        });

        this.els.voiceSelect.addEventListener("change", () => {
            this.engine.speech.setVoiceByIndex(Number(this.els.voiceSelect.value));
            this.engine.speech.speak("Google British voice locked.", "whisper");
            this.renderVoice();
        });
    }

    autocomplete() {
        const prefix = this.els.input.value.toLowerCase();
        const room = this.engine.currentRoom();
        const candidates = [
            "help", "status", "scan", "cameras", "listen", "hide", "breathe", "lights",
            "call 7734", "decrypt prime 13", "decrypt camera 0417", "remember i am awake",
            "use fuse", "open exit", "cut line", "reboot",
            ...Object.keys(room.files).map((file) => `read ${file}`),
            ...room.exits.map((exit) => `go ${exit}`),
            ...Object.keys(cameras).map((camera) => `cam ${camera}`)
        ];
        const found = candidates.find((candidate) => candidate.startsWith(prefix));
        if (found) {
            this.els.input.value = found;
        }
    }

    addLog(entry) {
        const line = document.createElement("p");
        line.className = `log-line ${entry.kind}`;
        line.innerHTML = `<span>${entry.source}</span>${this.escape(entry.message).replace(/\n/g, "<br>")}`;
        this.els.log.appendChild(line);
        this.els.log.scrollTop = this.els.log.scrollHeight;
    }

    clearLog() {
        this.els.log.innerHTML = "";
    }

    showBoot(show) {
        this.els.boot.classList.toggle("hidden", !show);
    }

    showDeath(details) {
        this.els.deathCode.textContent = details.code;
        this.els.deathTitle.textContent = details.title;
        this.els.deathBody.textContent = details.body;
        this.els.death.classList.add("visible");
        this.els.death.setAttribute("aria-hidden", "false");
    }

    hideDeath() {
        this.els.death.classList.remove("visible");
        this.els.death.setAttribute("aria-hidden", "true");
    }

    render() {
        const s = this.engine.state;
        this.historyIndex = s.commandHistory.length;
        this.els.phase.textContent = s.phase;
        this.els.voice.textContent = this.engine.speech.enabled
            ? this.engine.speech.voice ? "TTS: GOOGLE UK" : "TTS: EN-GB FORCED"
            : "TTS: OFF";
        this.els.loop.textContent = `LOOP ${s.loop}`;

        const hour = 3 + Math.floor(s.seconds / 60);
        const minute = Math.floor(s.seconds % 60);
        this.els.clock.textContent = `${String(Math.min(6, hour)).padStart(2, "0")}:${String(minute).padStart(2, "0")} AM`;

        this.setMeter("power", s.power);
        this.setMeter("sanity", s.sanity);
        this.setMeter("signal", s.signal);
        this.setMeter("dread", s.dread);
        document.body.dataset.alert = s.dread > 70 ? "red" : s.power < 25 ? "amber" : "green";

        this.renderMap();
        this.renderObjectives();
        this.renderCamera();
        this.renderInventory();
        this.renderVoice();
    }

    renderVoice() {
        const voices = this.engine.speech.targetVoices;
        if (!this.engine.speech.voices.length) {
            this.voiceSignature = "";
            this.els.voiceSelect.innerHTML = "<option>Loading Google UK voice</option>";
            this.els.voiceSelect.disabled = true;
            this.els.voiceStatus.textContent = window.speechSynthesis ? "Waiting for browser voices." : "No Web Speech API in this browser.";
            return;
        }

        if (!voices.length) {
            this.voiceSignature = "";
            this.els.voiceSelect.innerHTML = "<option>Forced en-GB channel</option>";
            this.els.voiceSelect.disabled = true;
            this.els.voiceStatus.textContent = "Google UK voice is not exposed here; forcing en-GB speech instead of muting.";
            return;
        }

        const selected = voices.indexOf(this.engine.speech.voice);
        const currentValue = this.els.voiceSelect.value;
        const signature = voices.map((voice) => `${voice.name}:${voice.lang}`).join("|");
        if (this.voiceSignature !== signature) {
            this.voiceSignature = signature;
            this.els.voiceSelect.innerHTML = "";
            voices.forEach((voice, index) => {
                const option = document.createElement("option");
                option.value = String(index);
                option.textContent = `${voice.name} (${voice.lang})`;
                this.els.voiceSelect.appendChild(option);
            });
        }
        this.els.voiceSelect.value = selected >= 0 ? String(selected) : currentValue;
        this.els.voiceSelect.disabled = voices.length === 1;
        const name = this.engine.speech.voice?.name || "No voice selected";
        this.els.voiceStatus.textContent = `Locked to Google British English: ${name}`;
    }

    setMeter(name, value) {
        const rounded = Math.round(Math.max(0, Math.min(100, value)));
        this.els[`${name}Meter`].value = rounded;
        this.els[`${name}Value`].textContent = String(rounded).padStart(2, "0");
    }

    renderMap() {
        this.els.map.innerHTML = "";
        Object.entries(this.engine.rooms).forEach(([key, room]) => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "map-node";
            button.classList.toggle("current", key === this.engine.state.room);
            button.classList.toggle("sealed", this.engine.state.seals.has(key));
            button.textContent = room.label;
            button.addEventListener("click", () => {
                this.els.input.value = `go ${key}`;
                this.els.input.focus();
            });
            this.els.map.appendChild(button);
        });
    }

    renderObjectives() {
        const s = this.engine.state;
        const done = [
            s.flags.has("contacted"),
            s.anchors.size >= 4,
            s.flags.has("usedDefenses"),
            s.finalChoice || s.escaped,
            s.escaped
        ];
        this.els.objectives.innerHTML = "";
        objectiveText.forEach((text, index) => {
            const li = document.createElement("li");
            li.textContent = text;
            li.classList.toggle("done", done[index]);
            this.els.objectives.appendChild(li);
        });
    }

    renderCamera() {
        const summary = this.engine.director.cameraSummary();
        const noise = Math.round(this.engine.state.cameraNoise);
        this.els.cameraLabel.textContent = `${summary.camera} / ${summary.label}`;
        this.els.entityLabel.textContent = summary.entities.length ? summary.entities.join(" / ") : `NO MOTION / NOISE ${noise}`;
        this.els.cameraText.textContent = summary.text;
        this.els.cameraGhost.className = `camera-ghost ${summary.entities.length ? "visible" : ""}`;
        this.els.cameraGhost.dataset.kind = summary.entities[0] || "";
    }

    renderInventory() {
        const anchors = [...this.engine.state.anchors].map((item) => `<b>${item}</b>`).join(" ");
        const items = [...this.engine.state.inventory].map((item) => item.replace(/_/g, " ").toUpperCase()).join(" / ");
        this.els.inventory.innerHTML = `<strong>ANCHORS</strong><span>${anchors || "NONE"}</span><strong>ITEMS</strong><span>${items || "EMPTY"}</span>`;
        this.els.feed.innerHTML = this.engine.state.feed.map((item) => `<p>${this.escape(item)}</p>`).join("");
    }

    focusInput() {
        this.els.input.disabled = false;
        this.els.input.focus();
    }

    lockInput() {
        this.els.input.disabled = true;
    }

    escape(text) {
        return text.replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#039;"
        }[char]));
    }
}
