class Virus {
    constructor(hostEmber, targetAllele) {
        this.host = hostEmber;
        this.targetAllele = targetAllele;
        this.infectionTimer = 0;
        this.killAfter = 10;

        this.dots = Array.from({ length: 5 }, () => ({
            dx: (Math.random() - 0.5) * this.host.radius * 1.5,
            dy: (Math.random() - 0.5) * this.host.radius * 1.5,
        }));
    }

    update(dt) {
        this.infectionTimer += dt;
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
