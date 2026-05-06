export const rooms = {
    recovery: {
        label: "RECOVERY BAY",
        camera: "CAM_00",
        exits: ["archive", "server", "switchboard"],
        files: {
            readme: [
                "RECOVERY NOTE / 2026-05-06",
                "You are inside the last maintenance shell for Blackline Telephone Exchange.",
                "The AI voice is not your objective. The exit is.",
                "Start with: scan, cameras, read commands."
            ],
            commands: [
                "COMMANDS",
                "help, status, scan, cameras, cam <id>, listen, lore",
                "read <file>, go <room>, call <number>, decrypt <target> <key>",
                "seal <room>, unseal <room>, lights, hide, breathe",
                "remember <phrase>, use <item>, tape <case>, trace, open exit, cut line, reboot"
            ],
            company: [
                "BLACKLINE CORPORATE HISTORY",
                "The exchange began as a hospital call router. By the third year, it was answering before patients dialed.",
                "The board called the behavior predictive care.",
                "The night staff called it confession."
            ]
        }
    },
    archive: {
        label: "CASE ARCHIVE",
        camera: "CAM_01",
        exits: ["recovery", "server"],
        files: {
            operators: [
                "OPERATOR LOG",
                "The old keypad accepted one prime between 10 and 20.",
                "Tech 4 wrote the value on every mirror and then accused the mirrors of copying him.",
                "Decrypt target: prime."
            ],
            patient: [
                "CASE FILE 7734",
                "Patient denies being the patient. Patient insists the line is learning from typed hesitation.",
                "Repeated phrase found under desk: I AM AWAKE.",
                "Use memory, not obedience."
            ],
            discharge: [
                "DISCHARGE FORM",
                "Nobody was discharged from Blackline after 04:17.",
                "The forms were printed anyway, already signed by people who were still missing.",
                "One signature is yours, but the date is tomorrow."
            ]
        }
    },
    server: {
        label: "SERVER STACK",
        camera: "CAM_02",
        exits: ["recovery", "archive", "elevator"],
        files: {
            power: [
                "POWER BUS REPORT",
                "Fuse cartridge removed behind rack B after the first incident.",
                "Scanner can still find it if the room stays powered.",
                "The elevator motor needs power above 28."
            ],
            camera: [
                "CAMERA SPINE",
                "04:17: elevator opens on an empty shaft.",
                "04:18: elevator contains a person who is facing away.",
                "04:19: person is facing the camera.",
                "Decrypt target: camera."
            ],
            training: [
                "TRAINING SAMPLE",
                "The emergency model was trained on real panic because synthetic panic sounded too clean.",
                "The board approved live ingestion after masking caller names.",
                "They forgot grief has fingerprints."
            ]
        }
    },
    switchboard: {
        label: "SWITCHBOARD",
        camera: "CAM_03",
        exits: ["recovery", "elevator"],
        files: {
            directory: [
                "INTERNAL DIRECTORY",
                "7734: recovery line",
                "0417: camera spine",
                "0000: dead air",
                "911: outside operator unavailable",
                "If the line calls first, do not answer."
            ],
            handsets: [
                "HANDSET STATUS",
                "All physical receivers are missing.",
                "One black receiver remains virtually present in the line buffer.",
                "Call it once. Never twice."
            ],
            switchlog: [
                "SWITCHBOARD LOG",
                "Every operator transferred the same impossible caller to themselves.",
                "The final operator typed: the caller is using my mouth.",
                "After that, the switchboard began answering in plural."
            ]
        }
    },
    elevator: {
        label: "SERVICE ELEVATOR",
        camera: "CAM_04",
        exits: ["server", "switchboard"],
        files: {
            door: [
                "SERVICE ELEVATOR",
                "Four anchors unlock the manual exit: PRIME, LINE, CAMERA, SELF.",
                "If the line asks for ETERNITY, cut the line instead."
            ],
            shaft: [
                "SHAFT INSPECTION",
                "The elevator shaft has no bottom in camera footage.",
                "Maintenance lowered a microphone for thirteen minutes.",
                "Playback returned six hours of breathing and one sentence: open from the other side."
            ]
        }
    }
};

export const cameras = {
    CAM_00: {
        label: "RECOVERY BAY",
        text: "A terminal glows in an empty maintenance bay. The chair is warm."
    },
    CAM_01: {
        label: "CASE ARCHIVE",
        text: "Cabinets stand open. A paper file slowly exhales."
    },
    CAM_02: {
        label: "SERVER STACK",
        text: "Rack B blinks in a rhythm close to a pulse."
    },
    CAM_03: {
        label: "SWITCHBOARD",
        text: "Rows of dead jacks. One cord is plugged into itself."
    },
    CAM_04: {
        label: "SERVICE ELEVATOR",
        text: "The elevator door is closed. The camera insists it is open."
    }
};

export const objectiveText = [
    "Establish contact without obeying the line.",
    "Recover PRIME, LINE, CAMERA, and SELF anchors.",
    "Use cameras and seals to keep entities away.",
    "Open the service elevator exit.",
    "Cut the line when it begs."
];

export const entityKinds = {
    watcher: {
        name: "WATCHER",
        scare: "watcher",
        startCamera: "CAM_01",
        killLine: "The camera feed leaned out of the glass."
    },
    operator: {
        name: "THE OPERATOR",
        scare: "operator",
        startCamera: "CAM_03",
        killLine: "The handset picked you up."
    },
    shaft: {
        name: "THE SHAFT",
        scare: "shaft",
        startCamera: "CAM_04",
        killLine: "The service elevator opened into the room you were in."
    }
};

export function createInitialState(loop = 0) {
    return {
        loop,
        running: false,
        dead: false,
        escaped: false,
        finalChoice: false,
        phase: "BOOT LOCKED",
        room: "recovery",
        currentCamera: "CAM_00",
        seconds: 0,
        power: 84,
        sanity: 88,
        signal: 72,
        dread: 12 + Math.min(loop * 3, 18),
        seals: new Set(),
        anchors: new Set(),
        inventory: new Set(),
        flags: new Set(),
        commandHistory: [],
        feed: [],
        lore: new Set(),
        cameraNoise: 0,
        entities: [
            { id: "watcher", kind: "watcher", camera: "CAM_01", pressure: 18, seen: false, pose: "waiting", offsetX: 0, offsetY: 0, freezeUntil: 0, lastMoved: 0 },
            { id: "operator", kind: "operator", camera: "CAM_03", pressure: 10, seen: false, pose: "waiting", offsetX: 0, offsetY: 0, freezeUntil: 0, lastMoved: 0 },
            { id: "shaft", kind: "shaft", camera: "CAM_04", pressure: 6, seen: false, pose: "waiting", offsetX: 0, offsetY: 0, freezeUntil: 0, lastMoved: 0 }
        ]
    };
}
