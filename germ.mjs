class Germ {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.age = 0;
        this.lifespan = 600 + Math.random() * 600;
        this.radius = 20 + Math.random() * 15;
        this.vx = (Math.random() - 0.5) * 3;
        this.vy = (Math.random() - 0.5) * 3;
        this.rotation = 0;
    }

    update(width, height) {
        if (this.x > width || this.x < 0) this.vx = -this.vx;
        if (this.y > height || this.y < 0) this.vy = -this.vy;
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += 0.02;
        this.age++;
    }

    draw(ctx) {
    }
}

export default Germ;
