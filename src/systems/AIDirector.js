import { cameras, entityKinds } from "../data/gameData.js";
import { cameraEntityProfiles, cameraScenes, cameraSlot } from "../data/cameraScenes.js";

const cameraRoutes = {
    watcher: ["CAM_01", "CAM_02", "CAM_00", "DOOR_LEFT"],
    operator: ["CAM_03", "CAM_02", "CAM_00", "DOOR_RIGHT"],
    shaft: ["CAM_04", "CAM_02", "CAM_00", "DOOR_CENTER"]
};

const poses = ["waiting", "leaning", "staring", "crossing", "closer"];

export class AIDirector {
    constructor(engine) {
        this.engine = engine;
        this.eventClock = 0;
        this.tickClock = 0;
        this.clockSoundClock = 0;
        this.motionClock = 0;
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
        this.motionClock += deltaSeconds;

        if (this.clockSoundClock >= 1) {
            this.clockSoundClock -= 1;
            this.engine.audio.tick();
        }

        if (this.motionClock >= 0.38) {
            this.motionClock = 0;
            this.cameraLifeTick();
        }

        if (this.tickClock >= 2.4) {
            this.tickClock = 0;
            this.resourceTick();
        }

        if (this.eventClock >= this.nextEventDelay()) {
            this.eventClock = 0;
            this.advanceEntity();
            this.randomIncident();
            this.storyPressure();
        }

        this.checkDoorAttacks();
    }

    nextEventDelay() {
        const state = this.engine.state;
        const hourPressure = Math.floor(state.seconds / 50) * 0.35;
        return Math.max(2.1, 7.6 - state.dread / 20 - hourPressure + Math.random() * 2.4);
    }

    resourceTick() {
        const state = this.engine.state;
        const doorCost = Number(state.leftDoorClosed) * 1.55 + Number(state.rightDoorClosed) * 1.55;
        const lightCost = Number(state.leftLightOn) * 1.8 + Number(state.rightLightOn) * 1.8;
        const cameraCost = state.cameraOpen ? 0.85 : 0;
        const contactCost = this.officeThreats().length * 0.9;
        this.engine.changeStat("power", -(0.42 + doorCost + lightCost + cameraCost));
        this.engine.changeStat("signal", state.cameraOpen ? -1.1 : -0.34);
        this.engine.changeStat("sanity", state.cameraOpen ? -0.1 : -0.42 - contactCost);
        this.engine.changeStat("dread", this.officeThreats().length ? 4.8 : state.cameraOpen ? -0.35 : 0.92);
        state.flags.delete("hidden");
        this.engine.checkFailure();
    }

    advanceEntity() {
        const state = this.engine.state;
        const entity = this.pickEntity();
        const route = cameraRoutes[entity.kind];
        const index = Math.max(0, route.indexOf(entity.camera));
        const next = route[Math.min(route.length - 1, index + 1)];
        const officeSide = entityKinds[entity.kind].officeSide;

        if (entity.freezeUntil > state.seconds) {
            entity.pose = "stared";
            entity.pressure = Math.max(0, entity.pressure - 2.5);
            state.cameraNoise = Math.min(100, state.cameraNoise + 6);
            this.engine.addFeed(`${entityKinds[entity.kind].name} held on ${entity.camera}.`);
            return;
        }

        if (this.isOfficeNode(entity.camera)) {
            if (this.isDoorClosedFor(officeSide)) {
                this.repelEntity(entity, "The closed door shook once and the shape backed into the camera feed.");
                return;
            }
            this.engine.kill(entityKinds[entity.kind].killLine, entityKinds[entity.kind].scare, entityKinds[entity.kind].name);
            return;
        }

        entity.camera = next;
        entity.lastMoved = state.seconds;
        entity.pose = this.poseFor(entity.pressure);
        entity.offsetX = (Math.random() - 0.5) * (8 + entity.pressure / 7);
        entity.offsetY = (Math.random() - 0.5) * (4 + entity.pressure / 18);
        entity.pressure += 9 + Math.random() * 14 + state.loop * 0.7;
        state.cameraNoise = Math.min(100, state.cameraNoise + 12);
        this.engine.addFeed(`${entityKinds[entity.kind].name} moved to ${next}.`);

        if (this.isOfficeNode(next)) {
            entity.attackAt = state.seconds + Math.max(2.4, 6.4 - entity.pressure / 22);
            entity.pose = "door";
            this.engine.addFeed(`${entityKinds[entity.kind].name} reached the ${officeSide.toUpperCase()} office approach.`);
            this.engine.log("OFFICE", `${entityKinds[entity.kind].name} is at ${officeSide === "center" ? "the blind spot" : `the ${officeSide} hall`}.`, "error");
            this.engine.changeStat("dread", 17);
            if (this.isDoorClosedFor(officeSide)) {
                this.repelEntity(entity, "It hit the door and vanished from the hall light.");
            } else {
                this.engine.audio.play("ghostApproach", { volume: 0.52, rate: 0.74 });
            }
            return;
        }

        if (next === state.currentCamera && state.cameraOpen) {
            this.engine.log("CAMERA", `${entityKinds[entity.kind].name} entered the live feed.`, "error");
            this.engine.changeStat("dread", 10);
            if (entity.pressure > 45) {
                this.engine.scare.trigger(entityKinds[entity.kind].scare, "MOTION", 620);
            }
        }

        if (next === "CAM_00" && entity.pressure > 50) {
            this.engine.log("SYSTEM", `${entityKinds[entity.kind].name} is one move from the office.`, "error");
            this.engine.changeStat("dread", 15);
        }

        if (entity.pressure >= 92) {
            this.engine.kill(entityKinds[entity.kind].killLine, entityKinds[entity.kind].scare, entityKinds[entity.kind].name);
        }
    }

