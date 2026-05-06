import { audioManifest } from "../data/audioManifest.js";

export class AudioEngine {
    constructor() {
        this.enabled = true;
        this.ambienceEnabled = true;
        this.samples = new Map();
        this.loops = new Map();
        this.ambienceResumeTimer = null;
        this.scareTimers = [];
    }

    async unlock() {
        await this.preload();
    }

    async preload() {
        const entries = [
            ...Object.entries(audioManifest.ambience).map(([key, value]) => [key, value, true]),
            ...Object.entries(audioManifest.sfx).map(([key, value]) => [key, value, false])
        ];

        entries.forEach(([key, config, loop]) => {
            const audio = new Audio(config.src);
            audio.preload = "auto";
            audio.loop = Boolean(loop && config.loop);
            audio.volume = config.volume;
            this.samples.set(key, { audio, config, loop });
        });
    }

    setAmbienceEnabled(enabled) {
        this.ambienceEnabled = enabled;
        if (!enabled) {
            this.stopAmbience();
        } else {
            this.startAmbience();
        }
    }

    startAmbience() {
        if (!this.enabled || !this.ambienceEnabled) {
            return;
        }

        for (const [key, sample] of this.samples.entries()) {
            if (!sample.loop) {
                continue;
            }
            if (this.loops.has(key) && !sample.audio.paused) {
                continue;
            }
            sample.audio.currentTime = Math.random() * Math.max(1, sample.audio.duration || 1);
            sample.audio.play().catch(() => {});
            this.loops.set(key, sample.audio);
        }
    }

    stopAmbience() {
        for (const loop of this.loops.values()) {
            loop.pause();
        }
        this.loops.clear();
    }

    pauseAmbienceForScare(duration = 1600) {
        window.clearTimeout(this.ambienceResumeTimer);
        this.stopAmbience();
        this.ambienceResumeTimer = window.setTimeout(() => {
            if (this.ambienceEnabled) {
                this.startAmbience();
            }
        }, duration + 360);
    }

    play(key, options = {}) {
        if (!this.enabled) {
            return;
        }

        const sample = this.samples.get(key);
        if (!sample) {
            return;
        }

        const node = sample.audio.cloneNode(true);
        node.loop = false;
        node.volume = Math.max(0, Math.min(1, options.volume ?? sample.config.volume));
        node.playbackRate = options.rate ?? 1;
        node.play().catch(() => {});
    }

    playScare(type, duration = 1400) {
        this.pauseAmbienceForScare(duration);
        this.scareTimers.forEach((timer) => window.clearTimeout(timer));
        this.scareTimers = [];
        const schedule = (delay, key, options) => {
            const timer = window.setTimeout(() => this.play(key, options), delay);
            this.scareTimers.push(timer);
        };

        if (type === "operator") {
            this.play("phoneRing", { volume: 0.78, rate: 0.68 });
            schedule(160, "operatorJump", { volume: 1, rate: 0.88 });
            schedule(500, "ghostApproach", { volume: 0.48, rate: 0.72 });
            return;
        }

        if (type === "shaft") {
            this.play("operatorJump", { volume: 0.94, rate: 0.58 });
            schedule(260, "watcherJump", { volume: 1, rate: 0.78 });
            return;
        }

        this.play("ghostApproach", { volume: 0.78, rate: 1.02 });
        schedule(170, "watcherJump", { volume: 1, rate: 0.96 });
    }

    tick() {
        this.play("clockTick", { volume: 0.34, rate: 1 });
    }

    ring() {
        this.play("phoneRing", { volume: 0.72 + Math.random() * 0.22, rate: 0.86 + Math.random() * 0.18 });
    }
}
