export const cameraScenes = {
    CAM_00: {
        code: "REC-BAY",
        label: "RECOVERY BAY",
        depth: "near",
        roomClass: "recovery",
        description: "A recovery terminal faces the glass. The chair keeps turning back toward the door.",
        details: ["door-window", "workbench", "floor-cable"],
        entitySlots: {
            watcher: [
                { x: 18, y: 39, scale: 0.58, depth: 1, blur: 1.2 },
                { x: 47, y: 31, scale: 0.96, depth: 3, blur: 0.35 },
                { x: 56, y: 24, scale: 1.34, depth: 5, blur: 0 }
            ],
            operator: [
                { x: 81, y: 43, scale: 0.56, depth: 1, blur: 1.4 },
                { x: 66, y: 37, scale: 0.88, depth: 3, blur: 0.45 },
                { x: 49, y: 28, scale: 1.28, depth: 5, blur: 0 }
            ],
            shaft: [
                { x: 50, y: 48, scale: 0.64, depth: 1, blur: 1.2 },
                { x: 50, y: 41, scale: 0.98, depth: 3, blur: 0.35 },
                { x: 50, y: 35, scale: 1.38, depth: 5, blur: 0 }
            ]
        }
    },
    CAM_01: {
        code: "ARCHIVE",
        label: "CASE ARCHIVE",
        depth: "deep",
        roomClass: "archive",
        description: "Open cabinets form rows like pews. The case folders shift when the feed tears.",
        details: ["file-row", "ceiling-lamp", "paper-storm"],
        entitySlots: {
            watcher: [
                { x: 15, y: 42, scale: 0.52, depth: 1, blur: 1.6 },
                { x: 37, y: 35, scale: 0.78, depth: 2, blur: 0.8 },
                { x: 72, y: 29, scale: 1.06, depth: 4, blur: 0.2 }
            ],
            operator: [
                { x: 58, y: 46, scale: 0.46, depth: 1, blur: 1.8 },
                { x: 44, y: 37, scale: 0.74, depth: 2, blur: 0.9 },
                { x: 24, y: 30, scale: 1.02, depth: 4, blur: 0.2 }
            ],
            shaft: [
                { x: 84, y: 47, scale: 0.52, depth: 1, blur: 1.8 },
                { x: 71, y: 39, scale: 0.8, depth: 2, blur: 0.8 },
                { x: 63, y: 33, scale: 1.08, depth: 4, blur: 0.2 }
            ]
        }
    },
    CAM_02: {
        code: "SERVER",
        label: "SERVER STACK",
        depth: "strobing",
        roomClass: "server",
        description: "Rack B pulses in uneven intervals. The cable shadows move opposite the fans.",
        details: ["rack-left", "rack-right", "fan-row"],
        entitySlots: {
            watcher: [
                { x: 28, y: 44, scale: 0.5, depth: 1, blur: 1.5 },
                { x: 39, y: 35, scale: 0.78, depth: 2, blur: 0.7 },
                { x: 51, y: 29, scale: 1.1, depth: 4, blur: 0.15 }
            ],
            operator: [
                { x: 79, y: 43, scale: 0.48, depth: 1, blur: 1.5 },
                { x: 66, y: 35, scale: 0.74, depth: 2, blur: 0.65 },
                { x: 53, y: 28, scale: 1.06, depth: 4, blur: 0.15 }
            ],
            shaft: [
                { x: 48, y: 49, scale: 0.5, depth: 1, blur: 1.6 },
                { x: 51, y: 40, scale: 0.82, depth: 2, blur: 0.7 },
                { x: 53, y: 33, scale: 1.18, depth: 4, blur: 0.1 }
            ]
        }
    },
    CAM_03: {
        code: "SWITCH",
        label: "SWITCHBOARD",
        depth: "close",
        roomClass: "switchboard",
        description: "Dead jacks cover the wall. One cord drags itself back into the same socket.",
        details: ["jack-wall", "hanging-cords", "receiver-shadow"],
        entitySlots: {
            watcher: [
                { x: 23, y: 42, scale: 0.52, depth: 1, blur: 1.4 },
                { x: 37, y: 35, scale: 0.82, depth: 2, blur: 0.55 },
                { x: 47, y: 28, scale: 1.12, depth: 4, blur: 0.1 }
            ],
            operator: [
                { x: 80, y: 45, scale: 0.55, depth: 1, blur: 1.2 },
                { x: 61, y: 36, scale: 0.9, depth: 3, blur: 0.38 },
                { x: 45, y: 27, scale: 1.26, depth: 5, blur: 0 }
            ],
            shaft: [
                { x: 55, y: 47, scale: 0.5, depth: 1, blur: 1.6 },
                { x: 56, y: 39, scale: 0.8, depth: 2, blur: 0.7 },
                { x: 58, y: 32, scale: 1.1, depth: 4, blur: 0.1 }
            ]
        }
    },
    CAM_04: {
        code: "ELEVATOR",
        label: "SERVICE ELEVATOR",
        depth: "shaft",
        roomClass: "elevator",
        description: "The elevator doors are shut. The reflection shows them opening anyway.",
        details: ["elevator-door", "floor-warning", "shaft-gap"],
        entitySlots: {
            watcher: [
                { x: 22, y: 44, scale: 0.5, depth: 1, blur: 1.5 },
                { x: 37, y: 37, scale: 0.78, depth: 2, blur: 0.7 },
                { x: 54, y: 29, scale: 1.08, depth: 4, blur: 0.12 }
            ],
            operator: [
                { x: 77, y: 44, scale: 0.52, depth: 1, blur: 1.4 },
                { x: 62, y: 37, scale: 0.82, depth: 2, blur: 0.65 },
                { x: 48, y: 29, scale: 1.16, depth: 4, blur: 0.08 }
            ],
            shaft: [
                { x: 50, y: 52, scale: 0.66, depth: 1, blur: 1.1 },
                { x: 50, y: 42, scale: 1, depth: 3, blur: 0.3 },
                { x: 50, y: 32, scale: 1.42, depth: 5, blur: 0 }
            ]
        }
    }
};

export const cameraEntityProfiles = {
    watcher: {
        className: "watcher",
        label: "WATCHER",
        contact: "It watches the camera until the lens warps around its eyes."
    },
    operator: {
        className: "operator",
        label: "THE OPERATOR",
        contact: "It raises a handset that is not attached to the wall."
    },
    shaft: {
        className: "shaft",
        label: "THE SHAFT",
        contact: "The door seam widens though the elevator is still closed."
    }
};

const fallbackSlots = [
    { x: 26, y: 43, scale: 0.54, depth: 1, blur: 1.5 },
    { x: 50, y: 35, scale: 0.86, depth: 2, blur: 0.55 },
    { x: 67, y: 28, scale: 1.18, depth: 4, blur: 0.1 }
];

export function cameraSlot(cameraId, kind, pressure = 0) {
    const slots = cameraScenes[cameraId]?.entitySlots?.[kind] || fallbackSlots;
    const pressureIndex = pressure > 72 ? 2 : pressure > 42 ? 1 : 0;
    return slots[Math.min(pressureIndex, slots.length - 1)];
}
