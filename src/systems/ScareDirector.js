export class ScareDirector {
    constructor(canvas, caption, audio) {
        this.canvas = canvas;
        this.caption = caption;
        this.audio = audio;
        this.ctx = canvas.getContext("2d");
        this.running = false;
        this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        this.flashSeed = Math.random() * 1000;
    }

    trigger(type, text, duration = 1200) {
        if (this.running) {
            return;
        }

        this.running = true;
        this.caption.textContent = text;
        this.caption.classList.add("visible");
        this.canvas.classList.add("visible");
        document.body.classList.add("shake");
        this.audio.playScare(type, duration);

        const started = performance.now();
        const draw = (now) => {
            const progress = Math.min(1, (now - started) / duration);
            this.draw(type, progress);
            if (progress < 1 && !this.reduceMotion) {
                requestAnimationFrame(draw);
            } else {
                window.setTimeout(() => this.clear(), 120);
            }
        };
        requestAnimationFrame(draw);
    }

    clear() {
        this.running = false;
        this.caption.classList.remove("visible");
        this.canvas.classList.remove("visible");
        document.body.classList.remove("shake");
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    resize() {
        const dpr = Math.max(1, window.devicePixelRatio || 1);
        this.canvas.width = Math.floor(window.innerWidth * dpr);
        this.canvas.height = Math.floor(window.innerHeight * dpr);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    draw(type, progress) {
        this.resize();
        const w = window.innerWidth;
        const h = window.innerHeight;
        const ctx = this.ctx;
        const lunge = this.easeOut(Math.max(0, (progress - 0.13) / 0.87));
        const impactPulse = progress > 0.12 && progress < 0.28 ? 1 : 0;
        const jitter = () => (Math.random() - 0.5) * (18 + lunge * 46 + impactPulse * 38);

        ctx.fillStyle = progress < 0.05 ? "#f8fff8" : progress < 0.13 ? "#090909" : "#050000";
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 240; i += 1) {
            ctx.fillStyle = `rgba(${105 + Math.random() * 150}, ${Math.random() * 34}, ${Math.random() * 28}, ${Math.random() * (0.24 + lunge * 0.42)})`;
            ctx.fillRect(Math.random() * w + jitter() * 0.4, Math.random() * h, 8 + Math.random() * 240, 1 + Math.random() * 9);
        }

        this.drawScanlines(ctx, w, h, progress);
        this.drawLensDamage(ctx, w, h, lunge);

        if (type === "operator") {
            this.drawOperator(ctx, w, h, jitter, progress, lunge);
        } else if (type === "shaft") {
            this.drawShaft(ctx, w, h, jitter, progress, lunge);
        } else {
            this.drawWatcher(ctx, w, h, jitter, progress, lunge);
        }

        if (progress > 0.78) {
            ctx.fillStyle = `rgba(255, 255, 255, ${(progress - 0.78) * 1.8})`;
            ctx.fillRect(0, 0, w, h);
        }
    }

    drawScanlines(ctx, w, h, progress) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        for (let y = 0; y < h; y += 14) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + Math.random() * 0.08})`;
            ctx.fillRect(0, y + Math.sin(y + this.flashSeed + progress * 90) * 5, w, 2);
        }
        ctx.fillStyle = `rgba(255, 0, 0, ${0.08 + progress * 0.16})`;
        ctx.fillRect(Math.random() * w - w * 0.2, 0, w * (0.08 + Math.random() * 0.24), h);
        ctx.restore();
    }

    drawLensDamage(ctx, w, h, intensity) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.06 + intensity * 0.16})`;
        ctx.lineWidth = 1 + intensity * 3;
        for (let i = 0; i < 9; i += 1) {
            const startX = w * (0.12 + Math.random() * 0.76);
            const startY = h * (0.1 + Math.random() * 0.78);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(startX + (Math.random() - 0.5) * w * 0.32, startY + (Math.random() - 0.5) * h * 0.24);
            ctx.stroke();
        }
        ctx.fillStyle = `rgba(255, 0, 0, ${0.04 + intensity * 0.1})`;
        ctx.fillRect(0, h * (0.08 + Math.random() * 0.8), w, 2 + intensity * 9);
        ctx.restore();
    }

    drawWatcher(ctx, w, h, jitter, progress, lunge) {
        const scale = Math.min(w, h) / 520;
        ctx.save();
        ctx.translate(w / 2 + jitter(), h * (0.5 + lunge * 0.04) + jitter());
        ctx.scale(scale * (1.35 + lunge * 2.35), scale * (1.35 + lunge * 2.35));
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.ellipse(0, -16, 128, 198, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f3fff6";
        ctx.shadowColor = "#ff2020";
        ctx.shadowBlur = 42;
        ctx.beginPath();
        ctx.ellipse(-52, -72, 24, 58, -0.14, 0, Math.PI * 2);
        ctx.ellipse(52, -72, 24, 58, 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#050000";
        ctx.beginPath();
        ctx.ellipse(-52, -58, 7, 30, 0, 0, Math.PI * 2);
        ctx.ellipse(52, -58, 7, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 0, 0, ${0.45 + lunge * 0.45})`;
        ctx.fillRect(-83, -86, 62, 6 + lunge * 11);
        ctx.fillRect(21, -86, 62, 6 + lunge * 11);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 8;
        for (let i = 0; i < 7; i += 1) {
            ctx.beginPath();
            ctx.moveTo(-82 + i * 12, 48 + i * 3);
            ctx.quadraticCurveTo(-18 + jitter() * 0.3, 126 + Math.random() * 44, -30 + i * 12, 96 + i * 6);
            ctx.stroke();
        }
        ctx.restore();
    }

    drawOperator(ctx, w, h, jitter, progress, lunge) {
        ctx.save();
        ctx.translate(w * 0.5 + jitter(), h * (0.36 + lunge * 0.24));
        ctx.scale(0.94 + lunge * 1.22, 0.94 + lunge * 1.22);
        ctx.fillStyle = "#0b0000";
        ctx.fillRect(-w * 0.28, -h * 0.28, w * 0.56, h * 0.68);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 7;
        for (let i = 0; i < 14; i += 1) {
            ctx.beginPath();
            ctx.moveTo(-w * 0.24 + i * w * 0.038, -h * 0.28);
            ctx.bezierCurveTo(-w * 0.1 + jitter(), -h * 0.04, w * 0.08 + jitter(), h * 0.08, -w * 0.26 + i * w * 0.04, h * 0.34);
            ctx.stroke();
        }
        ctx.fillStyle = "#fff";
        ctx.fillRect(-96, -92, 54, 112);
        ctx.fillRect(42, -92, 54, 112);
        ctx.fillStyle = "#000";
        ctx.fillRect(-78, -52, 14, 58);
        ctx.fillRect(62, -52, 14, 58);
        ctx.strokeStyle = `rgba(255, 0, 0, ${0.55 + lunge * 0.35})`;
        ctx.lineWidth = 5 + lunge * 6;
        ctx.beginPath();
        ctx.arc(-68, -24, 44 + lunge * 16, 0, Math.PI * 2);
        ctx.arc(68, -24, 44 + lunge * 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 9;
        ctx.beginPath();
        ctx.moveTo(-84, 96);
        ctx.lineTo(-44, 134 + Math.random() * 22);
        ctx.lineTo(0, 96 + Math.random() * 18);
        ctx.lineTo(44, 134 + Math.random() * 22);
        ctx.lineTo(84, 96);
        ctx.stroke();
        ctx.restore();
    }

    drawShaft(ctx, w, h, jitter, progress, lunge) {
        ctx.save();
        const left = w * (0.1 - lunge * 0.24);
        const right = w * (0.9 + lunge * 0.24);
        ctx.fillStyle = "#151515";
        ctx.fillRect(0, 0, left, h);
        ctx.fillRect(right, 0, w - right, h);
        ctx.fillStyle = "#010000";
        ctx.beginPath();
        ctx.ellipse(w / 2 + jitter(), h * 0.52 + jitter(), w * (0.18 + lunge * 0.42), h * (0.48 + lunge * 0.34), 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.16)";
        ctx.lineWidth = 18;
        ctx.strokeRect(w * 0.22 + jitter(), h * 0.08, w * 0.56, h * 0.84);
        ctx.fillStyle = "#fff";
        ctx.fillRect(w / 2 - 58 + jitter(), h * 0.33, 34, 118);
        ctx.fillRect(w / 2 + 24 + jitter(), h * 0.33, 34, 118);
        ctx.fillStyle = "#090000";
        ctx.fillRect(w / 2 - 46 + jitter(), h * 0.38, 10, 62);
        ctx.fillRect(w / 2 + 36 + jitter(), h * 0.38, 10, 62);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.16 + lunge * 0.4})`;
        ctx.lineWidth = 4;
        for (let y = h * 0.24; y < h * 0.82; y += 34) {
            ctx.beginPath();
            ctx.moveTo(w * 0.3 + jitter(), y);
            ctx.lineTo(w * 0.7 + jitter(), y + lunge * 26);
            ctx.stroke();
        }
        ctx.restore();
    }

    easeOut(value) {
        const clamped = Math.max(0, Math.min(1, value));
        return 1 - Math.pow(1 - clamped, 3);
    }
}
