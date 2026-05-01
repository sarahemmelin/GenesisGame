import { SIZES, BASE_COLORS } from './constants.mjs';
import Allele from './allele.mjs';

class Ember {
    constructor(x,y, parentA = null, parentB = null, explicitAlleles = null){
        const colorKeys = Object.keys(BASE_COLORS);
        const sizeKeys = Object.keys(SIZES);

//--- Position and lifecycle ---
        this.x = x;
        this.y = y;
        this.age = 0;
        this.gender = explicitAlleles 
        ? explicitAlleles.gender 
        : (Math.random() < 0.5 ? 'male' : 'female');
        this.matingTimer = 0;
        this.squishTimer = 0;
        this.damageTint = 0;

// --- flags and references ---
        this.immortal = false;
        this.squishHeld = false;
        this.matingWith = null;
        this.parent1 = parentA;
        this.parent2 = parentB;
        
//--- Alleles (inherited or born with) ---
        if (parentA !== null && parentB !== null){
            const colorFromA = parentA.colorAlleles[Math.floor(Math.random() * 2)];
            const colorFromB = parentB.colorAlleles[Math.floor(Math.random() * 2)];
            this.colorAlleles = [
                new Allele(colorFromA.gene, colorFromA.value, colorFromA.strength),
                new Allele(colorFromB.gene, colorFromB.value, colorFromB.strength)
            ];

            const sizeFromA = parentA.sizeAlleles[Math.floor(Math.random() * 2)];
            const sizeFromB = parentB.sizeAlleles[Math.floor(Math.random() * 2)];
            this.sizeAlleles = [
                new Allele(sizeFromA.gene, sizeFromA.value, sizeFromA.strength),
                new Allele(sizeFromB.gene, sizeFromB.value, sizeFromB.strength)
            ];

            const saturationFromA = parentA.saturationAlleles[Math.floor(Math.random() * 2)];
            const saturationFromB = parentB.saturationAlleles[Math.floor(Math.random() * 2)];
            this.saturationAlleles = [
                new Allele(saturationFromA.gene, saturationFromA.value, saturationFromA.strength),
                new Allele(saturationFromB.gene, saturationFromB.value, saturationFromB.strength)
            ];

            const glowFromA = parentA.glowAlleles[Math.floor(Math.random() * 2)];
            const glowFromB = parentB.glowAlleles[Math.floor(Math.random() * 2)];
            this.glowAlleles = [
                new Allele(glowFromA.gene, glowFromA.value, glowFromA.strength),
                new Allele(glowFromB.gene, glowFromB.value, glowFromB.strength)
            ];

            const flickerAlleleFromA = parentA.flickerAlleles[Math.floor(Math.random() * 0.1)];
            const flickerAlleleFromB = parentB.flickerAlleles[Math.floor(Math.random() * 0.1)];
            this.flickerAlleles = [
                new Allele(flickerAlleleFromA.gene, flickerAlleleFromA.value, flickerAlleleFromA.strength),
                new Allele(flickerAlleleFromB.gene, flickerAlleleFromB.value, flickerAlleleFromB.strength)
            ];
        } else if (explicitAlleles){
        this.colorAlleles = [
            new Allele('baseColor', explicitAlleles.color),
            new Allele('baseColor', explicitAlleles.color)
        ];

        this.sizeAlleles = [
            new Allele('baseSize', 
            sizeKeys[Math.floor(Math.random() * sizeKeys.length)]),
            new Allele('baseSize',
            sizeKeys[Math.floor(Math.random() * sizeKeys.length)])
        ];

        this.saturationAlleles = [
            new Allele('baseSaturation', Math.random()),
            new Allele('baseSaturation', Math.random())
        ];

        this.glowAlleles = [
            new Allele('baseGlow', Math.random()),
            new Allele('baseGlow', Math.random())
        ];

        this.flickerAlleles = [
            new Allele('baseFlicker', 0, -1),
            new Allele('baseFlicker', 0, -1)
        ];
        } else {
        this.sizeAlleles = [
            new Allele('baseSize', 
            sizeKeys[Math.floor(Math.random() * sizeKeys.length)]),
            new Allele('baseSize',
            sizeKeys[Math.floor(Math.random() * sizeKeys.length)])
        ];

        this.colorAlleles = [
            new Allele('baseColor', 
            colorKeys[Math.floor(Math.random() * colorKeys.length)]),
            new Allele('baseColor', 
            colorKeys[Math.floor(Math.random() * colorKeys.length)]),
        ];

        this.saturationAlleles = [
            new Allele('baseSaturation', Math.random()),
            new Allele('baseSaturation', Math.random())
        ];

        this.glowAlleles = [
            new Allele('baseGlow', Math.random()),
            new Allele('baseGlow', Math.random())
        ];

        this.flickerAlleles = [
            new Allele('baseFlicker', Math.random() * 0.01),
            new Allele('baseFlicker', Math.random() * 0.01)
        ];
        }

//--- Resolve radius and lifespan from size alleles ---
        const size1 = SIZES[this.sizeAlleles[0].value];
        const size2 = SIZES[this.sizeAlleles[1].value];
        this.radius = (size1 * this.sizeAlleles[0].strength + size2 * this.sizeAlleles[1].strength) / (this.sizeAlleles[0].strength + this.sizeAlleles[1].strength);
        this.matingCooldown = 0;
        this.lifespan = this.radius * 5;

//--- Resove color (r,g,b) from color alleles ---
        const allele1 = this.colorAlleles[0];
        const allele2 = this.colorAlleles[1];
        const rgb1 = BASE_COLORS[allele1.value];
        const rgb2 = BASE_COLORS[allele2.value];
        const colorTotal = allele1.strength + allele2.strength;

        if (colorTotal === 0) {
            // Albinism: both allele strengths drifted to zero — no pigment expressed
            this.r = 255;
            this.g = 255;
            this.b = 255;
        } else {
            this.r = (rgb1.r * allele1.strength + rgb2.r * allele2.strength) / colorTotal;
            this.g = (rgb1.g * allele1.strength + rgb2.g * allele2.strength) / colorTotal;
            this.b = (rgb1.b * allele1.strength + rgb2.b * allele2.strength) / colorTotal;
        }

//--- Resolve saturation and glow from alleles ---
        const sat1 = this.saturationAlleles[0];
        const sat2 = this.saturationAlleles[1];
        this.saturation = (sat1.value * sat1.strength + sat2.value * sat2.strength) / (sat1.strength + sat2.strength);

        const glow1 = this.glowAlleles[0];
        const glow2 = this.glowAlleles[1];
        this.glow = (glow1.value * glow1.strength + glow2.value * glow2.strength) / (glow1.strength + glow2.strength);

//--- Flicker epistatis (chance to zero out one color channel at spawn) --- 
        const flickerStrength = (this.flickerAlleles[0].strength + this.flickerAlleles[1].strength) / 2;
        if (Math.random() < flickerStrength) {
            const channels = ['r', 'g', 'b'];
            const channel = channels[Math.floor(Math.random() * 3)];
            this[channel] = 0;
            this.flickeredChannel = channel;
        } else {
            this.flickeredChannel = null;
        }

//--- Velocity (smaller = faster) ---
        this.vx = ((Math.random() - 0.5) * (2400 / this.radius));
        this.vy = ((Math.random() - 0.5) * (2400 / this.radius));

//--- Pre-render glow to offscreen canvas (avoid shadowBlur every frame) ---
        this._glowSpread = 30;
        const safeRadius = (isFinite(this.radius) && this.radius > 0) ? this.radius : 15;
        const glowSize = Math.ceil((safeRadius + this._glowSpread) * 2);
        this._glowCache = new OffscreenCanvas(glowSize, glowSize);
        const gc = this._glowCache.getContext('2d');
        const glowCenter = glowSize / 2;
        const glowColor = `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)})`;
        gc.shadowColor = glowColor;
        gc.shadowBlur = 20;
        gc.fillStyle = glowColor;
        if (this.gender === 'female') {
            gc.beginPath();
            gc.roundRect(glowCenter - this.radius, glowCenter - this.radius, this.radius * 2, this.radius * 2, this.radius * 0.35);
        } else {
            gc.beginPath();
            gc.arc(glowCenter, glowCenter, this.radius, 0, Math.PI * 2);
        }
        gc.fill();
    }


//=== Functions ======
    tracePath(ctx, x, y, r) {
        ctx.beginPath();
        if (this.gender === 'female') {
            ctx.roundRect(x - r, y - r, r * 2, r * 2, r * 0.35);
        } else {
            ctx.arc(x, y, r, 0, Math.PI * 2);
        }
    }

