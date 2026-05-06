import { loreEntries, loreUnlocks } from "../data/loreData.js";

export class LoreSystem {
    constructor(engine) {
        this.engine = engine;
        this.entries = loreEntries;
    }

    unlockMany(reason, announce = true) {
        const ids = loreUnlocks[reason] || [];
        ids.forEach((id) => this.unlock(id, announce));
    }

    unlock(id, announce = true) {
        if (!this.entries[id] || this.engine.state.lore.has(id)) {
            return false;
        }

        this.engine.state.lore.add(id);
        if (announce) {
            this.engine.log("CASE", `New file unlocked: ${this.entries[id].title}.`, "event");
            this.engine.addFeed(`Case file: ${this.entries[id].title}`);
        }
        return true;
    }

    list() {
        return [...this.engine.state.lore].map((id) => ({
            id,
            ...this.entries[id]
        }));
    }

    read(idOrTitle = "") {
        const query = idOrTitle.trim().toLowerCase();
        if (!query) {
            return null;
        }

        const id = [...this.engine.state.lore].find((entryId) => {
            const entry = this.entries[entryId];
            return entryId.toLowerCase() === query
                || entry.title.toLowerCase().includes(query)
                || entry.type.toLowerCase().includes(query);
        });

        if (!id) {
            return null;
        }

        return {
            id,
            ...this.entries[id]
        };
    }

    format(entry) {
        return [
            `${entry.title} / ${entry.type}`,
            "",
            ...entry.body
        ].join("\n");
    }

    trace() {
        const state = this.engine.state;
        const entityLines = state.entities
            .map((entity) => `${entity.kind.toUpperCase()}=${entity.camera}/${Math.round(entity.pressure)}%`)
            .join("  ");
        return [
            `LOOP_${state.loop}`,
            `ROOM=${this.engine.currentRoom().label}`,
            `ANCHORS=${[...state.anchors].join(",") || "NONE"}`,
            `LORE=${state.lore.size}/${Object.keys(this.entries).length}`,
            `ENTITIES=${entityLines}`,
            `LAST_COMMAND=${state.commandHistory[state.commandHistory.length - 1] || "NONE"}`
        ].join("\n");
    }
}
