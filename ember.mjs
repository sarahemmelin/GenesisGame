import { SIZES, BASE_COLORS } from './constants.mjs';
import Allele from './allele.mjs';

class Ember {
    constructor(x,y, parentA = null, parentB = null){
        const colorKeys = Object.keys(BASE_COLORS);
        this.x = x;
        this.y = y;
        this.vx = ((Math.random() -0.5) * 5);
        this.vy = ((Math.random() -0.5) * 5);
        //Small embers should later move faster while bigger embers are slower
       
        this.age = 0;
        this.lifespan = Math.random() * 2000 + 1000;
        this.matingCooldown = 0;
        this.gender = Math.random() < 0.5 ? 'male' : 'female';

        if (parentA !== null && parentB !== null){
            this.colorAlleles = [
                parentA.colorAlleles[Math.floor(Math.random() * 2)],
                parentB.colorAlleles[Math.floor(Math.random() * 2)]
            ];

            this.sizeAlleles = [
                parentA.sizeAlleles[Math.floor(Math.random() * 2)],
                parentB.sizeAlleles[Math.floor(Math.random() * 2)]
            ];

            this.saturationAlleles = [
                parentA.saturationAlleles[Math.floor(Math.random() * 2)],
                parentB.saturationAlleles[Math.floor(Math.random() * 2)]
            ];

            this.glowAlleles = [
                parentA.glowAlleles[Math.floor(Math.random() * 2)],
                parentB.glowAlleles[Math.floor(Math.random() * 2)]
            ];

        } else {
        this.sizeAlleles = [
            new Allele('baseSize', 
            SIZES[Math.floor(Math.random() * SIZES.length)]),
            new Allele('baseSize',
            SIZES[Math.floor(Math.random() * SIZES.length)])
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
        ctx.arc(this.x, this.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    update(width, height){
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