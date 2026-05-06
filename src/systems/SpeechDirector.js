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
        const googleUkVoices = this.voices.filter((voice) => {
            const name = voice.name.toLowerCase();
            const lang = voice.lang.toLowerCase();
            return name.includes("google") && (lang === "en-gb" || name.includes("uk english") || name.includes("british"));
        });
        return googleUkVoices.filter((voice) => /\bmale\b/i.test(voice.name));
    }

    pickBritishGoogleVoice() {
        return this.targetVoices.find((voice) => /google uk english male/i.test(voice.name))
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
        utterance.pitch = mood === "scare" ? 0.18 : mood === "panic" ? 0.28 : mood === "whisper" ? 0.34 : 0.42;
        utterance.rate = mood === "panic" ? 0.92 : mood === "whisper" ? 0.68 : mood === "scare" ? 0.56 : 0.78;
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
