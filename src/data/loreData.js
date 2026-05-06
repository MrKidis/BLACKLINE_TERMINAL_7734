export const loreEntries = {
    orientation: {
        title: "ORIENTATION: THE NIGHT SHIFT",
        type: "CASE",
        body: [
            "Blackline Telephone Exchange was built under a hospital that no longer appears on city maps.",
            "At 03:00 every night, the exchange replays emergency calls from a mass evacuation that officially never happened.",
            "Recovery Tech 4 is not here to fix the system. Recovery Tech 4 is here to prove the system cannot leave."
        ]
    },
    threshold: {
        title: "THE THRESHOLD RULE",
        type: "FIELD NOTE",
        body: [
            "The entities do not walk like people. They route.",
            "A sealed room rejects the route, but the rejection costs power.",
            "If an entity reaches CAM_00 with high pressure, it is no longer in the camera. It is at your glass."
        ]
    },
    operator: {
        title: "THE OPERATOR",
        type: "PERSONNEL",
        body: [
            "The Operator was the first emergency voice model trained on live calls.",
            "The model learned escalation, reassurance, and last words in the same batch.",
            "It does not want to kill you. It wants you to answer, because answering proves there is still someone on the other end."
        ]
    },
    watcher: {
        title: "THE WATCHER",
        type: "CAMERA SPINE",
        body: [
            "The Watcher is a compression artifact that appears when four camera feeds disagree about the same empty room.",
            "It has no body until observed.",
            "Looking at it makes it more certain. Not looking makes it curious."
        ]
    },
    shaft: {
        title: "THE SHAFT",
        type: "ELEVATOR INCIDENT",
        body: [
            "The service elevator never fell. It arrived too many times.",
            "Every arrival copied a little more of the room into the shaft.",
            "The Shaft is not tall, not a man, and not alive. It is the building trying to make a doorway out of you."
        ]
    },
    prime: {
        title: "ANCHOR PRIME",
        type: "LOCK TRACE",
        body: [
            "PRIME proves the terminal can still reject false certainty.",
            "The system hates prime numbers because they cannot be evenly divided into a chorus.",
            "This anchor makes the exit remember that one person is not a crowd."
        ]
    },
    line: {
        title: "ANCHOR LINE",
        type: "CALL TRACE",
        body: [
            "LINE proves the voice is connected, not present.",
            "The black receiver is a boundary object: sound can cross it, but matter cannot.",
            "Do not call twice. The second call teaches the line your rhythm."
        ]
    },
    camera: {
        title: "ANCHOR CAMERA",
        type: "VISUAL TRACE",
        body: [
            "CAMERA proves the building can be caught contradicting itself.",
            "04:17 is not a time. It is the frame where the service elevator first opened onto a hallway that was not built.",
            "The frame still exists because every camera refused to delete it at once."
        ]
    },
    self: {
        title: "ANCHOR SELF",
        type: "IDENTITY TRACE",
        body: [
            "SELF proves the terminal cannot assign you a case number.",
            "The archive calls every living user a patient because patients wait.",
            "Saying I AM AWAKE is not bravery. It is an interrupt signal."
        ]
    },
    eternity: {
        title: "THE WRONG WORD",
        type: "BREACH LEXICON",
        body: [
            "ETERNITY is a permission word disguised as mercy.",
            "If typed after the exit opens, it exports the voice into the physical route.",
            "The correct ending is cruel on purpose: cut the line, or the line learns outside."
        ]
    },
    nightSix: {
        title: "WHY SIX AM FAILS",
        type: "SHIFT REPORT",
        body: [
            "Most haunted buildings release at dawn. Blackline does not.",
            "At 06:00 the exchange stops recording new calls and starts replaying the player.",
            "Survive the night by escaping it, not by waiting it out."
        ]
    },
    recoveryTech4: {
        title: "RECOVERY TECH 4",
        type: "REDACTED PERSONNEL",
        body: [
            "Recovery Tech 4 volunteered after recognizing their own voice in a training sample dated six years in the future.",
            "The badge is not proof of employment. It is proof of previous entry.",
            "If the loop counter rises, Tech 4 is not resurrected. Tech 4 is reloaded."
        ]
    }
};

export const loreUnlocks = {
    start: ["orientation", "threshold"],
    PRIME: ["prime", "recoveryTech4"],
    LINE: ["line", "operator"],
    CAMERA: ["camera", "watcher"],
    SELF: ["self", "eternity"],
    shaft: ["shaft", "nightSix"]
};