    checkDoorAttacks() {
        const state = this.engine.state;
        this.officeThreats().forEach((entity) => {
            const side = entityKinds[entity.kind].officeSide;
            if (this.isDoorClosedFor(side)) {
                this.repelEntity(entity, "Door contact blocked.");
                return;
            }
            if ((entity.attackAt || 0) <= state.seconds) {
                this.engine.kill(entityKinds[entity.kind].killLine, entityKinds[entity.kind].scare, entityKinds[entity.kind].name);
            }
        });
    }

    repelEntity(entity, message) {
        const route = cameraRoutes[entity.kind];
        const retreatIndex = Math.max(0, Math.min(1, Math.floor(Math.random() * (route.length - 2))));
        entity.camera = route[retreatIndex];
        entity.pressure = Math.max(4, entity.pressure - 28);
        entity.attackAt = 0;
        entity.pose = "recoiling";
        entity.offsetX = (Math.random() - 0.5) * 12;
        entity.offsetY = -6;
        this.engine.addFeed(`${entityKinds[entity.kind].name} retreated to ${entity.camera}.`);
        this.engine.log("OFFICE", message, "event");
        this.engine.audio.play("operatorJump", { volume: 0.22, rate: 0.54 });
        this.engine.changeStat("power", -2.5);
        this.engine.changeStat("dread", -5);
    }

    isOfficeNode(node) {
        return /^DOOR_/.test(node);
    }

    isDoorClosedFor(side) {
        const state = this.engine.state;
        if (side === "left") {
            return state.leftDoorClosed;
        }
        if (side === "right" || side === "center") {
            return state.rightDoorClosed;
        }
        return false;
    }

    officeThreats() {
        return this.engine.state.entities.filter((entity) => this.isOfficeNode(entity.camera));
    }

    cameraLifeTick() {
        const state = this.engine.state;
        const liveEntities = state.entities.filter((entity) => entity.camera === state.currentCamera);

        state.entities.forEach((entity) => {
            const heat = Math.max(0.08, entity.pressure / 100);
            if (entity.freezeUntil > state.seconds) {
                entity.pose = "stared";
                entity.offsetX *= 0.62;
                entity.offsetY *= 0.62;
                return;
            }

            entity.offsetX = (Math.random() - 0.5) * (5 + heat * 20);
            entity.offsetY = (Math.random() - 0.5) * (3 + heat * 10);
            if (Math.random() < 0.12 + heat * 0.24) {
                entity.pose = poses[Math.floor(Math.random() * poses.length)];
            }
        });

        if (liveEntities.length) {
            state.cameraNoise = Math.min(100, state.cameraNoise + 0.8 + liveEntities.length * 1.6);
            if (Math.random() < 0.045) {
                const entity = liveEntities[Math.floor(Math.random() * liveEntities.length)];
                this.engine.addFeed(`${entityKinds[entity.kind].name} changed posture on ${state.currentCamera}.`);
            }
        } else {
            state.cameraNoise = Math.max(0, state.cameraNoise - 0.45);
        }
    }

