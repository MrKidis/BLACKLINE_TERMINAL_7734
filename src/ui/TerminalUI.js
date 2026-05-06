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
    powerReadout: "#power-readout",
    sanityValue: "#sanity-value",
    signalValue: "#signal-value",
    dreadValue: "#dread-value",
    map: "#map-grid",
    objectives: "#objective-list",
    voiceSelect: "#voice-select",
    voiceStatus: "#voice-status",
    ttsToggle: "#tts-toggle",
    ambienceToggle: "#ambience-toggle",
    diagnosticsToggle: "#diagnostics-toggle",
    diagnosticsPanel: "#diagnostics-panel",
    office: "#office-view",
    officeWarning: "#office-warning",
    leftDoor: "#left-door",
    rightDoor: "#right-door",
    leftThreat: "#left-threat",
    rightThreat: "#right-threat",
    centerThreat: "#center-threat",
    leftDoorButton: "#left-door-button",
    rightDoorButton: "#right-door-button",
    leftLightButton: "#left-light-button",
    rightLightButton: "#right-light-button",
    cameraToggle: "#camera-toggle-button",
    cameraClose: "#camera-close-button",
    cameraPanel: "#camera-panel",
    cameraLabel: "#camera-label",
    entityLabel: "#entity-label",
    cameraFeed: "#camera-feed",
    cameraRoom: "#camera-room",
    cameraEntities: "#camera-entities",
    cameraStatus: "#camera-status",
    cameraText: "#camera-text",
    inventory: "#inventory-list",
    caseFiles: "#case-file-list",
    feed: "#event-feed"
};

export class TerminalUI {
    constructor(engine) {
        this.engine = engine;
        this.els = Object.fromEntries(Object.entries(selectors).map(([key, selector]) => [key, document.querySelector(selector)]));
        this.historyIndex = 0;
        this.voiceSignature = "";
        this.cameraMapBuilt = false;
    }

