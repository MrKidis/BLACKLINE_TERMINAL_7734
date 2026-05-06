import { cameras, entityKinds } from "../data/gameData.js";

const cameraRoutes = {
    watcher: ["CAM_01", "CAM_00", "CAM_02", "CAM_04"],
    operator: ["CAM_03", "CAM_00", "CAM_03", "CAM_04"],
    shaft: ["CAM_04", "CAM_02", "CAM_00", "CAM_04"]
};

export class AIDirector {
    constructor(engine) {
        this.engine = engine;
        this.eventClock = 0;
        this.tickClock = 0;
        this.clockSoundClock = 0;
    }

    update(deltaSeconds) {
        const state = this.engine.state;
        if (!state.running || state.dead || state.escaped) {
            return;
        }

        state.seconds += deltaSeconds;
        this.tickClock += deltaSeconds;
        this.eventClock += deltaSeconds;
        this.clockSoundClock += deltaSeconds;

        if (this.clockSoundClock >= 1) {
            this.clockSoundClock -= 1;
            this.engine.audio.tick();
        }

        if (this.tickClock >= 2.4) {
            this.tickClock = 0;
            this.resourceTick();
        }

        if (this.eventClock >= this.nextEventDelay()) {
            this.eventClock = 0;
            this.advanceEntity();
            this.randomIncident();
        }
    }

    nextEventDelay() {
        const dread = this.engine.state.dread;
        return Math.max(3.4, 8.2 - dread / 18 + Math.random() * 3);
    }

    resourceTick() {
        const state = this.engine.state;
        const sealedCost = state.seals.size * 1.9;
        this.engine.changeStat("power", -(0.9 + sealedCost));
        this.engine.changeStat("signal", -0.55);
        this.engine.changeStat("sanity", state.flags.has("hidden") ? 0.9 : -0.48);
        this.engine.changeStat("dread", state.flags.has("hidden") ? -1.8 : 1.15);
        state.flags.delete("hidden");
        this.engine.checkFailure();
    }

    advanceEntity() {
        const state = this.engine.state;
        const entity = this.pickEntity();
        const route = cameraRoutes[entity.kind];
        const index = route.indexOf(entity.camera);
        const next = route[Math.min(route.length - 1, index + 1)];
        const room = this.roomForCamera(next);
        const sealed = room && state.seals.has(room);

        if (sealed) {
            entity.pressure = Math.max(0, entity.pressure - 18);
            this.engine.log("SYSTEM", `${entityKinds[entity.kind].name} hit the sealed ${room.toUpperCase()} route and backed away.`, "event");
            this.engine.audio.play("operatorJump", { volume: 0.28, rate: 0.55 });
            this.engine.changeStat("power", -4);
            return;
        }

        entity.camera = next;
        entity.pressure += 9 + Math.random() * 14 + state.loop * 0.7;
        state.cameraNoise = Math.min(100, state.cameraNoise + 12);
        this.engine.addFeed(`${entityKinds[entity.kind].name} moved to ${next}.`);

        if (next === "CAM_00" && entity.pressure > 50) {
            this.engine.log("SYSTEM", `${entityKinds[entity.kind].name} is at the recovery bay door.`, "error");
            this.engine.changeStat("dread", 15);
        }

        if (entity.pressure >= 92) {
            this.engine.kill(entityKinds[entity.kind].killLine, entityKinds[entity.kind].scare, entityKinds[entity.kind].name);
        }
    }

    pickEntity() {
        const weighted = this.engine.state.entities.flatMap((entity) => {
            const weight = Math.max(1, Math.round(entity.pressure / 10));
            return Array.from({ length: weight }, () => entity);
        });
        return weighted[Math.floor(Math.random() * weighted.length)];
    }

    randomIncident() {
        const state = this.engine.state;
        const incidents = [
            () => this.fakeInput(),
            () => this.phonePulse(),
            () => this.cameraTear(),
            () => this.whisper(),
            () => this.powerFault()
        ];

        if (state.dread > 62) {
            incidents.push(() => this.closeContact(), () => this.closeContact());
        }
        incidents[Math.floor(Math.random() * incidents.length)]();
    }

    fakeInput() {
        const samples = ["USER: eternity", "USER: let me out", "USER: answer", "USER: i am not alone"];
        this.engine.log("MIRROR", samples[Math.floor(Math.random() * samples.length)], "whisper");
        this.engine.log("SYSTEM", "False keystroke rejected by terminal lock.", "error");
        this.engine.changeStat("sanity", -4);
        this.engine.changeStat("dread", 7);
    }

    phonePulse() {
        this.engine.audio.ring();
        this.engine.log("SYSTEM", "Incoming call. Source matches your current room.", "event");
        this.engine.ai("Do not answer a call you did not place.", "panic");
        this.engine.changeStat("signal", -4);
        this.engine.changeStat("dread", 8);
    }

    cameraTear() {
        const state = this.engine.state;
        state.cameraNoise = Math.min(100, state.cameraNoise + 28);
        this.engine.log("SYSTEM", `${state.currentCamera} dropped three frames. One frame was from tomorrow.`, "event");
        this.engine.changeStat("sanity", -5);
    }

    whisper() {
        const room = this.engine.currentRoom().label;
        this.engine.log("LINE", `The ${room.toLowerCase()} is breathing through the speaker.`, "whisper");
        this.engine.changeStat("sanity", -6);
    }

    powerFault() {
        this.engine.log("SYSTEM", "Power fault. The lights chose an order and blinked it like a code.", "event");
        this.engine.changeStat("power", -7);
        this.engine.changeStat("dread", 5);
    }

    closeContact() {
        this.engine.log("SYSTEM", "Proximity warning. Something is close enough to reflect in the screen.", "error");
        this.engine.changeStat("dread", 13);
        this.engine.scare.trigger("watcher", "HIDE", 720);
    }

    roomForCamera(camera) {
        return Object.entries(this.engine.rooms).find(([, room]) => room.camera === camera)?.[0] || null;
    }

    cameraSummary() {
        const state = this.engine.state;
        const entities = state.entities
            .filter((entity) => entity.camera === state.currentCamera)
            .map((entity) => entityKinds[entity.kind].name);
        return {
            camera: state.currentCamera,
            label: cameras[state.currentCamera].label,
            text: cameras[state.currentCamera].text,
            entities
        };
    }
}