    watchEntity(kind, strength = 10) {
        const state = this.engine.state;
        const entity = state.entities.find((candidate) => candidate.kind === kind && candidate.camera === state.currentCamera);
        if (!entity) {
            return null;
        }

        entity.seen = true;
        entity.pose = "stared";
        entity.freezeUntil = Math.max(entity.freezeUntil, state.seconds + 5.5 + Math.random() * 3.5);
        entity.pressure = Math.max(0, entity.pressure - strength);
        state.cameraNoise = Math.min(100, state.cameraNoise + 15);
        this.engine.addFeed(`Visual lock held ${entityKinds[kind].name} in ${state.currentCamera}.`);
        return entity;
    }

    watchCurrentCamera(strength = 7) {
        return this.engine.state.entities
            .filter((entity) => entity.camera === this.engine.state.currentCamera)
            .map((entity) => this.watchEntity(entity.kind, strength))
            .filter(Boolean);
    }

    poseFor(pressure) {
        if (pressure > 72) {
            return "closer";
        }
        if (pressure > 48) {
            return "staring";
        }
        if (pressure > 30) {
            return "leaning";
        }
        return "crossing";
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
        this.engine.lore.unlock("operator", true);
        this.engine.changeStat("signal", -4);
        this.engine.changeStat("dread", 8);
    }

    cameraTear() {
        const state = this.engine.state;
        state.cameraNoise = Math.min(100, state.cameraNoise + 28);
        this.engine.log("SYSTEM", `${state.currentCamera} dropped three frames. One frame was from tomorrow.`, "event");
        this.engine.lore.unlock("watcher", true);
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

    storyPressure() {
        const state = this.engine.state;
        if (state.seconds > 52 && !state.flags.has("story-operator")) {
            state.flags.add("story-operator");
            this.engine.log("LINE", "A recorded operator whispers the same emergency script in three voices.", "whisper");
            this.engine.lore.unlock("operator", true);
        }

        if (state.seconds > 96 && !state.flags.has("story-shaft")) {
            state.flags.add("story-shaft");
            this.engine.log("ELEVATOR", "The service elevator reports arrival on FLOOR -1. Blackline has no basement.", "event");
            this.engine.lore.unlockMany("shaft", true);
            this.engine.scare.trigger("shaft", "FLOOR -1", 760);
        }

        if (state.seconds > 138 && !state.flags.has("story-six")) {
            state.flags.add("story-six");
            this.engine.log("SYSTEM", "Dawn protocol corrupted. 06:00 will replay the player instead of releasing them.", "error");
            this.engine.lore.unlock("nightSix", true);
            this.engine.changeStat("dread", 16);
        }
    }

    roomForCamera(camera) {
        return Object.entries(this.engine.rooms).find(([, room]) => room.camera === camera)?.[0] || null;
    }

    cameraSummary() {
        const state = this.engine.state;
        const entities = state.entities
            .filter((entity) => entity.camera === state.currentCamera);
        const scene = cameraScenes[state.currentCamera] || cameraScenes.CAM_00;
        const visuals = entities.map((entity) => {
            const slot = cameraSlot(state.currentCamera, entity.kind, entity.pressure);
            return {
                id: entity.id,
                kind: entity.kind,
                name: entityKinds[entity.kind].name,
                className: cameraEntityProfiles[entity.kind].className,
                pose: entity.pose || "waiting",
                pressure: Math.round(entity.pressure),
                x: Math.max(4, Math.min(96, slot.x + (entity.offsetX || 0))),
                y: Math.max(8, Math.min(82, slot.y + (entity.offsetY || 0))),
                scale: slot.scale,
                depth: slot.depth,
                blur: slot.blur,
                held: entity.freezeUntil > state.seconds,
                contact: cameraEntityProfiles[entity.kind].contact
            };
        });

        const contactLines = visuals.map((visual) => `${visual.name}: ${visual.contact}`);
        return {
            camera: state.currentCamera,
            label: cameras[state.currentCamera].label,
            scene,
            noise: state.cameraNoise,
            text: [scene?.description || cameras[state.currentCamera].text, ...contactLines].join("\n"),
            entities: entities.map((entity) => entityKinds[entity.kind].name),
            kinds: entities.map((entity) => entity.kind),
            visuals
        };
    }
}