    draw(ctx, isSelected) {
    const alpha = this.damageTint > 0 ? 0.3 + Math.sin(this.damageTint * 1.5) * 0.4 : 1;
    if (this.damageTint > 0) {
        this.damageTint--;
    }
    const color = `rgb(${Math.round(this.r)}, ${Math.round(this.g)}, ${Math.round(this.b)})`;
    const displayRadius = this.age < 10 ? 5 + (this.radius - 5) * (this.age / 10) : this.radius;
    this.displayRadius = displayRadius;

    if (this.squishTimer > 0) {
        this.drawSquish(ctx, color, displayRadius, isSelected);
    } else {
        if (isSelected) {
            ctx.shadowColor = 'white';
            ctx.shadowBlur = 30;
            this.tracePath(ctx, this.x, this.y, displayRadius);
            ctx.fillStyle = color;
            ctx.fill();
        }
        ctx.shadowBlur = 0;
        const scale = displayRadius / this.radius;
        const drawSize = (this.radius + this._glowSpread) * 2 * scale;
        ctx.globalAlpha = alpha;
        ctx.drawImage(this._glowCache, this.x - drawSize / 2, this.y - drawSize / 2, drawSize, drawSize);
        ctx.globalAlpha = 1;
    }
}

drawSquish(ctx, color, displayRadius, isSelected) {
    const flatness = this.squishTimer > 0.8 ? (1.0 - this.squishTimer) / 0.2 : 1;
    const alpha = this.squishTimer <= 0.8 && !this.squishHeld ? this.squishTimer / 0.8 : 1;
    const scaleX = 1 + flatness * 1.5;
    const scaleY = 1 - flatness * 0.8;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(scaleX, scaleY);
    if (isSelected) {
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 30;
        this.tracePath(ctx, 0, 0, displayRadius);
        ctx.fillStyle = color;
        ctx.fill();
    }
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.globalAlpha = alpha;
    this.tracePath(ctx, 0, 0, displayRadius);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
}

update(width, height, dt){
    if (this.squishTimer > 0 && !this.squishHeld) {
        this.squishTimer -= dt;
        return;
    }
    if (this.squishHeld && this.squishTimer <= 0.8) {
        return;
    }

    if (this.matingWith !== null && this.gender === 'female'){
        return;
    }
    if (this.matingWith !== null && this.gender === 'male') {
        const distanceX = this.x - this.matingWith.x;
        const distanceY = this.y - this.matingWith.y;
        const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
        const targetDist = this.radius + this.matingWith.radius;
        const stretch = Math.sin(this.matingTimer * 180 / this.radius) * 3;
        this.x = this.matingWith.x + distanceX / distance * (targetDist + stretch);
        this.y = this.matingWith.y + distanceY / distance * (targetDist + stretch);
        this.matingTimer += dt;
        return;
    }

    if (this.x > width - 230) { this.vx = -Math.abs(this.vx); this.x = width - 230; }
    if (this.x < 0)           { this.vx =  Math.abs(this.vx); this.x = 0; }
    if (this.y > height)      { this.vy = -Math.abs(this.vy); this.y = height; }
    if (this.y < 0)           { this.vy =  Math.abs(this.vy); this.y = 0; }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.age += dt;

    if (this.matingCooldown > 0) {
        this.matingCooldown -= dt;
    }
}
} 

export default Ember;