    bind() {
        this.els.start.addEventListener("click", () => this.engine.start());
        this.els.restart.addEventListener("click", () => this.engine.reboot(true));
        this.els.leftDoorButton.addEventListener("click", () => this.engine.toggleDoor("left"));
        this.els.rightDoorButton.addEventListener("click", () => this.engine.toggleDoor("right"));
        this.els.leftLightButton.addEventListener("click", () => this.engine.toggleLight("left"));
        this.els.rightLightButton.addEventListener("click", () => this.engine.toggleLight("right"));
        this.els.cameraToggle.addEventListener("click", () => this.engine.toggleCamera());
        this.els.cameraClose.addEventListener("click", () => this.engine.toggleCamera(false));
        this.els.diagnosticsToggle.addEventListener("click", () => {
            this.els.diagnosticsPanel.classList.toggle("open");
        });

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
            this.engine.speech.speak("Google British male voice locked.", "whisper");
            this.renderVoice();
        });

        window.addEventListener("keydown", (event) => {
            if (event.target === this.els.input) {
                return;
            }

            const key = event.key.toLowerCase();
            const cameraKeys = ["1", "2", "3", "4", "5"];
            if (cameraKeys.includes(key)) {
                event.preventDefault();
                this.engine.setCamera(`CAM_0${Number(key) - 1}`);
            } else if (key === " " || key === "s") {
                event.preventDefault();
                this.engine.toggleCamera();
            } else if (key === "a") {
                event.preventDefault();
                this.engine.toggleDoor("left");
            } else if (key === "d") {
                event.preventDefault();
                this.engine.toggleDoor("right");
            } else if (key === "q") {
                event.preventDefault();
                this.engine.toggleLight("left");
            } else if (key === "e") {
                event.preventDefault();
                this.engine.toggleLight("right");
            }
        });
    }

    autocomplete() {
        const prefix = this.els.input.value.toLowerCase();
        const room = this.engine.currentRoom();
        const candidates = [
            "help", "status", "scan", "cameras", "listen", "hide", "breathe", "lights",
            "call 7734", "decrypt prime 13", "decrypt camera 0417", "remember i am awake",
            "use fuse", "lore", "trace", "tape orientation", "tape threshold", "open exit", "cut line", "reboot",
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
            ? this.engine.speech.voice ? "TTS: UK MALE" : "TTS: UK MALE FORCED"
            : "TTS: OFF";
        this.els.loop.textContent = `NIGHT ${s.loop + 1}`;

        const hours = ["12", "1", "2", "3", "4", "5", "6"];
        const hourIndex = Math.min(6, Math.floor(s.seconds / 50));
        this.els.clock.textContent = `${hours[hourIndex]} AM`;

        this.setMeter("power", s.power);
        this.setMeter("sanity", s.sanity);
        this.setMeter("signal", s.signal);
        this.setMeter("dread", s.dread);
        document.body.dataset.alert = s.dread > 70 ? "red" : s.power < 25 ? "amber" : "green";

        this.renderMap();
        this.renderObjectives();
        this.renderOffice();
        this.renderCamera();
        this.renderInventory();
        this.renderCaseFiles();
        this.renderVoice();
    }

    renderVoice() {
        const voices = this.engine.speech.targetVoices;
        if (!this.engine.speech.voices.length) {
            this.voiceSignature = "";
            this.els.voiceSelect.innerHTML = "<option>Loading Google UK male voice</option>";
            this.els.voiceSelect.disabled = true;
            this.els.voiceStatus.textContent = window.speechSynthesis ? "Waiting for browser voices." : "No Web Speech API in this browser.";
            return;
        }

        if (!voices.length) {
            this.voiceSignature = "";
            this.els.voiceSelect.innerHTML = "<option>Forced male en-GB channel</option>";
            this.els.voiceSelect.disabled = true;
            this.els.voiceStatus.textContent = "Google UK male voice is not exposed here; forcing lower-pitch en-GB speech instead of muting.";
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
        this.els.voiceStatus.textContent = `Locked to Google British male English: ${name}`;
    }

    setMeter(name, value) {
        const rounded = Math.round(Math.max(0, Math.min(100, value)));
        this.els[`${name}Meter`].value = rounded;
        this.els[`${name}Value`].textContent = String(rounded).padStart(2, "0");
        if (name === "power") {
            this.els.powerReadout.textContent = String(rounded).padStart(2, "0");
        }
    }

    renderMap() {
        if (!this.cameraMapBuilt) {
            this.els.map.innerHTML = "";
            Object.entries(cameras).forEach(([camera, config], index) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "map-node";
                button.dataset.camera = camera;
                button.textContent = `${index + 1}. ${camera} ${config.label}`;
                button.addEventListener("click", () => {
                    this.engine.setCamera(camera);
                });
                this.els.map.appendChild(button);
            });
            this.cameraMapBuilt = true;
        }

        this.els.map.querySelectorAll(".map-node").forEach((button) => {
            button.classList.toggle("current", button.dataset.camera === this.engine.state.currentCamera);
        });
    }

    renderObjectives() {
        const s = this.engine.state;
        const done = [
            s.survivedNight,
            s.flags.has("usedCameras") || s.cameraOpen || s.currentCamera !== "CAM_00",
            s.flags.has("usedDefenses"),
            s.leftLightOn || s.rightLightOn,
            s.escaped || s.survivedNight
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
        const noise = Math.round(summary.noise);
        const danger = summary.visuals.some((visual) => visual.pressure > 62);
        this.els.cameraLabel.textContent = `${summary.camera} / ${summary.label}`;
        this.els.entityLabel.textContent = summary.entities.length ? summary.entities.join(" / ") : `NO MOTION / NOISE ${noise}`;
        this.els.cameraStatus.textContent = `${summary.scene.code} / NOISE ${noise}% / ${summary.visuals.length ? "VISUAL CONTACT" : "SIGNAL CLEAN"}`;
        this.els.cameraText.textContent = summary.text;
        this.els.cameraPanel.classList.toggle("open", this.engine.state.cameraOpen);
        this.els.cameraFeed.dataset.camera = summary.camera;
        this.els.cameraFeed.dataset.room = summary.scene.roomClass;
        this.els.cameraFeed.dataset.depth = summary.scene.depth;
        this.els.cameraFeed.style.setProperty("--noise", String(Math.min(1, noise / 100)));
        this.els.cameraFeed.classList.toggle("visual-contact", summary.visuals.length > 0);
        this.els.cameraFeed.classList.toggle("danger-contact", danger);
        this.renderCameraRoom(summary.scene);
        this.renderCameraEntities(summary.visuals);
    }

    renderOffice() {
        const s = this.engine.state;
        const threats = this.engine.director.officeThreats();
        const leftThreat = threats.find((entity) => entity.kind === "watcher");
        const rightThreat = threats.find((entity) => entity.kind === "operator");
        const centerThreat = threats.find((entity) => entity.kind === "shaft");
        const leftVisible = Boolean(leftThreat && s.leftLightOn);
        const rightVisible = Boolean((rightThreat || centerThreat) && s.rightLightOn);

        this.els.office.dataset.leftDoor = s.leftDoorClosed ? "closed" : "open";
        this.els.office.dataset.rightDoor = s.rightDoorClosed ? "closed" : "open";
        this.els.office.dataset.leftLight = s.leftLightOn ? "on" : "off";
        this.els.office.dataset.rightLight = s.rightLightOn ? "on" : "off";
        this.els.office.dataset.camera = s.cameraOpen ? "open" : "closed";

        this.els.leftDoorButton.classList.toggle("active", s.leftDoorClosed);
        this.els.rightDoorButton.classList.toggle("active", s.rightDoorClosed);
        this.els.leftLightButton.classList.toggle("active", s.leftLightOn);
        this.els.rightLightButton.classList.toggle("active", s.rightLightOn);
        this.els.cameraToggle.classList.toggle("active", s.cameraOpen);

        this.els.leftThreat.classList.toggle("visible", leftVisible);
        this.els.rightThreat.classList.toggle("visible", rightVisible && Boolean(rightThreat));
        this.els.centerThreat.classList.toggle("visible", rightVisible && Boolean(centerThreat));
        this.els.officeWarning.textContent = threats.length ? "HALL CONTACT" : s.cameraOpen ? "CAMERA UP" : "QUIET";
        this.els.officeWarning.classList.toggle("danger", threats.length > 0);
    }

    renderCameraRoom(scene) {
        this.els.cameraRoom.className = `camera-room ${scene.roomClass}`;
        this.els.cameraRoom.innerHTML = `
            <div class="cam-depth-wall"></div>
            <div class="cam-floor"></div>
            ${scene.details.map((detail) => `<span class="cam-prop ${detail}"></span>`).join("")}
        `;
    }

    renderCameraEntities(visuals) {
        this.els.cameraEntities.innerHTML = "";
        visuals.forEach((visual) => {
            const entity = document.createElement("div");
            entity.className = `camera-entity ${visual.className} ${visual.pose}${visual.held ? " held" : ""}`;
            entity.style.setProperty("--x", `${visual.x}%`);
            entity.style.setProperty("--y", `${visual.y}%`);
            entity.style.setProperty("--scale", visual.scale);
            entity.style.setProperty("--depth", visual.depth);
            entity.style.setProperty("--blur", `${visual.blur}px`);
            entity.style.setProperty("--pressure", visual.pressure / 100);
            entity.dataset.kind = visual.kind;
            entity.dataset.pressure = String(visual.pressure);

            const label = document.createElement("span");
            label.textContent = visual.held ? `${visual.name} / HELD` : `${visual.name} / ${visual.pressure}`;
            entity.appendChild(label);
            this.els.cameraEntities.appendChild(entity);
        });
    }

    renderInventory() {
        const anchors = [...this.engine.state.anchors].map((item) => `<b>${item}</b>`).join(" ");
        const items = [...this.engine.state.inventory].map((item) => item.replace(/_/g, " ").toUpperCase()).join(" / ");
        this.els.inventory.innerHTML = `<strong>ANCHORS</strong><span>${anchors || "NONE"}</span><strong>ITEMS</strong><span>${items || "EMPTY"}</span>`;
        this.els.feed.innerHTML = this.engine.state.feed.map((item) => `<p>${this.escape(item)}</p>`).join("");
    }

    renderCaseFiles() {
        const entries = this.engine.lore.list();
        this.els.caseFiles.innerHTML = entries.length
            ? entries.slice(-6).map((entry) => `<button type="button" data-tape="${entry.id}">${this.escape(entry.title)}</button>`).join("")
            : "<span>No case files recovered.</span>";

        this.els.caseFiles.querySelectorAll("[data-tape]").forEach((button) => {
            button.addEventListener("click", () => {
                this.els.input.value = `tape ${button.dataset.tape}`;
                this.els.input.focus();
            });
        });
    }

    focusInput(shouldFocus = true) {
        this.els.input.disabled = false;
        if (shouldFocus) {
            this.els.input.focus();
        }
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
