class Virus {
    constructor(hostEmber, targetAllele) {
        this.host = hostEmber;
        this.targetAllele = targetAllele;
        this.infectionTimer = 0;
        this.killAfter = 30;
        this.spreadRadius = this.host.radius + 40;

        const count = Math.floor(Math.random() * 31) + 20;
        this.dots = Array.from({ length: count }, () => {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * this.spreadRadius;
            return {
                dx: Math.cos(angle) * r,
                dy: Math.sin(angle) * r,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
            };
        });
    }

    update(dt) {
        this.infectionTimer += dt;

        this.dots.forEach(dot => {
            dot.vx += (Math.random() - 0.5) * 40 * dt;
            dot.vy += (Math.random() - 0.5) * 40 * dt;
            const speed = Math.sqrt(dot.vx ** 2 + dot.vy ** 2);
            if (speed > 30) { dot.vx = dot.vx / speed * 30; dot.vy = dot.vy / speed * 30; }
            dot.dx += dot.vx * dt;
            dot.dy += dot.vy * dt;
            const dist = Math.sqrt(dot.dx ** 2 + dot.dy ** 2);
            if (dist > this.spreadRadius) {
                dot.dx = dot.dx / dist * this.spreadRadius;
                dot.vx *= -0.5;
                dot.vy *= -0.5;
            }
        });

        return this.infectionTimer >= this.killAfter;
    }

    draw(ctx) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'black';
        for (const dot of this.dots) {
            ctx.beginPath();
            ctx.arc(this.host.x + dot.dx, this.host.y + dot.dy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

export default Virus;
