class Germ {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.age = 0;
        this.lifespan = 30 + Math.random() * 30;
        this.radius = 40 + Math.random() * 20;
        this.vx = (Math.random() - 0.5) * 600;
        this.vy = (Math.random() - 0.5) * 600;
        this.rotation = 0;
    }

    update(width, height, dt) {
        if (this.x > width || this.x < 0) this.vx = -this.vx;
        if (this.y > height || this.y < 0) this.vy = -this.vy;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.rotation += 0.3 * dt;
        this.age += dt;
    }

draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.shadowColor = '#333';

    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate(this.rotation + (i * Math.PI / 3));
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(this.radius * 0.6, this.radius * 0.5);
        ctx.lineTo(-this.radius * 0.6, this.radius * 0.5);
        ctx.closePath();
        ctx.fillStyle = `rgba(10, 10, 10, 0.85)`;
        ctx.fill();
        ctx.restore();
    }

    ctx.restore();
}

}

export default Germ;
