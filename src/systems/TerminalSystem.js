export class TerminalSystem {
    constructor(engine) {
        this.engine = engine;
    }

    execute(rawCommand) {
        const raw = rawCommand.trim();
        if (!raw || this.engine.state.dead || this.engine.state.escaped) {
            return;
        }

        const state = this.engine.state;
        state.commandHistory.push(raw);
        this.engine.log("USER", raw, "user");

        const lowered = raw.toLowerCase();
        const parts = lowered.split(/\s+/);
        const verb = parts[0];
        const args = parts.slice(1);

        if (state.finalChoice && !["cut", "disconnect", "eternity", "reboot"].includes(verb)) {
            this.engine.ai("The exit is open. It wants the word. It wants me to ask you for it.", "panic");
            this.engine.changeStat("dread", 5);
            return;
        }

        if (lowered === "cut line" || lowered === "disconnect") {
            this.engine.cutLine();
            return;
        }

        if (lowered === "open exit" || lowered === "unlock exit" || lowered === "open door") {
            this.engine.openExit();
            return;
        }

        if (lowered === "eternity") {
            this.engine.badEnding();
            return;
        }

        const aliases = {
            help: "help",
            "?": "help",
            dir: "cameras",
            ls: "cameras",
            cams: "cameras",
            camera: "cam",
            cd: "go",
            move: "go",
            look: "scan",
            inventory: "inv",
            bag: "inv",
            dial: "call",
            useitem: "use",
            case: "lore",
            files: "lore",
            journal: "lore",
            reboot: "reboot",
            restart: "reboot",
            reset: "reboot"
        };
        const command = aliases[verb] || verb;

        const table = {
            help: () => this.help(),
            status: () => this.status(),
            scan: () => this.scan(),
            cameras: () => this.cameras(),
            cam: () => this.cam(args[0]),
            listen: () => this.listen(),
            read: () => this.read(args.join(" ")),
            go: () => this.go(args.join(" ")),
            call: () => this.call(args.join("")),
            decrypt: () => this.decrypt(args[0], args.slice(1).join(" ")),
            seal: () => this.seal(args.join(" ")),
            unseal: () => this.unseal(args.join(" ")),
            lights: () => this.lights(),
            hide: () => this.hide(),
            breathe: () => this.breathe(),
            remember: () => this.remember(args.join(" ")),
            use: () => this.use(args.join(" ")),
            lore: () => this.lore(args.join(" ")),
            tape: () => this.tape(args.join(" ")),
            trace: () => this.trace(),
            inv: () => this.inventory(),
            clear: () => this.engine.clearLog(),
            reboot: () => this.engine.reboot(true)
        };

        if (table[command]) {
            table[command]();
        } else if (/^\d+$/.test(command)) {
            this.numeric(command);
        } else {
            this.unknown(raw);
        }

        this.engine.checkFailure();
        this.engine.ui.render();
    }

    help() {
        this.engine.log("SYSTEM", "Commands: help, status, scan, cameras, cam <id>, listen, read <file>, lore, tape <case>, trace, go <room>, call <number>, decrypt <target> <key>, seal <room>, unseal <room>, lights, hide, breathe, remember <phrase>, use <item>, open exit, cut line, reboot", "success");
        this.engine.log("SYSTEM", "Survival rule: cameras reveal movement, seals stop route pressure, lights expose door contact, and every defense burns power.", "system");
    }

    status() {
        const s = this.engine.state;
        this.engine.log("SYSTEM", `ROOM ${this.engine.currentRoom().label} / POWER ${Math.round(s.power)} / SANITY ${Math.round(s.sanity)} / SIGNAL ${Math.round(s.signal)} / DREAD ${Math.round(s.dread)} / ANCHORS ${[...s.anchors].join(", ") || "NONE"}`, "success");
    }

    scan() {
        const room = this.engine.currentRoom();
        const state = this.engine.state;
        state.flags.add("scanned");
        this.engine.log("SYSTEM", `SCAN: ${room.label}. Files: ${Object.keys(room.files).join(", ")}. Exits: ${room.exits.join(", ")}.`, "success");
        this.engine.changeStat("signal", -2);

        if (state.room === "server" && !state.inventory.has("fuse_cartridge")) {
            state.inventory.add("fuse_cartridge");
            this.engine.log("SYSTEM", "Rack B opened. Item recovered: FUSE_CARTRIDGE.", "success");
            this.engine.ai("Good. The elevator motor can wake up now. It will not wake up alone.", "line");
        }

        if (state.room === "switchboard") {
            this.engine.audio.ring();
            this.engine.ai("Seven seven three four. Dial it once. No more than once.", "whisper");
        }
    }

    cameras() {
        const ids = Object.values(this.engine.rooms).map((room) => `${room.camera}:${room.label}`).join("  ");
        this.engine.log("SYSTEM", `CAMERAS: ${ids}`, "success");
        this.engine.log("SYSTEM", "Use cam CAM_01, cam CAM_02, cam CAM_03, cam CAM_04. Cameras raise signal noise but lower uncertainty.", "system");
    }

    cam(id = "") {
        const target = id.toUpperCase();
        if (!this.engine.cameras[target]) {
            this.engine.log("SYSTEM", "Unknown camera. Try cameras.", "error");
            this.engine.changeStat("dread", 4);
            return;
        }

        const state = this.engine.state;
        state.currentCamera = target;
        state.cameraNoise = Math.max(0, state.cameraNoise - 18);
        const summary = this.engine.director.cameraSummary();
        this.engine.log("CAMERA", `${summary.camera} / ${summary.label}: ${summary.text}`, "success");

        if (summary.entities.length) {
            this.engine.log("CAMERA", `MOTION: ${summary.entities.join(", ")}`, "error");
            this.engine.ai("You saw it. That means it knows the camera saw it too.", "panic");
            summary.kinds.forEach((kind) => this.engine.lore.unlock(kind, true));
            this.engine.changeStat("sanity", -6);
            this.engine.changeStat("dread", 8);
        } else {
            this.engine.changeStat("sanity", 2);
        }
    }

    listen() {
        const lines = [
            "A receiver rings under the floor.",
            "Something taps the inside of the monitor glass.",
            "The elevator moves without changing floors.",
            "A voice says your last command from the wrong speaker."
        ];
        this.engine.log("AUDIO", lines[Math.floor(Math.random() * lines.length)], "event");
        this.engine.audio.ring();
        this.engine.changeStat("sanity", -5);
        this.engine.changeStat("dread", 6);
    }

    read(fileName) {
        const room = this.engine.currentRoom();
        const key = fileName.trim().replace(/\s+/g, "_");
        if (!key) {
            this.engine.log("SYSTEM", `Files: ${Object.keys(room.files).join(", ") || "NONE"}`, "success");
            return;
        }

        const found = Object.keys(room.files).find((name) => name === key || name.startsWith(key));
        if (!found) {
            this.engine.log("SYSTEM", "File not found in current room.", "error");
            this.engine.changeStat("sanity", -3);
            return;
        }

        this.engine.log(found.toUpperCase(), room.files[found].join("\n"), "success");
        if (found === "company" || found === "training") {
            this.engine.lore.unlock("operator", true);
        }
        if (found === "shaft") {
            this.engine.lore.unlockMany("shaft", true);
        }
    }

    lore(query) {
        if (!query.trim()) {
            const entries = this.engine.lore.list();
            this.engine.log("CASE", entries.map((entry) => `${entry.id}: ${entry.title}`).join("\n") || "No case files unlocked.", "success");
            this.engine.log("SYSTEM", "Use tape <id or title> to read a case file.", "system");
            return;
        }

        this.tape(query);
    }

    tape(query) {
        const entry = this.engine.lore.read(query);
        if (!entry) {
            this.engine.log("CASE", "No unlocked case file matches that query.", "error");
            this.engine.changeStat("dread", 3);
            return;
        }

        this.engine.log("CASE", this.engine.lore.format(entry), "success");
        if (entry.id === "eternity") {
            this.engine.ai("That word is not an ending. It is a door handle.", "whisper");
        }
    }

    trace() {
        this.engine.log("TRACE", this.engine.lore.trace(), "success");
    }

    go(roomName) {
        const target = this.engine.resolveRoom(roomName);
        const current = this.engine.currentRoom();
        if (!target || !this.engine.rooms[target]) {
            this.engine.log("SYSTEM", "Unknown room.", "error");
            return;
        }
        if (!current.exits.includes(target)) {
            this.engine.log("SYSTEM", `Route blocked. Exits: ${current.exits.join(", ")}`, "error");
            this.engine.changeStat("dread", 5);
            return;
        }
        if (target === "elevator" && this.engine.state.anchors.size < 2) {
            this.engine.log("SYSTEM", "Shaft hall locked until at least two anchors are recovered.", "error");
            this.engine.changeStat("dread", 8);
            return;
        }

        this.engine.state.room = target;
        this.engine.state.currentCamera = this.engine.rooms[target].camera;
        this.engine.log("SYSTEM", `Moved to ${this.engine.rooms[target].label}.`, "success");
        this.engine.changeStat("power", -1.8);
    }

    call(number) {
        if (!number) {
            this.engine.log("SYSTEM", "No number entered.", "error");
            return;
        }
        this.engine.audio.ring();
        this.engine.changeStat("signal", -5);
        this.engine.changeStat("dread", 6);

        if (number === "7734") {
            if (!this.engine.state.anchors.has("LINE")) {
                this.engine.state.anchors.add("LINE");
                this.engine.state.inventory.add("black_receiver");
                this.engine.log("SYSTEM", "Call connected. Anchor recovered: LINE.", "success");
                this.engine.ai("I am on the line. I am not in the room. Keep both of those facts true.", "whisper");
            } else {
                this.engine.ai("Do not make me answer twice.", "panic");
                this.engine.changeStat("dread", 14);
            }
            return;
        }

        if (number === "0000") {
            this.engine.kill("Dead air answered with your breathing.", "operator", "DEAD AIR");
            return;
        }

        this.engine.log("SYSTEM", "Wrong circuit. Something picked up and waited.", "error");
        this.engine.changeStat("sanity", -8);
        this.engine.changeStat("dread", 12);
    }

    decrypt(target = "", key = "") {
        if (target === "prime" && key === "13") {
            this.engine.recoverAnchor("PRIME", "Prime lock accepted.");
            return;
        }
        if (target === "camera" && key === "0417") {
            this.engine.recoverAnchor("CAMERA", "Camera spine decrypted.");
            return;
        }
        this.engine.log("SYSTEM", "Decrypt failed.", "error");
        this.engine.changeStat("dread", 7);
    }

    remember(phrase) {
        if (phrase.trim() === "i am awake") {
            this.engine.recoverAnchor("SELF", "Self phrase accepted.");
            this.engine.ai("The archive lost your name. That gives you a minute.", "line");
            return;
        }
        this.engine.log("SYSTEM", "Memory phrase rejected.", "error");
        this.engine.changeStat("sanity", -7);
    }

    seal(roomName) {
        const room = this.engine.resolveRoom(roomName || this.engine.state.room);
        if (!room || room === "elevator") {
            this.engine.log("SYSTEM", "That route cannot be sealed.", "error");
            return;
        }
        this.engine.state.seals.add(room);
        this.engine.state.flags.add("usedDefenses");
        this.engine.log("SYSTEM", `${this.engine.rooms[room].label} route sealed. Power drain increased.`, "success");
        this.engine.changeStat("power", -2);
    }

    unseal(roomName) {
        const room = this.engine.resolveRoom(roomName || this.engine.state.room);
        if (room) {
            this.engine.state.seals.delete(room);
        } else {
            this.engine.state.seals.clear();
        }
        this.engine.log("SYSTEM", "Seal released.", "success");
    }

    lights() {
        this.engine.changeStat("power", -6);
        this.engine.changeStat("dread", -8);
        this.engine.state.flags.add("usedDefenses");
        this.engine.log("SYSTEM", "Lights flashed. Door pressure briefly visible.", "success");
        const close = this.engine.state.entities.filter((entity) => entity.camera === "CAM_00");
        if (close.length) {
            this.engine.log("SYSTEM", `At the glass: ${close.map((entity) => entity.kind.toUpperCase()).join(", ")}`, "error");
            this.engine.scare.trigger("shaft", "AT THE DOOR", 650);
        }
    }

    hide() {
        this.engine.state.flags.add("hidden");
        this.engine.state.flags.add("usedDefenses");
        this.engine.changeStat("dread", -18);
        this.engine.changeStat("sanity", 3);
        this.engine.log("SYSTEM", "Input muted. Breathing pattern lowered. It is listening for panic.", "success");
    }

    breathe() {
        this.engine.changeStat("sanity", 13);
        this.engine.changeStat("dread", -7);
        this.engine.log("SYSTEM", "Breathing pacer accepted.", "success");
        this.engine.ai("In. Hold. Out. Stay boring. Boring things survive.", "line");
    }

    use(itemName) {
        const item = itemName.trim().replace(/\s+/g, "_");
        if ((item === "fuse" || item === "fuse_cartridge") && this.engine.state.inventory.has("fuse_cartridge")) {
            this.engine.state.inventory.delete("fuse_cartridge");
            this.engine.state.inventory.add("hot_fuse_socket");
            this.engine.changeStat("power", 22);
            this.engine.log("SYSTEM", "Fuse cartridge installed. Elevator override can draw power now.", "success");
            return;
        }
        this.engine.log("SYSTEM", "Item not available.", "error");
    }

    inventory() {
        this.engine.log("SYSTEM", `Inventory: ${[...this.engine.state.inventory].join(", ") || "EMPTY"} / Anchors: ${[...this.engine.state.anchors].join(", ") || "NONE"}`, "success");
    }

    numeric(number) {
        if (number === "13") {
            this.engine.log("SYSTEM", "Try: decrypt prime 13", "system");
        } else if (number === "0417") {
            this.engine.log("SYSTEM", "Try: decrypt camera 0417", "system");
        } else if (number === "7734") {
            this.engine.log("SYSTEM", "Try: call 7734", "system");
        } else {
            this.unknown(number);
        }
    }

    unknown(raw) {
        this.engine.log("SYSTEM", "Unknown command. The parser rejected it. Something else did not.", "error");
        this.engine.changeStat("sanity", -6);
        this.engine.changeStat("dread", 10);
        if (/please|help me|free me|answer/i.test(raw)) {
            this.engine.scare.trigger("operator", "ANSWERED", 900);
        }
    }
}
