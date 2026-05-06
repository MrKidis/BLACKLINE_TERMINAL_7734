export class SpeechDirector {
    constructor(audio) {
        this.audio = audio;
        this.synth = window.speechSynthesis || null;
        this.enabled = true;
        this.voices = [];
        this.targetVoices = [];
        this.voice = null;
        this.voiceMode = "loading";
        this.onVoicesChanged = null;
    }

    init() {
        if (!this.synth) {
            return;
        }

        const load = () => {
            this.voices = this.synth.getVoices();
            this.targetVoices = this.getBritishGoogleVoices();
            this.voice = this.pickBritishGoogleVoice();
            this.voiceMode = this.voice ? "google-uk" : "forced-en-gb";
            this.onVoicesChanged?.(this.voices, this.voice);
        };

        load();
        this.synth.onvoiceschanged = load;
    }

    getBritishGoogleVoices() {
        return this.voices.filter((voice) => {
            const name = voice.name.toLowerCase();
            const lang = voice.lang.toLowerCase();
            return name.includes("google") && (lang === "en-gb" || name.includes("uk english") || name.includes("british"));
        });
    }

    pickBritishGoogleVoice() {
        return this.targetVoices.find((voice) => /female/i.test(voice.name))
            || this.targetVoices.find((voice) => /google uk english/i.test(voice.name))
            || this.targetVoices[0]
            || null;
    }

    setVoiceByIndex(index) {
        this.voice = this.targetVoices[index] || this.voice;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.synth?.cancel();
        }
    }

    speak(text, mood = "line") {
        if (!this.enabled || !this.synth) {
            return;
        }

        const cleaned = this.prepare(text, mood);
        if (!cleaned) {
            return;
        }

        this.synth.cancel();
        if (mood === "panic" || mood === "scare") {
            this.audio.ring();
        }

        const utterance = new SpeechSynthesisUtterance(cleaned);
        if (this.voice) {
            utterance.voice = this.voice;
        }
        utterance.lang = "en-GB";
        utterance.volume = mood === "whisper" ? 0.76 : 0.96;
        utterance.pitch = mood === "scare" ? 0.28 : mood === "panic" ? 0.38 : mood === "whisper" ? 0.46 : 0.56;
        utterance.rate = mood === "panic" ? 1.05 : mood === "whisper" ? 0.72 : mood === "scare" ? 0.64 : 0.84;
        this.synth.speak(utterance);
    }

    prepare(text, mood) {
        const base = text
            .replace(/^AI:\s*/i, "")
            .replace(/^SYSTEM:\s*/i, "")
            .replace(/[_<>/\\[\]]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

        if (!base) {
            return "";
        }

        if (mood === "scare") {
            return base.toUpperCase().slice(0, 180);
        }

        if (mood === "whisper") {
            return base
                .replace(/\./g, "... ")
                .replace(/you/gi, "you")
                .slice(0, 220);
        }

        return base.slice(0, 240);
    }
}
