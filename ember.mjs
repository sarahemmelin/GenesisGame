import { SIZES, BASE_COLORS } from './constants.mjs';
import Allele from './allele.mjs';

class Ember {
    constructor(x,y, parentA = null, parentB = null){
        const colorKeys = Object.keys(BASE_COLORS);
        const sizeKeys = Object.keys(SIZES);
        this.x = x;
        this.y = y;
       
        this.age = 0;
        this.matingCooldown = 300;
        this.gender = Math.random() < 0.5 ? 'male' : 'female';
        this.matingWith = null;
        this.matingTimer = 0;

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
        }

        const size1 = SIZES[this.sizeAlleles[0].value];
        const size2 = SIZES[this.sizeAlleles[1].value];
        this.radius = (size1 * this.sizeAlleles[0].strength + size2 * this.sizeAlleles[1].strength) / (this.sizeAlleles[0].strength + this.sizeAlleles[1].strength);
        this.lifespan = this.radius * 300;
        this.vx = ((Math.random() -0.5) * (30/ this.radius));
        this.vy = ((Math.random() -0.5) * (30/ this.radius));
    }


    draw(ctx){
        const allele1 = this.colorAlleles[0];
        const allele2 = this.colorAlleles[1];
        const rgb1 = BASE_COLORS[allele1.value];
        const rgb2 = BASE_COLORS[allele2.value];

        const r = (rgb1.r * allele1.strength + rgb2.r * allele2.strength) / (allele1.strength + allele2.strength);
        const g = (rgb1.g * allele1.strength + rgb2.g * allele2.strength) / (allele1.strength + allele2.strength);
        const b = (rgb1.b * allele1.strength + rgb2.b * allele2.strength) / (allele1.strength + allele2.strength);
        
        const color = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();



    }

    update(width, height){
        if (this.matingWith !== null && this.gender === 'female') return;
        if (this.matingWith !== null && this.gender === 'male') {
            const distanceX = this.x - this.matingWith.x;
            const distanceY = this.y - this.matingWith.y;
            const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
            const targetDist = this.radius + this.matingWith.radius;
            const stretch = Math.sin(this.matingTimer * 0.1) * 3;
            
            this.x = this.matingWith.x + distanceX / distance * (targetDist + stretch);
            this.y = this.matingWith.y + distanceY / distance * (targetDist + stretch);
            
            this.matingTimer++;


            return;
        }

        if (this.x > width){
             this.vx = -this.vx;
        };

        if (this.x < 0){
             this.vx = -this.vx;
        };

        if (this.y > height){
             this.vy = -this.vy;
        };

        if (this.y < 0){
             this.vy = -this.vy;
        };

        this.x += this.vx;
        this.y += this.vy;
        this.age += 1;

        if (this.matingCooldown > 0){
            this.matingCooldown--;
        };
    }

} 

export default Ember;